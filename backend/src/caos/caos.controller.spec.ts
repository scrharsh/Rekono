import { NotFoundException } from '@nestjs/common';
import { CaosController } from './caos.controller';

describe('CaosController', () => {
  const caosService = {
    generateTasks: jest.fn(),
    generateAlerts: jest.fn(),
    calculateHealthScore: jest.fn(),
    acknowledgeAlert: jest.fn(),
  };

  const caTasksService = {
    updateStatus: jest.fn(),
    createSystemTask: jest.fn(),
    reconcileSystemTasks: jest.fn(),
    findSystemOperationalTasks: jest.fn(),
  };

  const connectionFindChain = {
    populate: jest.fn(),
    sort: jest.fn(),
  };

  const connectionModel = {
    find: jest.fn(),
  };

  let controller: CaosController;

  beforeEach(() => {
    jest.clearAllMocks();

    connectionFindChain.populate.mockReturnValue(connectionFindChain);
    connectionFindChain.sort.mockResolvedValue([]);
    connectionModel.find.mockReturnValue(connectionFindChain);

    controller = new CaosController(
      caosService as any,
      connectionModel as any,
      caTasksService as any,
    );
  });

  it('acknowledges alert using only connected showroom scope', async () => {
    connectionFindChain.sort.mockResolvedValue([
      {
        _id: 'conn-1',
        showroomId: { _id: 'showroom-1', name: 'A' },
        connectedAt: new Date('2026-04-03T10:00:00.000Z'),
      },
      {
        _id: 'conn-2',
        showroomId: { _id: 'showroom-2', name: 'B' },
        connectedAt: new Date('2026-04-03T11:00:00.000Z'),
      },
    ]);
    caosService.acknowledgeAlert.mockResolvedValue(true);

    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const result = await controller.acknowledgeAlert(req, 'alert-1', { notes: 'done' });

    expect(connectionModel.find).toHaveBeenCalledWith({
      caUserId: '507f1f77bcf86cd799439011',
      status: 'active',
    });
    expect(caosService.acknowledgeAlert).toHaveBeenCalledWith(
      'alert-1',
      ['showroom-1', 'showroom-2'],
      'done',
    );
    expect(result).toEqual({
      message: 'Alert acknowledged',
      alertId: 'alert-1',
      notes: 'done',
    });
  });

  it('returns Alert not found when scoped acknowledge has no match', async () => {
    connectionFindChain.sort.mockResolvedValue([
      {
        _id: 'conn-1',
        showroomId: { _id: 'showroom-1', name: 'A' },
        connectedAt: new Date('2026-04-03T10:00:00.000Z'),
      },
    ]);
    caosService.acknowledgeAlert.mockResolvedValue(false);

    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const result = await controller.acknowledgeAlert(req, 'alert-404', { notes: 'n/a' });

    expect(result.message).toBe('Alert not found');
  });

  it('marks task complete using authenticated CA user context', async () => {
    const task = { _id: 'task-1', status: 'completed' };
    caTasksService.updateStatus.mockResolvedValue(task);

    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const result = await controller.completeTask(req, 'task-1', { notes: 'completed from test' });

    expect(caTasksService.updateStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'task-1',
      'completed',
      'completed from test',
    );
    expect(result).toEqual({ message: 'Task marked as complete', task });
  });

  it('rethrows not-found when completing a missing task', async () => {
    caTasksService.updateStatus.mockRejectedValue(new NotFoundException('Task not found'));

    const req = { user: { userId: '507f1f77bcf86cd799439011' } };

    await expect(controller.completeTask(req, 'missing-task', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
