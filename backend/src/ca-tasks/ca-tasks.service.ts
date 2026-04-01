import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaTask, CaTaskDocument, TaskPriority } from '../schemas/ca-task.schema';

@Injectable()
export class CaTasksService {
  constructor(
    @InjectModel(CaTask.name) private taskModel: Model<CaTaskDocument>,
  ) {}

  async create(caUserId: string, dto: any): Promise<CaTaskDocument> {
    return this.taskModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      createdBy: 'manual',
    });
  }

  async createSystemTask(caUserId: string, dto: any): Promise<CaTaskDocument> {
    // Check if similar system task already exists
    const existing = await this.taskModel.findOne({
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      type: dto.type,
      status: { $in: ['pending', 'in_progress'] },
    });
    if (existing) return existing;

    return this.taskModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      createdBy: 'system',
    });
  }

  async findAll(caUserId: string, filters?: { clientId?: string; status?: string; priority?: string }): Promise<CaTaskDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (filters?.clientId) query.clientId = new Types.ObjectId(filters.clientId);
    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;

    const priorityOrder = { [TaskPriority.HIGH]: 0, [TaskPriority.MEDIUM]: 1, [TaskPriority.LOW]: 2 };

    const tasks = await this.taskModel.find(query)
      .populate('clientId', 'name phone healthScore')
      .sort({ status: 1, dueDate: 1 });

    return tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority as TaskPriority] ?? 3;
      const pb = priorityOrder[b.priority as TaskPriority] ?? 3;
      return pa - pb;
    });
  }

  async updateStatus(caUserId: string, taskId: string, status: string, notes?: string): Promise<CaTaskDocument> {
    const update: any = { status };
    if (status === 'completed') update.completedAt = new Date();
    if (notes) update.notes = notes;

    const task = await this.taskModel.findOneAndUpdate(
      { _id: new Types.ObjectId(taskId), caUserId: new Types.ObjectId(caUserId) },
      { $set: update },
      { new: true },
    );
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async delete(caUserId: string, taskId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({
      _id: new Types.ObjectId(taskId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Task not found');
  }

  async getCommandCenterData(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [urgentTasks, approachingDeadlines, allPending] = await Promise.all([
      this.taskModel.find({
        caUserId: caObjId,
        status: { $in: ['pending', 'in_progress'] },
        priority: 'high',
      }).populate('clientId', 'name phone healthScore').sort({ dueDate: 1 }).limit(10),

      this.taskModel.find({
        caUserId: caObjId,
        status: { $in: ['pending', 'in_progress'] },
        dueDate: { $lte: threeDaysFromNow, $gte: now },
      }).populate('clientId', 'name phone healthScore').sort({ dueDate: 1 }).limit(5),

      this.taskModel.countDocuments({
        caUserId: caObjId,
        status: 'pending',
      }),
    ]);

    return {
      urgentIssues: urgentTasks.length,
      approachingDeadlines: approachingDeadlines.length,
      totalPending: allPending,
      focusItems: urgentTasks.slice(0, 3),
      upcomingDeadlines: approachingDeadlines,
      suggestedActions: urgentTasks.map(task => ({
        taskId: task._id,
        title: task.title,
        description: task.description,
        client: task.clientId,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
    };
  }
}
