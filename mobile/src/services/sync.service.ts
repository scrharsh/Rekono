import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPendingSyncItems,
  markAsSynced,
  getSaleById,
  getPaymentById,
  LocalSaleEntry,
  LocalPaymentRecord,
} from './database.service';
import { selectClosestByAmountAndTime } from './reconciliation.util';

const API_URL = 'http://10.0.2.2:3000/v1'; // Android emulator → localhost

let syncInterval: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;
const MAX_RETRY = 5;

type RemoteSale = { _id: string; totalAmount: number; timestamp: string };
type RemotePayment = { _id: string; amount: number; timestamp: string };

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

    // Upload manual matches by reconciling local records to remote IDs.
    for (const match of pending.matches) {
      try {
        const localSale = await getSaleById(match.saleId);
        const localPayment = await getPaymentById(match.paymentId);
        if (!localSale || !localPayment) continue;

        const remoteSale = await findRemoteSale(showroomIdOr(localSale), localSale, headers);
        const remotePayment = await findRemotePayment(showroomIdOr(localPayment), localPayment, headers);

        if (!remoteSale || !remotePayment) continue;

        const res = await fetch(`${API_URL}/showrooms/${showroomIdOr(localSale)}/matches`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            saleId: remoteSale._id,
            paymentId: remotePayment._id,
            notes: match.notes || 'Synced from mobile reconciliation',
          }),
        });

        // 409 means already matched on server; mark synced locally to stop retries.
        if (res.ok || res.status === 409) {
          await markAsSynced('matches', match.id);
        }
      } catch {
        // Ignore individual match sync failures and retry next cycle.
      }
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

function showroomIdOr(record: { showroomId: string }): string {
  return record.showroomId;
}

async function findRemoteSale(
  showroomId: string,
  localSale: LocalSaleEntry,
  headers: Record<string, string>,
): Promise<RemoteSale | null> {
  const startDate = new Date(new Date(localSale.timestamp).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(new Date(localSale.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${API_URL}/showrooms/${showroomId}/sales?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&limit=100`,
    { headers },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const sales: RemoteSale[] = data?.sales || [];
  if (!sales.length) return null;

  return selectClosestByAmountAndTime(
    sales,
    (s) => s.totalAmount,
    (s) => s.timestamp,
    localSale.totalAmount,
    localSale.timestamp,
  );
}

async function findRemotePayment(
  showroomId: string,
  localPayment: LocalPaymentRecord,
  headers: Record<string, string>,
): Promise<RemotePayment | null> {
  const startDate = new Date(new Date(localPayment.timestamp).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(new Date(localPayment.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${API_URL}/showrooms/${showroomId}/payments?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&limit=100`,
    { headers },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const payments: RemotePayment[] = data?.payments || [];
  if (!payments.length) return null;

  return selectClosestByAmountAndTime(
    payments,
    (p) => p.amount,
    (p) => p.timestamp,
    localPayment.amount,
    localPayment.timestamp,
  );
}
