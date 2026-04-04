import { SmsParserService } from './sms-parser.service';

describe('SmsParserService', () => {
  const service = new SmsParserService();

  it('parses a PhonePe credit SMS', () => {
    const parsed = service.parse(
      'Rs. 2,500 received from Rahul on 02/04/2026 UPI Ref no 1234567890',
      'PHONEPE',
    );

    expect(parsed).toMatchObject({
      provider: 'phonepe',
      amount: 2500,
      transactionId: '1234567890',
      rawSMS: 'Rs. 2,500 received from Rahul on 02/04/2026 UPI Ref no 1234567890',
    });
    expect(parsed?.timestamp).toBeInstanceOf(Date);
  });

  it('parses a Google Pay credit SMS', () => {
    const parsed = service.parse(
      'You received Rs. 799 from Meena on 02/04/2026 UPI transaction ID: GPAY123',
      'GPAY',
    );

    expect(parsed).toMatchObject({
      provider: 'googlepay',
      amount: 799,
      transactionId: 'GPAY123',
    });
  });

  it('returns null for unknown SMS bodies', () => {
    expect(service.parse('Random message with no payment data', 'UNKNOWN')).toBeNull();
  });
});
