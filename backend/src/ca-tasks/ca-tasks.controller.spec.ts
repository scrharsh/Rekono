import { CaTasksController } from './ca-tasks.controller';

describe('CaTasksController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    getAssignedTasks: jest.fn(),
    getCommandCenterData: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    assignTask: jest.fn(),
    bulkAssignTasks: jest.fn(),
    getTeamOverview: jest.fn(),
  };

  let controller: CaTasksController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CaTasksController(service as any);
  });

  it('forwards bulk assignment requests to the service', async () => {
    service.bulkAssignTasks.mockResolvedValue(['task-1']);

    const result = await controller.bulkAssignTasks({ user: { userId: 'ca-1' } } as any, {
      taskIds: ['task-1'],
      assignedToUserId: 'user-1',
      assignedToName: 'Team Member',
      dueDate: '2025-01-01T00:00:00.000Z',
    });

    expect(result).toEqual(['task-1']);
    expect(service.bulkAssignTasks).toHaveBeenCalledWith(
      'ca-1',
      ['task-1'],
      'user-1',
      'Team Member',
      new Date('2025-01-01T00:00:00.000Z'),
    );
  });

  it('returns the team overview for the signed-in CA', async () => {
    service.getTeamOverview.mockResolvedValue({ totals: { tasks: 1 } });

    const result = await controller.getTeamOverview({ user: { userId: 'ca-1' } } as any);

    expect(result).toEqual({ totals: { tasks: 1 } });
    expect(service.getTeamOverview).toHaveBeenCalledWith('ca-1');
  });
});
