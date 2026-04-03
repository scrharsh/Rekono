import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';

interface ParsedSms {
  amount: number;
  transactionId: string;
  method: string;
  description: string;
  senderPhone: string;
}

interface SmsPaymentData {
  showroomId: string;
  smsId?: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  description: string;
  senderPhone: string;
  receivedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * SMS Payment Parser & Handler
 *
 * Parses SMS from multiple payment providers and creates
 * payment records that can be auto-reconciled.
 */
@Injectable()
export class SmsWebhookService {
  private readonly logger = new Logger(SmsWebhookService.name);

  constructor(
    @InjectModel(PaymentRecord.name) private paymentModel: Model<PaymentRecordDocument>,
  ) {}

  /**
   * Parse SMS body from various payment providers
   * Handles: UPI confirmations, bank transfers, wallet payments
   */
  async parseSmsBody(body: string, provider?: string): Promise<ParsedSms | null> {
    try {
      // Map of common SMS patterns from Indian payment systems
      const patterns = [
        // PhonePe UPI: "PhonePe: You have sent Rs. 5,000.00 via UPI to...TxnRef: XXXXXXXXX"
        {
          regex: /(?:sent|received|credited|debited)\s+(?:Rs\.|₹)\s*([\d,]+)/i,
          getAmount: (m: RegExpMatchArray) => parseFloat(m[1].replace(/,/g, '')),
          getMethod: () => 'upi',
        },
        // Bank SMS: "Amount Rs. 10,000 debited from A/c XXXX"
        {
          regex: /amount\s+(?:Rs\.|₹)\s*([\d,]+).*?(?:debited|credited|transferred)/i,
          getAmount: (m: RegExpMatchArray) => parseFloat(m[1].replace(/,/g, '')),
          getMethod: () => 'bank_transfer',
        },
        // Generic: "Rs. 5000 credited"
        {
          regex: /(?:Rs\.|₹)\s*([\d,]+)\s+(?:credited|transferred|received)/i,
          getAmount: (m: RegExpMatchArray) => parseFloat(m[1].replace(/,/g, '')),
          getMethod: () => 'upi',
        },
      ];

      // Try each pattern
      for (const pattern of patterns) {
        const match = body.match(pattern.regex);
        if (match) {
          const amount = pattern.getAmount(match);
          if (amount > 0) {
            // Extract transaction ID from common patterns
            const txnMatch = body.match(/(?:Ref|TxnRef|Transaction ID|UPI Ref):\s*([A-Z0-9]+)/i);
            const transactionId = txnMatch?.[1] || `SMS_${Date.now()}`;

            return {
              amount,
              transactionId,
              method: pattern.getMethod(),
              description: body.substring(0, 100), // First 100 chars as description
              senderPhone: this.extractPhoneNumber(body) || '',
            };
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error parsing SMS: ${error}`);
      return null;
    }
  }

  /**
   * Create or update payment from SMS data
   */
  async upsertPaymentFromSms(data: SmsPaymentData): Promise<PaymentRecordDocument> {
    const {
      showroomId,
      smsId,
      amount,
      transactionId,
      paymentMethod,
      description,
      senderPhone,
      receivedAt,
    } = data;

    // Check if payment already exists (by transactionId)
    let payment = await this.paymentModel.findOne({
      showroomId,
      transactionId,
      source: 'sms',
    });

    if (payment) {
      this.logger.debug(`Payment with TxnId ${transactionId} already exists`);
      return payment;
    }

    // Create new payment record
    payment = new this.paymentModel({
      showroomId,
      amount,
      transactionId,
      paymentMethod,
      sender: senderPhone,
      source: 'sms',
      status: 'unmatched', // Mark as unmatched, will be auto-reconciled
      timestamp: receivedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await payment.save();
    this.logger.debug(`Payment created from SMS: ${payment._id}, TxnId: ${transactionId}`);

    return payment;
  }

  /**
   * Extract phone number from SMS body
   */
  private extractPhoneNumber(body: string): string | null {
    // Match Indian phone numbers
    const phoneMatch = body.match(/(?:\+91|0)?[6-9]\d{9}\b/);
    return phoneMatch ? phoneMatch[0] : null;
  }

  /**
   * Get payment by SMS transaction ID
   */
  async getPaymentByTransactionId(showroomId: string, transactionId: string): Promise<PaymentRecordDocument | null> {
    return this.paymentModel.findOne({
      showroomId,
      transactionId,
      source: 'sms',
    });
  }

  /**
   * Bulk SMS import from SMS history (backup)
   * Useful if user wants to import SMS history from their phone
   */
  async bulkImportSms(
    showroomId: string,
    smsList: Array<{ timestamp: string; body: string }>,
  ): Promise<any> {
    const results = {
      imported: 0,
      duplicates: 0,
      failed: 0,
    };

    for (const sms of smsList) {
      try {
        const parsed = await this.parseSmsBody(sms.body);
        if (!parsed) {
          results.failed++;
          continue;
        }

        const existing = await this.paymentModel.findOne({
          showroomId,
          transactionId: parsed.transactionId,
          source: 'sms',
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        await this.upsertPaymentFromSms({
          showroomId,
          amount: parsed.amount,
          transactionId: parsed.transactionId,
          paymentMethod: parsed.method,
          description: parsed.description,
          senderPhone: parsed.senderPhone,
          receivedAt: new Date(sms.timestamp),
        });

        results.imported++;
      } catch (error) {
        this.logger.error(`Failed to import SMS: ${error}`);
        results.failed++;
      }
    }

    return results;
  }
}
