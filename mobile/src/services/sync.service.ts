import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPendingSyncItems, markAsSynced } from './database.service';

const API_URL = 'http://10.0.2.2:3000/v1'; // Android emulator → localhost

let syncInterval: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;
const MAX_RETRY = 5;

export const startSyncService = () => {
  if (syncInterval) return; // already running
  syncWithServer();
  syncInterval = setInterval(() => syncWithServer(), 5 * 60 * 1000);
};

export const stopSyncService = () => {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
};

export const forceSyncNow = () => syncWithServer();

export const syncWithServer = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const pending = await getPendingSyncItems();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // Upload sales
    for (const sale of pending.sales) {
      try {
        const res = await fetch(`${API_URL}/showrooms/${sale.showroomId}/sales`, {
          method: 'POST', headers,
          body: JSON.stringify({
            totalAmount: sale.totalAmount,
            taxableAmount: sale.taxableAmount,
            cgst: sale.cgst, sgst: sale.sgst, igst: sale.igst,
            items: sale.items,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            invoiceNumber: sale.invoiceNumber,
            timestamp: sale.timestamp,
          }),
        });
        if (res.ok) await markAsSynced('sales', sale.id);
      } catch { /* retry next cycle */ }
    }

    // Upload payments
    for (const payment of pending.payments) {
      try {
        const res = await fetch(`${API_URL}/showrooms/${payment.showroomId}/payments`, {
          method: 'POST', headers,
          body: JSON.stringify({
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            sender: payment.sender,
            rawSMS: payment.rawSMS,
            source: payment.source,
            timestamp: payment.timestamp,
          }),
        });
        if (res.ok) await markAsSynced('payments', payment.id);
      } catch { /* retry next cycle */ }
    }

    retryCount = 0;
  } catch (err) {
    retryCount++;
    if (retryCount <= MAX_RETRY) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, retryCount - 1) * 1000;
      setTimeout(() => syncWithServer(), delay);
    }
  }
};
