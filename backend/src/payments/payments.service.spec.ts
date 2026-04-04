import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const save = jest.fn(function (this: any) {
    return Promise.resolve(this);
  });

  const paymentRecordModel = jest.fn().mockImplementation((doc) => ({
    ...doc,
    save,
  }));

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(paymentRecordModel as any);
  });

  it('maps payment dto fields into payment record schema fields', async () => {
    const timestamp = new Date('2026-04-02T10:00:00.000Z');

    const result = await service.create(
      'showroom-1',
      {
        amount: 2500,
        timestamp,
        method: 'phonepe' as any,
        transactionId: 'TXN-123',
        senderName: 'Rahul',
        rawSMS: 'SMS text',
      },
      'user-1',
    );

    expect(paymentRecordModel).toHaveBeenCalledWith(
      expect.objectContaining({
        showroomId: 'showroom-1',
        amount: 2500,
        source: 'sms',
        paymentMethod: 'PhonePe',
        transactionId: 'TXN-123',
        sender: 'Rahul',
        rawSMS: 'SMS text',
        createdBy: 'user-1',
        status: 'unmatched',
      }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      showroomId: 'showroom-1',
      amount: 2500,
      source: 'sms',
      paymentMethod: 'PhonePe',
      transactionId: 'TXN-123',
      sender: 'Rahul',
      rawSMS: 'SMS text',
      createdBy: 'user-1',
      status: 'unmatched',
      timestamp,
      save,
    });
  });

  it('filters by paymentMethod when listing payments', async () => {
    const find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    const countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

    service = new PaymentsService({ find, countDocuments } as any);

    await service.findAll('showroom-1', {
      method: 'Google Pay',
      limit: 10,
      offset: 0,
    });

    expect(find).toHaveBeenCalledWith({
      showroomId: 'showroom-1',
      paymentMethod: 'Google Pay',
    });
    expect(countDocuments).toHaveBeenCalledWith({
      showroomId: 'showroom-1',
      paymentMethod: 'Google Pay',
    });
  });
});
