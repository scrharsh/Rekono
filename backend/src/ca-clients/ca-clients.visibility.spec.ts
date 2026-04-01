import { CaClientsService } from './ca-clients.service';

describe('CaClientsService visibility stats', () => {
  const clientModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const serviceModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const paymentModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const documentModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const taskModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  let service: CaClientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CaClientsService(
      clientModel as any,
      serviceModel as any,
      paymentModel as any,
      documentModel as any,
      taskModel as any,
    );
  });

  it('returns command-center stats and at-risk clients for CA visibility', async () => {
    clientModel.countDocuments
      .mockResolvedValueOnce(18)
      .mockResolvedValueOnce(15);

    paymentModel.aggregate.mockResolvedValue([{ total: 125000 }]);
    taskModel.countDocuments.mockResolvedValue(6);
    clientModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([
            { name: 'Alpha Traders', healthScore: 58, phone: '9876543210' },
          ]),
        }),
      }),
    });

    const stats = await service.getStats('507f1f77bcf86cd799439011');

    expect(stats.totalClients).toBe(18);
    expect(stats.activeClients).toBe(15);
    expect(stats.pendingAmount).toBe(125000);
    expect(stats.highPriorityTasks).toBe(6);
    expect(stats.atRiskClients).toHaveLength(1);
  });
});
