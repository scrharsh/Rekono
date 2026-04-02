import { Injectable, Logger } from '@nestjs/common';

export enum PaymentMethod {
  PHONEPE = 'phonepe',
  GOOGLEPAY = 'googlepay',
  PAYTM = 'paytm',
  BHIM = 'bhim',
  BANK = 'bank',
  CASH = 'cash',
}

export interface ParsedPayment {
  provider: PaymentMethod;
  amount: number;
  timestamp: Date;
  senderName?: string;
  transactionId: string;
  rawSMS: string;
}

interface SMSPattern {
  sender: RegExp;
  amount: RegExp;
  transactionId: RegExp;
  timestamp?: RegExp;
}

@Injectable()
export class SmsParserService {
  private readonly logger = new Logger(SmsParserService.name);

  private patterns: Record<PaymentMethod, SMSPattern> = {
    phonepe: {
      sender: /PhonePe|PHONEPE/i,
      amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /Ref\s*(?:ID|No)?\s*:?\s*(\w+)/i,
      timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    },
    googlepay: {
      sender: /GPAY|GOOGLEPAY|Google\s*Pay/i,
      amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /UPI\s*(?:transaction\s*)?(?:Ref|ID)\s*:?\s*(\w+)/i,
      timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    },
    paytm: {
      sender: /PAYTM|PayTM/i,
      amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /Order\s*(?:ID|No)\s*:?\s*(\w+)/i,
      timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    },
    bhim: {
      sender: /BHIM|UPI/i,
      amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /(?:Ref|UPI)\s*(?:No|ID)\s*:?\s*(\w+)/i,
      timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    },
    bank: {
      sender: /BANK|HDFC|ICICI|SBI|AXIS/i,
      amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /(?:Ref|Txn)\s*(?:No|ID)\s*:?\s*(\w+)/i,
    },
    cash: {
      sender: /CASH/i,
      amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
      transactionId: /.*/,
    },
  };

  parse(smsBody: string, sender: string): ParsedPayment | null {
    try {
      const provider = this.detectProvider(smsBody, sender);
      if (!provider) {
        this.logger.warn('Could not detect payment provider from SMS');
        return null;
      }

      const pattern = this.patterns[provider];

      const amountMatch = smsBody.match(pattern.amount);
      if (!amountMatch) {
        this.logger.warn('Could not extract amount from SMS');
        return null;
      }
      const amount = this.parseAmount(amountMatch[1]);

      const transactionIdMatch = smsBody.match(pattern.transactionId);
      if (!transactionIdMatch && provider !== 'cash') {
        this.logger.warn('Could not extract transaction ID from SMS');
        return null;
      }
      const transactionId = transactionIdMatch ? transactionIdMatch[1] : 'CASH-' + Date.now();

      let timestamp = new Date();
      if (pattern.timestamp) {
        const timestampMatch = smsBody.match(pattern.timestamp);
        if (timestampMatch) {
          timestamp = this.parseTimestamp(timestampMatch[1]);
        }
      }

      return {
        provider,
        amount,
        timestamp,
        transactionId,
        rawSMS: smsBody,
      };
    } catch (error) {
      this.logger.error('SMS parsing error:', error);
      return null;
    }
  }

  private detectProvider(smsBody: string, sender: string): PaymentMethod | null {
    const text = `${sender} ${smsBody}`;

    for (const [provider, pattern] of Object.entries(this.patterns)) {
      if (pattern.sender.test(text)) {
        return provider as PaymentMethod;
      }
    }

    return null;
  }

  private parseAmount(amountStr: string): number {
    return parseFloat(amountStr.replace(/,/g, ''));
  }

  private parseTimestamp(dateStr: string): Date {
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year < 100 ? 2000 + year : year, month, day);
    }
    return new Date();
  }
}
