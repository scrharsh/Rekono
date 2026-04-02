import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { smsParserService, KNOWN_UPI_SENDERS, PaymentMethod } from './smsParser.service';
import { databaseService, LocalPaymentRecord } from './database.service';
import { smsAutoMatchService } from './smsAutoMatch.service';

const { SMSReceiverModule } = NativeModules;

/** Maps smsParser PaymentMethod enum → LocalPaymentRecord paymentMethod union */
const PAYMENT_METHOD_MAP: Record<PaymentMethod, LocalPaymentRecord['paymentMethod']> = {
  [PaymentMethod.PHONEPE]: 'PhonePe',
  [PaymentMethod.GOOGLEPAY]: 'Google Pay',
  [PaymentMethod.PAYTM]: 'Paytm',
  [PaymentMethod.BHIM]: 'BHIM',
  [PaymentMethod.BANK]: 'bank_transfer',
  [PaymentMethod.CASH]: 'cash',
};

interface SMSMessage {
  body: string;
  sender: string;
  timestamp: number;
}

class SMSReceiverService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listener: { remove: () => void } | null = null;

  async requestSMSPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'SMS Permission',
          message: 'Rekono needs access to read SMS messages to automatically capture UPI payments',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('SMS permission error:', err);
      return false;
    }
  }

  async startListening(showroomId: string): Promise<void> {
    const hasPermission = await this.requestSMSPermission();
    if (!hasPermission) {
      throw new Error('SMS permission not granted');
    }

    // Initialize native module event emitter
    if (SMSReceiverModule) {
      this.eventEmitter = new NativeEventEmitter(SMSReceiverModule);
      
      // Listen for SMS received events
      this.listener = this.eventEmitter.addListener('onSMSReceived', async (sms: SMSMessage) => {
        await this.handleIncomingSMS(sms, showroomId);
      });

      // Start native SMS receiver
      SMSReceiverModule.startListening();
    } else {
      console.warn('SMSReceiverModule not available - using mock mode');
      // In development/testing, you can manually trigger SMS parsing
    }
  }

  stopListening(): void {
    if (this.listener) {
      this.listener.remove();
      this.listener = null;
    }

    if (SMSReceiverModule) {
      SMSReceiverModule.stopListening();
    }
  }

  private async handleIncomingSMS(sms: SMSMessage, showroomId: string): Promise<void> {
    try {
      // Filter: only process SMS from known UPI providers (Requirement 2.1, 2.6)
      const isKnownSender = smsParserService.isKnownUPISender(sms.sender) ||
        KNOWN_UPI_SENDERS.some(s => sms.body.toUpperCase().includes(s));

      if (!isKnownSender) {
        return; // Ignore non-UPI messages
      }

      // Parse SMS using mobile parser service (Requirement 2.2–2.5)
      const parsedPayment = smsParserService.parse(sms.body, sms.sender);

      if (parsedPayment) {
        // Create payment record in local SQLite database (Requirement 2.6)
        const paymentRecord = {
          showroomId,
          amount: parsedPayment.amount,
          paymentMethod: PAYMENT_METHOD_MAP[parsedPayment.provider] ?? 'other',
          transactionId: parsedPayment.transactionId,
          sender: parsedPayment.senderName || sms.sender,
          rawSMS: sms.body,
          timestamp: parsedPayment.timestamp || new Date(sms.timestamp),
          source: 'sms' as const,
          status: 'unmatched' as const,
          syncStatus: 'pending' as const,
        };

        const createdPayment = await databaseService.createPaymentRecord(paymentRecord);
        console.log('Payment record created from SMS:', {
          amount: paymentRecord.amount,
          method: paymentRecord.paymentMethod,
          transactionId: paymentRecord.transactionId,
        });

        // Attempt automatic matching to reduce exception queue (Enhanced: Auto-matching)
        if (createdPayment?.id) {
          const autoMatchResult = await smsAutoMatchService.attemptAutoMatch(createdPayment.id, showroomId);
          if (autoMatchResult.matched) {
            console.log('✓ Payment auto-matched on SMS capture:', {
              saleId: autoMatchResult.saleId,
              paymentId: autoMatchResult.paymentId,
            });
          }
        }
      } else {
        // Parsing failed — log to review queue for manual inspection (Requirement 2.7)
        console.warn('Failed to parse UPI SMS:', {
          sender: sms.sender,
          body: sms.body.substring(0, 100),
        });

        await databaseService.addToUnknownQueue({
          showroomId,
          rawSMS: sms.body,
          sender: sms.sender,
          timestamp: new Date(sms.timestamp),
          reason: 'parse_failure',
        });
      }
    } catch (error) {
      console.error('Error handling incoming SMS:', error);
    }
  }

  // Manual SMS parsing for testing
  async parseManualSMS(smsBody: string, showroomId: string): Promise<void> {
    const mockSMS: SMSMessage = {
      body: smsBody,
      sender: 'TEST',
      timestamp: Date.now(),
    };

    await this.handleIncomingSMS(mockSMS, showroomId);
  }
}

export const smsReceiverService = new SMSReceiverService();

// Note: To implement the native module, create:
// android/app/src/main/java/com/rekono/SMSReceiverModule.java
// with BroadcastReceiver for SMS_RECEIVED intent
