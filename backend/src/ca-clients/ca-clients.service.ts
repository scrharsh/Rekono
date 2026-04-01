import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaClient, CaClientDocument } from '../schemas/ca-client.schema';
import { CaService, CaServiceDocument } from '../schemas/ca-service.schema';
import { CaPayment, CaPaymentDocument } from '../schemas/ca-payment.schema';
import { CaDocument, CaDocumentDocument } from '../schemas/ca-document.schema';
import { CaTask, CaTaskDocument } from '../schemas/ca-task.schema';
import { CreateCaClientDto, UpdateCaClientDto } from './dto/ca-client.dto';

@Injectable()
export class CaClientsService {
  constructor(
    @InjectModel(CaClient.name) private clientModel: Model<CaClientDocument>,
    @InjectModel(CaService.name) private serviceModel: Model<CaServiceDocument>,
    @InjectModel(CaPayment.name) private paymentModel: Model<CaPaymentDocument>,
    @InjectModel(CaDocument.name) private documentModel: Model<CaDocumentDocument>,
    @InjectModel(CaTask.name) private taskModel: Model<CaTaskDocument>,
  ) {}

  async create(caUserId: string, dto: CreateCaClientDto): Promise<CaClientDocument> {
    const existing = await this.clientModel.findOne({
      caUserId: new Types.ObjectId(caUserId),
      phone: dto.phone,
    });
    if (existing) {
      throw new ConflictException('Client with this phone number already exists');
    }

    return this.clientModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
    });
  }

  async findAll(
    caUserId: string,
    filters?: { status?: string; search?: string; sortBy?: string; order?: 'asc' | 'desc' },
  ): Promise<CaClientDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search } },
        { businessName: { $regex: filters.search, $options: 'i' } },
        { gstin: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const sortField = filters?.sortBy || 'name';
    const sortOrder = filters?.order === 'desc' ? -1 : 1;

    return this.clientModel
      .find(query)
      .sort({ [sortField]: sortOrder })
      .exec();
  }

  async findById(caUserId: string, clientId: string): Promise<CaClientDocument> {
    const client = await this.clientModel.findOne({
      _id: new Types.ObjectId(clientId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(caUserId: string, clientId: string, dto: UpdateCaClientDto): Promise<CaClientDocument> {
    const client = await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(clientId), caUserId: new Types.ObjectId(caUserId) },
      { $set: dto },
      { new: true },
    );
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async delete(caUserId: string, clientId: string): Promise<void> {
    const result = await this.clientModel.deleteOne({
      _id: new Types.ObjectId(clientId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Client not found');
    }
  }

  async getWorkspace(caUserId: string, clientId: string): Promise<any> {
    const client = await this.findById(caUserId, clientId);
    const clientObjId = new Types.ObjectId(clientId);

    const [services, payments, documents, tasks] = await Promise.all([
      this.serviceModel.find({ clientId: clientObjId, caUserId: new Types.ObjectId(caUserId) }).sort({ createdAt: -1 }),
      this.paymentModel.find({ clientId: clientObjId, caUserId: new Types.ObjectId(caUserId) }).sort({ dueDate: -1 }),
      this.documentModel.find({ clientId: clientObjId, caUserId: new Types.ObjectId(caUserId) }).sort({ createdAt: -1 }),
      this.taskModel.find({ clientId: clientObjId, caUserId: new Types.ObjectId(caUserId), status: { $ne: 'completed' } }).sort({ priority: 1, dueDate: 1 }),
    ]);

    const totalFees = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = totalFees - paidAmount;

    const requiredDocTypes = ['pan', 'gst_certificate', 'aadhaar', 'bank_details'];
    const uploadedDocTypes = documents.map(d => d.documentType);
    const missingDocs = requiredDocTypes.filter(t => !uploadedDocTypes.includes(t));

    const activeServices = services.filter(s => s.status === 'active');
    const activeTasks = tasks.filter(t => t.status !== 'cancelled');

    return {
      client,
      services: {
        items: services,
        activeCount: activeServices.length,
        totalCount: services.length,
      },
      payments: {
        items: payments,
        totalFees,
        paidAmount,
        pendingAmount,
        overdueCount: payments.filter(p => p.status === 'overdue').length,
      },
      documents: {
        items: documents,
        uploadedCount: documents.length,
        missingDocuments: missingDocs,
        completeness: Math.round(((requiredDocTypes.length - missingDocs.length) / requiredDocTypes.length) * 100),
      },
      tasks: {
        items: activeTasks,
        highPriorityCount: activeTasks.filter(t => t.priority === 'high').length,
        totalPending: activeTasks.filter(t => t.status === 'pending').length,
      },
    };
  }

  async calculateHealthScore(caUserId: string, clientId: string): Promise<{ score: number; factors: any[] }> {
    const clientObjId = new Types.ObjectId(clientId);
    const caObjId = new Types.ObjectId(caUserId);
    let score = 100;
    const factors: any[] = [];

    // Document completeness
    const requiredDocTypes = ['pan', 'gst_certificate', 'aadhaar', 'bank_details'];
    const documents = await this.documentModel.find({ clientId: clientObjId, caUserId: caObjId });
    const uploadedTypes = documents.map(d => d.documentType);
    const missingDocs = requiredDocTypes.filter(t => !uploadedTypes.includes(t));
    if (missingDocs.length > 0) {
      const deduction = missingDocs.length * 5;
      score -= deduction;
      factors.push({ reason: `${missingDocs.length} missing documents`, deduction, details: missingDocs });
    }

    // Overdue payments
    const overduePayments = await this.paymentModel.countDocuments({ clientId: clientObjId, caUserId: caObjId, status: 'overdue' });
    if (overduePayments > 0) {
      const deduction = Math.min(20, overduePayments * 5);
      score -= deduction;
      factors.push({ reason: `${overduePayments} overdue payments`, deduction });
    }

    // Pending tasks
    const pendingHighTasks = await this.taskModel.countDocuments({ clientId: clientObjId, caUserId: caObjId, status: 'pending', priority: 'high' });
    if (pendingHighTasks > 0) {
      const deduction = Math.min(15, pendingHighTasks * 5);
      score -= deduction;
      factors.push({ reason: `${pendingHighTasks} high-priority pending tasks`, deduction });
    }

    // Overdue services
    const overdueServices = await this.serviceModel.countDocuments({
      clientId: clientObjId,
      caUserId: caObjId,
      'periodStatuses.status': 'overdue',
    });
    if (overdueServices > 0) {
      const deduction = Math.min(20, overdueServices * 10);
      score -= deduction;
      factors.push({ reason: `${overdueServices} overdue service periods`, deduction });
    }

    const finalScore = Math.max(0, score);

    await this.clientModel.updateOne(
      { _id: clientObjId, caUserId: caObjId },
      { $set: { healthScore: finalScore } },
    );

    return { score: finalScore, factors };
  }

  async getStats(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);

    const [totalClients, activeClients, totalPendingPayments, highPriorityTasks] = await Promise.all([
      this.clientModel.countDocuments({ caUserId: caObjId }),
      this.clientModel.countDocuments({ caUserId: caObjId, status: 'active' }),
      this.paymentModel.aggregate([
        { $match: { caUserId: caObjId, status: { $in: ['pending', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.taskModel.countDocuments({ caUserId: caObjId, status: 'pending', priority: 'high' }),
    ]);

    const pendingAmount = totalPendingPayments.length > 0 ? totalPendingPayments[0].total : 0;

    // Clients at risk (health score < 70)
    const atRiskClients = await this.clientModel
      .find({ caUserId: caObjId, healthScore: { $lt: 70 } })
      .sort({ healthScore: 1 })
      .limit(5)
      .select('name healthScore phone');

    return {
      totalClients,
      activeClients,
      pendingAmount,
      highPriorityTasks,
      atRiskClients,
    };
  }
}
