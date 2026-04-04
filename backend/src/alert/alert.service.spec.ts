import { AlertService } from './alert.service';

describe('AlertService', () => {
  const connectionModel = {
    find: jest.fn(),
  };

  const caosService = {
    generateAlerts: jest.fn(),
    generateTasks: jest.fn(),
  };

  const caTasksService = {
    createSystemTask: jest.fn(),
    reconcileSystemTasks: jest.fn(),
  };

  let service: AlertService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertService(connectionModel as any, caosService as any, caTasksService as any);
  });

  it('triggers automation only for active connections of current CA', async () => {
    connectionModel.find.mockResolvedValue([
      { showroomId: 'showroom-1', caUserId: 'ca-1' },
      { showroomId: 'showroom-2', caUserId: 'ca-1' },
    ]);

    caosService.generateAlerts.mockResolvedValue([{ id: 'a1' }]);
    caosService.generateTasks.mockResolvedValue([
      {
        type: 'review_unmatched',
        priority: 'high',
        title: 'Review unmatched',
        description: 'Review unmatched records',
        dueDate: new Date('2026-04-03T10:00:00.000Z'),
      },
    ]);

    const result = await service.triggerForCA('ca-1');

    expect(connectionModel.find).toHaveBeenCalledWith({ status: 'active', caUserId: 'ca-1' });
    expect(caosService.generateAlerts).toHaveBeenCalledTimes(2);
    expect(caosService.generateTasks).toHaveBeenCalledTimes(4);
    expect(caTasksService.createSystemTask).toHaveBeenCalled();
    expect(caTasksService.reconcileSystemTasks).toHaveBeenCalledWith('ca-1', 'showroom-1', [
      'review_unmatched',
    ]);
    expect(result.evaluated).toBe(2);
    expect(result.alertsGenerated).toBe(2);
    expect(result.tasksGenerated).toBe(2);
  });

  it('returns zero counts when no active connections exist', async () => {
    connectionModel.find.mockResolvedValue([]);

    const result = await service.triggerForCA('ca-2');

    expect(result).toEqual({
      evaluated: 0,
      alertsGenerated: 0,
      tasksGenerated: 0,
    });
  });

  it('periodic automation continues when one connection fails', async () => {
    connectionModel.find.mockResolvedValue([
      { showroomId: 'showroom-1', caUserId: 'ca-1' },
      { showroomId: 'showroom-2', caUserId: 'ca-2' },
    ]);

    caosService.generateAlerts
      .mockResolvedValueOnce([{ id: 'a1' }])
      .mockRejectedValueOnce(new Error('boom'));
    caosService.generateTasks.mockResolvedValue([
      {
        type: 'review_unmatched',
        priority: 'high',
        title: 'Review unmatched',
        description: 'Review unmatched records',
        dueDate: new Date('2026-04-03T10:00:00.000Z'),
      },
    ]);

    await expect(service.runPeriodicAutomation()).resolves.toBeUndefined();
    expect(caosService.generateAlerts).toHaveBeenCalledTimes(2);
  });
});
