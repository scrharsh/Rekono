import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaTask, CaTaskDocument, TaskPriority } from '../schemas/ca-task.schema';
import { AuditService } from '../audit/audit.service';

const MAX_TASK_LIST_LIMIT = 500;
const MAX_ASSIGNED_TASK_LIMIT = 300;
const MAX_TEAM_OVERVIEW_LIMIT = 500;

@Injectable()
export class CaTasksService {
  constructor(
    @InjectModel(CaTask.name) private taskModel: Model<CaTaskDocument>,
    private readonly auditService: AuditService,
  ) {}

  private normalizeLimit(value: number | undefined, fallback: number, max: number): number {
    if (!Number.isFinite(value ?? NaN)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(value as number), 1), max);
  }

  async create(caUserId: string, dto: any): Promise<CaTaskDocument> {
    const task = await this.taskModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      createdBy: 'manual',
    });

    await this.auditService.log({
      entityType: 'ca_task',
      entityId: String(task._id),
      action: 'create',
      userId: caUserId,
      metadata: {
        source: 'ca-tasks.service.create',
        title: task.title,
        type: task.type,
      },
    });

    return task;
  }

  async createSystemTask(caUserId: string, dto: any): Promise<CaTaskDocument> {
    // Check if similar system task already exists
    const query: Record<string, any> = {
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      type: dto.type,
      status: { $in: ['pending', 'in_progress'] },
    };

    if (dto?.actionData?.showroomId) {
      query['actionData.showroomId'] = String(dto.actionData.showroomId);
    }

    const existing = await this.taskModel.findOne(query);
    if (existing) return existing;

    return this.taskModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      createdBy: 'system',
    });
  }

  async findAll(
    caUserId: string,
    filters?: {
      clientId?: string;
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<CaTaskDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (filters?.clientId) query.clientId = new Types.ObjectId(filters.clientId);
    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;

    const limit = this.normalizeLimit(filters?.limit, 200, MAX_TASK_LIST_LIMIT);
    const offset = Math.max(Math.trunc(filters?.offset ?? 0), 0);

    const priorityOrder = {
      [TaskPriority.HIGH]: 0,
      [TaskPriority.MEDIUM]: 1,
      [TaskPriority.LOW]: 2,
    };

    const tasks = await this.taskModel
      .find(query)
      .populate('clientId', 'name phone healthScore')
      .sort({ status: 1, dueDate: 1 })
      .skip(offset)
      .limit(limit);

    return tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority as TaskPriority] ?? 3;
      const pb = priorityOrder[b.priority as TaskPriority] ?? 3;
      return pa - pb;
    });
  }

  async updateStatus(
    caUserId: string,
    taskId: string,
    status: string,
    notes?: string,
  ): Promise<CaTaskDocument> {
    const update: any = { status };
    if (status === 'completed') update.completedAt = new Date();
    if (notes) update.notes = notes;

    const task = await this.taskModel.findOneAndUpdate(
      { _id: new Types.ObjectId(taskId), caUserId: new Types.ObjectId(caUserId) },
      { $set: update },
      { new: true },
    );
    if (!task) throw new NotFoundException('Task not found');

    await this.auditService.log({
      entityType: 'ca_task',
      entityId: String(task._id),
      action: 'status_change',
      userId: caUserId,
      metadata: {
        source: 'ca-tasks.service.updateStatus',
        status,
        notes,
      },
    });

    return task;
  }

  async delete(caUserId: string, taskId: string): Promise<void> {
    const existing = await this.taskModel.findOne({
      _id: new Types.ObjectId(taskId),
      caUserId: new Types.ObjectId(caUserId),
    });
    const result = await this.taskModel.deleteOne({
      _id: new Types.ObjectId(taskId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Task not found');

    if (existing) {
      await this.auditService.log({
        entityType: 'ca_task',
        entityId: String(existing._id),
        action: 'delete',
        userId: caUserId,
        metadata: {
          source: 'ca-tasks.service.delete',
          title: existing.title,
          type: existing.type,
        },
      });
    }
  }

  /**
   * Assign a task to a team member
   */
  async assignTask(
    caUserId: string,
    taskId: string,
    assignedToUserId: string,
    assignedToName: string,
    dueDate?: Date,
  ): Promise<CaTaskDocument> {
    const update: any = {
      assignedTo: assignedToUserId,
      assignedToName,
      status: 'pending',
    };
    if (dueDate) update.dueDate = dueDate;

    const task = await this.taskModel.findOneAndUpdate(
      { _id: new Types.ObjectId(taskId), caUserId: new Types.ObjectId(caUserId) },
      { $set: update },
      { new: true },
    );
    if (!task) throw new NotFoundException('Task not found');

    await this.auditService.log({
      entityType: 'ca_task',
      entityId: String(task._id),
      action: 'assign',
      userId: caUserId,
      metadata: {
        source: 'ca-tasks.service.assignTask',
        assignedToUserId,
        assignedToName,
        dueDate: dueDate?.toISOString?.(),
      },
    });

    return task;
  }

  async bulkAssignTasks(
    caUserId: string,
    taskIds: string[],
    assignedToUserId: string,
    assignedToName: string,
    dueDate?: Date,
  ): Promise<CaTaskDocument[]> {
    const results: CaTaskDocument[] = [];
    for (const taskId of taskIds) {
      const task = await this.assignTask(
        caUserId,
        taskId,
        assignedToUserId,
        assignedToName,
        dueDate,
      );
      results.push(task);
    }

    await this.auditService.log({
      entityType: 'ca_task',
      entityId: taskIds[0],
      action: 'bulk_assign',
      userId: caUserId,
      metadata: {
        source: 'ca-tasks.service.bulkAssignTasks',
        taskIds,
        assignedToUserId,
        assignedToName,
        dueDate: dueDate?.toISOString?.(),
        count: taskIds.length,
      },
    });

    return results;
  }

  async getTeamOverview(caUserId: string): Promise<any> {
    const tasks = await this.taskModel
      .find({
        caUserId: new Types.ObjectId(caUserId),
        status: { $in: ['pending', 'in_progress'] },
      })
      .populate('clientId', 'name phone')
      .sort({ assignedToName: 1, dueDate: 1, priority: 1 })
      .limit(MAX_TEAM_OVERVIEW_LIMIT);

    const byAssignee = new Map<string, any>();
    const unassigned: any[] = [];

    for (const task of tasks) {
      const assigneeKey = task.assignedTo || 'unassigned';
      const assigneeName = task.assignedToName || 'Unassigned';

      if (!task.assignedTo) {
        unassigned.push(task.toObject());
        continue;
      }

      if (!byAssignee.has(assigneeKey)) {
        byAssignee.set(assigneeKey, {
          assignedTo: assigneeKey,
          assignedToName: assigneeName,
          pending: 0,
          inProgress: 0,
          overdue: 0,
          items: [],
        });
      }

      const entry = byAssignee.get(assigneeKey);
      entry.items.push({
        ...task.toObject(),
        slaStatus: this.calculateSLAStatus(task.dueDate),
      });
      if (task.status === 'pending') entry.pending += 1;
      if (task.status === 'in_progress') entry.inProgress += 1;
      if (this.calculateSLAStatus(task.dueDate) === 'overdue') entry.overdue += 1;
    }

    return {
      assignees: Array.from(byAssignee.values()).sort(
        (a, b) => b.overdue - a.overdue || b.pending - a.pending,
      ),
      unassigned: unassigned.map((task) => ({
        ...task,
        slaStatus: this.calculateSLAStatus(task.dueDate),
      })),
      totals: {
        assignees: byAssignee.size,
        unassigned: unassigned.length,
        tasks: tasks.length,
      },
    };
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getAssignedTasks(
    caUserId: string,
    assignedToUserId: string,
    limit?: number,
  ): Promise<any[]> {
    const now = new Date();
    const taskLimit = this.normalizeLimit(limit, 100, MAX_ASSIGNED_TASK_LIMIT);
    const tasks = await this.taskModel
      .find({
        caUserId: new Types.ObjectId(caUserId),
        assignedTo: assignedToUserId,
        status: { $in: ['pending', 'in_progress'] },
      })
      .populate('clientId', 'name phone')
      .sort({ dueDate: 1, priority: 1 })
      .limit(taskLimit);

    // Add SLA status to each task
    return tasks.map((t) => ({
      ...t.toObject(),
      slaStatus: this.calculateSLAStatus(t.dueDate),
      daysUntilDue: t.dueDate
        ? Math.ceil((t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  /**
   * Calculate SLA status based on due date
   */
  private calculateSLAStatus(dueDate?: Date): 'overdue' | 'at_risk' | 'on_track' {
    if (!dueDate) return 'on_track';

    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return 'overdue';
    if (hoursUntilDue < 24) return 'at_risk';
    return 'on_track';
  }

  async getCommandCenterData(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get all critical work items from different domains
    const [tasks, upcomingWindowTasks, pendingCount, stats] = await Promise.all([
      // Urgent high-priority tasks (within 3 days OR high priority)
      this.taskModel
        .find({
          caUserId: caObjId,
          status: { $in: ['pending', 'in_progress'] },
          $or: [{ priority: 'high' }, { dueDate: { $lte: threeDaysFromNow, $gte: now } }],
        })
        .populate('clientId', 'name phone healthScore')
        .sort({ dueDate: 1 })
        .limit(10),

      // Approaching deadline tasks (3-7 days out)
      this.taskModel
        .find({
          caUserId: caObjId,
          status: { $in: ['pending'] },
          dueDate: { $lte: sevenDaysFromNow, $gt: threeDaysFromNow },
        })
        .populate('clientId', 'name phone healthScore')
        .sort({ dueDate: 1 })
        .limit(5),

      // Count pending
      this.taskModel.countDocuments({
        caUserId: caObjId,
        status: 'pending',
      }),

      // Stats
      this.taskModel.aggregate([
        { $match: { caUserId: caObjId, status: { $in: ['pending', 'in_progress'] } } },
        {
          $group: {
            _id: null,
            pendingTasks: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    // Deduplication: remove overlaps between urgent and upcoming
    const upcomingDeadlines = upcomingWindowTasks.filter(
      (t) => !tasks.some((ut) => ut._id.toString() === t._id.toString()),
    );

    // Recent completed tasks
    const recent = await this.taskModel
      .find({
        caUserId: caObjId,
        status: 'completed',
      })
      .sort({ completedAt: -1 })
      .limit(5);

    return {
      stats: {
        pendingTasks: stats[0]?.pendingTasks ?? 0,
        highPriorityCount: stats[0]?.highPriority ?? 0,
        totalPending: pendingCount,
      },
      urgentTasks: tasks.slice(0, 5).map((t) => {
        const client = t.clientId as any;
        return {
          _id: t._id,
          type: t.type,
          title: t.title,
          description: t.description,
          clientId: t.clientId,
          clientName: client?.name,
          priority: t.priority,
          dueDate: t.dueDate,
          status: t.status,
          daysUntilDue: t.dueDate
            ? Math.ceil((t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        };
      }),
      upcomingTasks: upcomingDeadlines.slice(0, 4).map((t) => {
        const client = t.clientId as any;
        return {
          _id: t._id,
          type: t.type,
          title: t.title,
          clientName: client?.name,
          dueDate: t.dueDate,
          daysUntilDue: t.dueDate
            ? Math.ceil((t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        };
      }),
      recentTasks: recent.slice(0, 3).map((t) => {
        const client = t.clientId as any;
        return {
          _id: t._id,
          title: t.title,
          clientName: client?.name,
          completedAt: t.completedAt,
        };
      }),
      focusItems: tasks.slice(0, 3),
      suggestedActions: tasks.slice(0, 5).map((task) => ({
        taskId: task._id,
        title: task.title,
        description: task.description,
        client: task.clientId,
        priority: task.priority,
        dueDate: task.dueDate,
        actionRequired: true,
      })),
    };
  }

  async findSystemOperationalTasks(
    caUserId: string,
    showroomId?: string,
  ): Promise<CaTaskDocument[]> {
    const query: Record<string, any> = {
      caUserId: new Types.ObjectId(caUserId),
      createdBy: 'system',
      status: { $in: ['pending', 'in_progress'] },
    };

    if (showroomId) {
      query['actionData.showroomId'] = String(showroomId);
    }

    const priorityOrder = {
      [TaskPriority.HIGH]: 0,
      [TaskPriority.MEDIUM]: 1,
      [TaskPriority.LOW]: 2,
    };

    const tasks = await this.taskModel
      .find(query)
      .populate('clientId', 'name phone healthScore')
      .sort({ dueDate: 1, updatedAt: -1 });

    return tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority as TaskPriority] ?? 3;
      const pb = priorityOrder[b.priority as TaskPriority] ?? 3;
      return pa - pb;
    });
  }

  async reconcileSystemTasks(
    caUserId: string,
    showroomId: string,
    activeTypes: string[],
  ): Promise<void> {
    await this.taskModel.updateMany(
      {
        caUserId: new Types.ObjectId(caUserId),
        createdBy: 'system',
        'actionData.showroomId': String(showroomId),
        status: { $in: ['pending', 'in_progress'] },
        type: { $nin: activeTypes },
      },
      {
        $set: {
          status: 'cancelled',
          notes: 'Auto-closed by CA OS after condition no longer applied',
          completedAt: new Date(),
        },
      },
    );
  }
}
