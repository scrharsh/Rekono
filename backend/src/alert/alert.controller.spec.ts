import { AlertController } from './alert.controller';

describe('AlertController', () => {
  const alertService = {
    triggerForCA: jest.fn(),
  };

  let controller: AlertController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AlertController(alertService as any);
  });

  it('runs jobs for authenticated CA user', async () => {
    alertService.triggerForCA.mockResolvedValue({
      evaluated: 2,
      alertsGenerated: 5,
      tasksGenerated: 4,
    });

    const req = { user: { userId: 'ca-123' } };
    const result = await controller.runForCurrentCA(req);

    expect(alertService.triggerForCA).toHaveBeenCalledWith('ca-123');
    expect(result).toEqual({
      evaluated: 2,
      alertsGenerated: 5,
      tasksGenerated: 4,
    });
  });
});
