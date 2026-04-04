/**
 * Mobile SMS Parser Service
 * Parses UPI payment SMS messages from known providers.
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.7
 */

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

/** Known UPI provider sender identifiers for filtering incoming SMS */
export const KNOWN_UPI_SENDERS = [
  'PHONEPE',
  'GPAY',
  'PAYTM',
  'BHIM',
  'GOOGLEPAY',
  'GOOGLE PAY',
  'TWILIO',
  'TEST',
  // Common bank SMS senders that relay UPI notifications
  'HDFCBK',
  'ICICIB',
  'SBIINB',
  'AXISBK',
  'KOTAKB',
  'YESBNK',
  'PNBSMS',
  'BOIIND',
  'CANBNK',
  'UNIONB',
];

const PATTERNS: Record<PaymentMethod, SMSPattern> = {
  [PaymentMethod.PHONEPE]: {
    sender: /PhonePe|PHONEPE/i,
    amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /Ref\s*(?:ID|No)?\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  [PaymentMethod.GOOGLEPAY]: {
    sender: /GOOGLEPAY|GPAY|Google\s*Pay/i,
    amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /UPI\s*(?:Ref|ID)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  [PaymentMethod.PAYTM]: {
    sender: /PAYTM|PayTM/i,
    amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /Order\s*(?:ID|No)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  [PaymentMethod.BHIM]: {
    sender: /BHIM|UPI/i,
    amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /(?:Ref|UPI)\s*(?:No|ID)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  [PaymentMethod.BANK]: {
    sender: /HDFCBK|ICICIB|SBIINB|AXISBK|KOTAKB|YESBNK|PNBSMS|BOIIND|CANBNK|UNIONB|UPI|UTR|TRANSACTION|CREDITED|RECEIVED|TWILIO|TEST/i,
    amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /(?:Ref|Txn|UTR|UPI)\s*(?:No|ID|Ref)?\s*[:#-]?\s*([A-Za-z0-9]+)/i,
  },
  [PaymentMethod.CASH]: {
    sender: /CASH/i,
    amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /.*/,
  },
};

class SmsParserService {
  /**
   * Checks if an SMS is from a known UPI provider sender.
   * Used to filter irrelevant SMS before attempting to parse.
   */
  isKnownUPISender(sender: string): boolean {
    const upperSender = sender.toUpperCase();
    return KNOWN_UPI_SENDERS.some(known => upperSender.includes(known));
  }

  /**
   * Detects the payment provider from SMS body and sender.
   */
  detectProvider(smsBody: string, sender: string): PaymentMethod | null {
    const text = `${sender} ${smsBody}`;
    for (const [provider, pattern] of Object.entries(PATTERNS)) {
      if (pattern.sender.test(text)) {
        return provider as PaymentMethod;
      }
    }

    // Fallback for generic sender IDs (e.g. Twilio test messages) that still contain UPI/payment signals.
    const looksLikePayment =
      /(UPI|UTR|REF|TRANSACTION|CREDITED|RECEIVED|PAID)/i.test(smsBody) &&
      /(?:Rs|INR)\.?\s*\d+/i.test(smsBody);
    if (looksLikePayment) {
      return PaymentMethod.BANK;
    }

    return null;
  }

  /**
   * Parses an SMS message and extracts payment details.
   * Returns null if the SMS cannot be parsed.
   */
  parse(smsBody: string, sender: string): ParsedPayment | null {
    try {
      const provider = this.detectProvider(smsBody, sender);
      if (!provider) {
        return null;
      }

      const pattern = PATTERNS[provider];

      const amountMatch = smsBody.match(pattern.amount);
      if (!amountMatch) {
        return null;
      }
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

      const transactionIdMatch = smsBody.match(pattern.transactionId);
      if (!transactionIdMatch && provider !== PaymentMethod.CASH) {
        return null;
      }
      const transactionId = transactionIdMatch
        ? transactionIdMatch[1]
        : `CASH-${Date.now()}`;

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
    } catch {
      return null;
    }
  }

  private parseTimestamp(dateStr: string): Date {
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year < 100 ? 2000 + year : year, month, day);
    }
    return new Date();
  }
}

export const smsParserService = new SmsParserService();
