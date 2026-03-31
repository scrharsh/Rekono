import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Showroom, ShowroomDocument } from '../schemas/showroom.schema';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(Connection.name) private connectionModel: Model<ConnectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Showroom.name) private showroomModel: Model<ShowroomDocument>,
  ) {}

  /** Showroom searches for a CA by username */
  async findCA(username: string): Promise<any> {
    const ca = await this.userModel.findOne({ username, role: 'ca' }).select('-password');
    if (!ca) throw new NotFoundException('CA not found on this platform');
    return { id: ca._id, username: ca.username };
  }

  /** Showroom sends a connection request to a CA */
  async requestConnection(
    showroomId: string,
    caUsername: string,
    message?: string,
  ): Promise<ConnectionDocument> {
    const ca = await this.userModel.findOne({ username: caUsername, role: 'ca' });
    if (!ca) throw new NotFoundException('CA not found');

    const existing = await this.connectionModel.findOne({ showroomId, caUserId: ca._id });
    if (existing) {
      if (existing.status === 'active') throw new ConflictException('Already connected to this CA');
      if (existing.status === 'pending')
        throw new ConflictException('Connection request already pending');
      // Allow re-requesting if rejected/disconnected
      existing.status = 'pending';
      existing.message = message;
      existing.rejectionReason = undefined;
      return existing.save();
    }

    return this.connectionModel.create({
      showroomId,
      caUserId: ca._id,
      message,
      status: 'pending',
    });
  }

  /** CA accepts a connection request */
  async acceptConnection(connectionId: string, caUserId: string): Promise<ConnectionDocument> {
    const conn = await this.connectionModel.findById(connectionId);
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.caUserId.toString() !== caUserId)
      throw new ForbiddenException('Not your connection request');
    if (conn.status !== 'pending') throw new ConflictException('Connection is not pending');

    conn.status = 'active';
    conn.connectedAt = new Date();
    return conn.save();
  }

  /** CA rejects a connection request */
  async rejectConnection(
    connectionId: string,
    caUserId: string,
    reason?: string,
  ): Promise<ConnectionDocument> {
    const conn = await this.connectionModel.findById(connectionId);
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.caUserId.toString() !== caUserId)
      throw new ForbiddenException('Not your connection request');

    conn.status = 'rejected';
    conn.rejectionReason = reason;
    return conn.save();
  }

  /** Showroom disconnects from a CA */
  async disconnect(connectionId: string, showroomId: string): Promise<void> {
    const conn = await this.connectionModel.findById(connectionId);
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.showroomId.toString() !== showroomId)
      throw new ForbiddenException('Not your connection');

    conn.status = 'disconnected';
    await conn.save();
  }

  /** Get all connections for a showroom */
  async getShowroomConnections(showroomId: string): Promise<any[]> {
    const conns = await this.connectionModel
      .find({ showroomId })
      .populate('caUserId', 'username')
      .sort({ createdAt: -1 });

    return conns.map((c) => ({
      id: c._id,
      ca: c.caUserId,
      status: c.status,
      message: c.message,
      connectedAt: c.connectedAt,
      createdAt: c.createdAt,
    }));
  }

  /** Get all connection requests for a CA */
  async getCAConnections(caUserId: string): Promise<any[]> {
    const conns = await this.connectionModel
      .find({ caUserId })
      .populate('showroomId', 'name gstin phone')
      .sort({ createdAt: -1 });

    return conns.map((c) => ({
      id: c._id,
      showroom: c.showroomId,
      status: c.status,
      message: c.message,
      connectedAt: c.connectedAt,
      createdAt: c.createdAt,
    }));
  }

  /** Check if a showroom is connected to a CA */
  async isConnected(showroomId: string, caUserId: string): Promise<boolean> {
    const conn = await this.connectionModel.findOne({ showroomId, caUserId, status: 'active' });
    return !!conn;
  }
}
