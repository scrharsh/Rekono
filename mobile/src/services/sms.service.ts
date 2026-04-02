import { smsReceiverService } from './smsReceiver.native';
import { smsParserService, PaymentMethod } from './smsParser.service';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.PHONEPE]: 'PhonePe',
  [PaymentMethod.GOOGLEPAY]: 'Google Pay',
  [PaymentMethod.PAYTM]: 'Paytm',
  [PaymentMethod.BHIM]: 'BHIM',
  [PaymentMethod.BANK]: 'bank_transfer',
  [PaymentMethod.CASH]: 'cash',
};

export const requestSMSPermission = async (): Promise<boolean> => {
  return smsReceiverService.requestSMSPermission();
};

export const parseSMS = (message: string): Record<string, unknown> | null => {
  const parsed = smsParserService.parse(message, '');

  if (!parsed) {
    return null;
  }

  return {
    amount: parsed.amount,
    sender: parsed.senderName ?? '',
    transactionId: parsed.transactionId,
    method: PAYMENT_METHOD_LABELS[parsed.provider],
    timestamp: parsed.timestamp.toISOString(),
    rawSMS: parsed.rawSMS,
  };
};

export const setupSMSListener = async (
  _onPaymentReceived: (payment: Record<string, unknown>) => void,
  showroomId?: string,
) => {
  void _onPaymentReceived;

  if (!showroomId) {
    console.warn('SMS listener requires a showroomId to start the native receiver');
    return;
  }

  await smsReceiverService.startListening(showroomId);
};
