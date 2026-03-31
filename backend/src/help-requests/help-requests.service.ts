import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HelpRequest, HelpRequestDocument } from '../schemas/help-request.schema';

@Injectable()
export class HelpRequestsService {
  constructor(
    @InjectModel(HelpRequest.name) private helpRequestModel: Model<HelpRequestDocument>,
  ) {}

  async create(
    showroomId: string,
    userId: string,
    description: string,
  ): Promise<HelpRequestDocument> {
    return this.helpRequestModel.create({
      showroomId,
      requestedBy: userId,
      description,
      status: 'pending',
    });
  }

  async findAll(status?: string): Promise<HelpRequestDocument[]> {
    const query: any = {};
    if (status) query.status = status;

    return this.helpRequestModel
      .find(query)
      .populate('showroomId', 'name')
      .populate('requestedBy', 'username')
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 })
      .exec();
  }

  async assign(requestId: string, accountantId: string): Promise<HelpRequestDocument | null> {
    return this.helpRequestModel
      .findByIdAndUpdate(
        requestId,
        {
          assignedTo: accountantId,
          assignedAt: new Date(),
          status: 'assigned',
        },
        { new: true },
      )
      .exec();
  }

  async complete(requestId: string, notes?: string): Promise<HelpRequestDocument | null> {
    return this.helpRequestModel
      .findByIdAndUpdate(
        requestId,
        {
          status: 'completed',
          completedAt: new Date(),
          notes,
        },
        { new: true },
      )
      .exec();
  }
}
