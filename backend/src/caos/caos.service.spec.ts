import { CaosService } from './caos.service';

describe('CaosService', () => {
  const saleEntryModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const paymentRecordModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const matchModel = {
    countDocuments: jest.fn(),
  };

  const alertModel = {
    find: jest.fn(),
    updateOne: jest.fn(),
  };

  let service: CaosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CaosService(
      saleEntryModel as any,
      paymentRecordModel as any,
      matchModel as any,
      alertModel as any,
    );
  });

  it('returns false when acknowledge is requested without any allowed showrooms', async () => {
    const result = await service.acknowledgeAlert('alert-1', []);

    expect(result).toBe(false);
    expect(alertModel.updateOne).not.toHaveBeenCalled();
  });

  it('acknowledges only within allowed showroom scope', async () => {
    alertModel.updateOne.mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 });

    const result = await service.acknowledgeAlert('alert-1', ['showroom-1', 'showroom-2'], 'resolved');

    expect(alertModel.updateOne).toHaveBeenCalledWith(
      {
        alertId: 'alert-1',
        showroomId: { $in: ['showroom-1', 'showroom-2'] },
      },
      {
        $set: {
          acknowledgedAt: expect.any(Date),
          acknowledgedNotes: 'resolved',
          active: false,
          resolvedAt: expect.any(Date),
        },
      },
    );
    expect(result).toBe(true);
  });

  it('returns false when no alert was modified for given scope', async () => {
    alertModel.updateOne.mockResolvedValue({ modifiedCount: 0, upsertedCount: 0 });

    const result = await service.acknowledgeAlert('alert-1', ['showroom-1']);

    expect(result).toBe(false);
  });
});
