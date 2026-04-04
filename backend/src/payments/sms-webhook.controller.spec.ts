import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { SmsWebhookController } from './sms-webhook.controller';

describe('SmsWebhookController', () => {
  const svc = {
    parseSmsBody: jest.fn(),
    upsertPaymentFromSms: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  let controller: SmsWebhookController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SmsWebhookController(svc as any, configService as any);
  });

  it('rejects public webhook when secret is missing in production', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    await expect(
      controller.handleRazorpayWebhook('showroom-1', {}, undefined),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects webhook with invalid secret', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'PAYMENT_WEBHOOK_SECRET') return 'expected-secret';
      return undefined;
    });

    await expect(
      controller.handlePhonepeWebhook('showroom-1', {}, 'wrong-secret'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts webhook with valid secret and processes payment', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'PAYMENT_WEBHOOK_SECRET') return 'expected-secret';
      return undefined;
    });
    svc.upsertPaymentFromSms.mockResolvedValue({ _id: 'payment-1' });

    const payload = {
      event: 'payment_link.completed',
      payload: {
        payment: {
          amount: 12000,
          method: 'upi',
          receipt: 'txn-1',
          notes: {
            description: 'Test payment',
            phone: '9999999999',
          },
        },
      },
    };

    await expect(
      controller.handleRazorpayWebhook('showroom-1', payload, 'expected-secret'),
    ).resolves.toEqual({ status: 'processed', paymentId: 'payment-1' });
    expect(svc.upsertPaymentFromSms).toHaveBeenCalled();
  });
});
