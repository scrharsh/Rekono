import { PermissionsAndroid, Platform } from 'react-native';
// import SmsAndroid from 'react-native-sms'; // TODO: Uncomment when implementing

export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'Rekono needs access to read SMS for automatic payment capture',
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
};

export const parseSMS = (message: string): any | null => {
  // PhonePe pattern
  const phonePePattern = /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?).+?from\s+(.+?)\s+.+?UPI Ref no\s+(\d+)/i;
  const phonePeMatch = message.match(phonePePattern);
  if (phonePeMatch) {
    return {
      amount: parseFloat(phonePeMatch[1].replace(/,/g, '')),
      sender: phonePeMatch[2].trim(),
      transactionId: phonePeMatch[3],
      method: 'PhonePe',
      timestamp: new Date().toISOString(),
    };
  }

  // Google Pay pattern
  const gpayPattern = /You\s+received\s+Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?).+?from\s+(.+?)\s+.+?UPI transaction ID:\s+(\w+)/i;
  const gpayMatch = message.match(gpayPattern);
  if (gpayMatch) {
    return {
      amount: parseFloat(gpayMatch[1].replace(/,/g, '')),
      sender: gpayMatch[2].trim(),
      transactionId: gpayMatch[3],
      method: 'Google Pay',
      timestamp: new Date().toISOString(),
    };
  }

  // Paytm pattern
  const paytmPattern = /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s+received.+?from\s+(.+?)\s+.+?Paytm Order ID:\s+(\w+)/i;
  const paytmMatch = message.match(paytmPattern);
  if (paytmMatch) {
    return {
      amount: parseFloat(paytmMatch[1].replace(/,/g, '')),
      sender: paytmMatch[2].trim(),
      transactionId: paytmMatch[3],
      method: 'Paytm',
      timestamp: new Date().toISOString(),
    };
  }

  // BHIM pattern
  const bhimPattern = /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s+credited.+?from\s+(.+?)\s+.+?UPI Ref:\s+(\w+)/i;
  const bhimMatch = message.match(bhimPattern);
  if (bhimMatch) {
    return {
      amount: parseFloat(bhimMatch[1].replace(/,/g, '')),
      sender: bhimMatch[2].trim(),
      transactionId: bhimMatch[3],
      method: 'BHIM',
      timestamp: new Date().toISOString(),
    };
  }

  return null;
};

export const setupSMSListener = (_onPaymentReceived: (payment: any) => void) => {
  void _onPaymentReceived;
  // TODO: Implement SMS broadcast receiver
  // This would listen for incoming SMS and parse them
  console.log('SMS listener setup - TODO: Implement native module');
  
  // Example implementation structure:
  // SmsAndroid.autoStart();
  // SmsAndroid.addListener((message) => {
  //   const payment = parseSMS(message.body);
  //   if (payment) {
  //     onPaymentReceived(payment);
  //   }
  // });
};
