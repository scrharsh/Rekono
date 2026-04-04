import { HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  const paymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const matchingService = {
    autoMatch: jest.fn(),
    findMatches: jest.fn(),
  };

  const smsParserService = {
    parse: jest.fn(),
  };

  let controller: PaymentsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PaymentsController(
      paymentsService as any,
      matchingService as any,
      smsParserService as any,
    );
  });

  it('creates a payment and returns match suggestions', async () => {
    const payment = { _id: 'payment-1' };
    paymentsService.create.mockResolvedValue(payment);
    matchingService.autoMatch.mockResolvedValue(true);
    matchingService.findMatches.mockResolvedValue([
      { saleEntry: { _id: 'sale-1' }, confidence: 95 },
    ]);

    const result = await controller.create(
      'showroom-1',
      {
        amount: 1200,
        timestamp: new Date('2026-04-02T10:00:00.000Z'),
        method: 'phonepe' as any,
      } as any,
      { user: { userId: 'user-1' } },
    );

    expect(paymentsService.create).toHaveBeenCalledWith(
      'showroom-1',
      expect.objectContaining({ amount: 1200, method: 'phonepe' }),
      'user-1',
    );
    expect(matchingService.autoMatch).toHaveBeenCalledWith(payment);
    expect(matchingService.findMatches).toHaveBeenCalledWith(payment);
    expect(result).toEqual({
      payment,
      matches: [{ saleEntry: { _id: 'sale-1' }, confidence: 95 }],
    });
  });

  it('parses SMS and creates a payment record from the parsed payload', async () => {
    const parsed = {
      provider: 'phonepe',
      amount: 3450,
      timestamp: new Date('2026-04-02T11:00:00.000Z'),
      transactionId: 'SMS-TXN-1',
      rawSMS: 'received SMS',
      senderName: 'Rahul',
    };
    const payment = { _id: 'payment-2' };

    smsParserService.parse.mockReturnValue(parsed);
    paymentsService.create.mockResolvedValue(payment);
    matchingService.autoMatch.mockResolvedValue(false);
    matchingService.findMatches.mockResolvedValue([]);

    const result = await controller.ingestSms(
      'showroom-1',
      { smsBody: 'received SMS', sender: 'PHONEPE' },
      { user: { userId: 'user-1' } },
    );

    expect(smsParserService.parse).toHaveBeenCalledWith('received SMS', 'PHONEPE');
    expect(result).toEqual({
      sms: parsed,
      payment,
      matches: [],
    });
  });

  it('returns 400 when SMS cannot be parsed', async () => {
    smsParserService.parse.mockReturnValue(null);

    await expect(
      controller.ingestSms(
        'showroom-1',
        { smsBody: 'unknown sms', sender: 'UNKNOWN' },
        { user: { userId: 'user-1' } },
      ),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'SMS_PARSE_FAILED',
        },
      },
      status: HttpStatus.BAD_REQUEST,
    } as Partial<HttpException>);
  });
});
