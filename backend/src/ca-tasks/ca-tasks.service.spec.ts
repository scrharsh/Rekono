import { Types } from 'mongoose';
import { CaTasksService } from './ca-tasks.service';

describe('CaTasksService', () => {
  const chain = {
    populate: jest.fn(),
    sort: jest.fn(),
  };

  const taskModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  let service: CaTasksService;

  beforeEach(() => {
    jest.clearAllMocks();

    chain.populate.mockReturnValue(chain);
    chain.sort.mockResolvedValue([]);
    taskModel.find.mockReturnValue(chain);

    service = new CaTasksService(taskModel as any, auditService as any);
  });

  it('checks showroom-aware dedupe before creating system task', async () => {
    taskModel.findOne.mockResolvedValue(null);
    taskModel.create.mockResolvedValue({ _id: 'task-1' });

    await service.createSystemTask('507f1f77bcf86cd799439011', {
      type: 'review_unmatched',
      title: 'Review unmatched',
      priority: 'high',
      actionData: { showroomId: 'showroom-1' },
    });

    expect(taskModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        caUserId: expect.any(Types.ObjectId),
        type: 'review_unmatched',
        status: { $in: ['pending', 'in_progress'] },
        'actionData.showroomId': 'showroom-1',
      }),
    );
  });

  it('returns existing system task when dedupe finds one', async () => {
    const existing = { _id: 'task-existing' };
    taskModel.findOne.mockResolvedValue(existing);

    const result = await service.createSystemTask('507f1f77bcf86cd799439011', {
      type: 'review_unmatched',
      title: 'Review unmatched',
      priority: 'high',
      actionData: { showroomId: 'showroom-1' },
    });

    expect(taskModel.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('reconciles stale system tasks by auto-cancelling non-active types', async () => {
    await service.reconcileSystemTasks('507f1f77bcf86cd799439011', 'showroom-1', ['review_unmatched']);

    expect(taskModel.updateMany).toHaveBeenCalledWith(
      {
        caUserId: expect.any(Types.ObjectId),
        createdBy: 'system',
        'actionData.showroomId': 'showroom-1',
        status: { $in: ['pending', 'in_progress'] },
        type: { $nin: ['review_unmatched'] },
      },
      {
        $set: {
          status: 'cancelled',
          notes: 'Auto-closed by CA OS after condition no longer applied',
          completedAt: expect.any(Date),
        },
      },
    );
  });

  it('filters operational system tasks by optional showroom', async () => {
    await service.findSystemOperationalTasks('507f1f77bcf86cd799439011', 'showroom-9');

    expect(taskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        caUserId: expect.any(Types.ObjectId),
        createdBy: 'system',
        status: { $in: ['pending', 'in_progress'] },
        'actionData.showroomId': 'showroom-9',
      }),
    );
  });

  it('logs task assignment and returns the updated task', async () => {
    taskModel.findOneAndUpdate.mockResolvedValue({ _id: 'task-1' });

    const result = await service.assignTask(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      'user-1',
      'Team Member',
      new Date('2025-01-01T00:00:00.000Z'),
    );

    expect(result).toEqual({ _id: 'task-1' });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'ca_task',
        action: 'assign',
        userId: '507f1f77bcf86cd799439011',
      }),
    );
  });

  it('bulk assigns each task and records a batch audit entry', async () => {
    taskModel.findOneAndUpdate.mockResolvedValueOnce({ _id: 'task-1' }).mockResolvedValueOnce({ _id: 'task-2' });

    await service.bulkAssignTasks(
      '507f1f77bcf86cd799439011',
      ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
      'user-1',
      'Team Member',
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'bulk_assign',
        metadata: expect.objectContaining({
          count: 2,
          taskIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        }),
      }),
    );
  });

  it('groups team tasks by assignee in the overview', async () => {
    taskModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([
        {
          _id: 'task-1',
          assignedTo: 'user-1',
          assignedToName: 'Team Member',
          status: 'pending',
          dueDate: new Date('2025-01-02T00:00:00.000Z'),
          priority: 'high',
          toObject: () => ({ _id: 'task-1', assignedTo: 'user-1', assignedToName: 'Team Member', status: 'pending', dueDate: new Date('2025-01-02T00:00:00.000Z'), priority: 'high' }),
        },
        {
          _id: 'task-2',
          status: 'in_progress',
          dueDate: new Date('2025-01-03T00:00:00.000Z'),
          priority: 'medium',
          toObject: () => ({ _id: 'task-2', status: 'in_progress', dueDate: new Date('2025-01-03T00:00:00.000Z'), priority: 'medium' }),
        },
      ]),
    } as any);

    const overview = await service.getTeamOverview('507f1f77bcf86cd799439011');

    expect(overview.totals.tasks).toBe(2);
    expect(overview.assignees).toHaveLength(1);
    expect(overview.unassigned).toHaveLength(1);
  });
});
