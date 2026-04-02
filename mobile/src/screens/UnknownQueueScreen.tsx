import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPaymentsByShowroom,
  getSalesByShowroom,
  saveSale,
  saveMatch,
  updatePayment,
  updateSale,
  LocalPaymentRecord,
  LocalSaleEntry,
} from '../services/database.service';
import uuid from 'react-native-uuid';

function ageLabel(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const METHOD_ICON: Record<string, string> = {
  PhonePe: 'PP',
  'Google Pay': 'GP',
  Paytm: 'PT',
  BHIM: 'BH',
  cash: 'CS',
  bank_transfer: 'BN',
  other: 'OT',
};

export default function UnknownQueueScreen() {
  const [payments, setPayments] = useState<LocalPaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getPaymentsByShowroom(showroomId, { status: 'unmatched' });
    setPayments(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getBestSaleCandidate = (payment: LocalPaymentRecord, sales: LocalSaleEntry[]) => {
    const scored = sales.map((sale) => {
      const amountDiff = Math.abs(payment.amount - sale.totalAmount);
      const timeDiffMins = Math.abs(
        new Date(payment.timestamp).getTime() - new Date(sale.timestamp).getTime(),
      ) / 60000;
      const score = Math.max(0, 100 - amountDiff * 40 - timeDiffMins * 1.2);
      return { sale, score, amountDiff };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  };

  const createSaleAndLink = async (payment: LocalPaymentRecord) => {
    setWorkingId(payment.id);
    try {
      const showroomId = await AsyncStorage.getItem('showroomId');
      if (!showroomId) return;

      const saleId = String(uuid.v4());
      await saveSale({
        id: saleId,
        showroomId,
        totalAmount: payment.amount,
        taxableAmount: payment.amount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        items: [
          {
            name: payment.sender ? `Payment from ${payment.sender}` : 'Captured from unknown payment',
            quantity: 1,
            price: payment.amount,
            gstRate: 0,
          },
        ],
        customerName: payment.sender || undefined,
        timestamp: payment.timestamp,
        status: 'verified',
        syncStatus: 'pending',
      });

      await saveMatch({
        id: String(uuid.v4()),
        showroomId,
        saleId,
        paymentId: payment.id,
        confidence: 95,
        matchType: 'manual',
        verifiedBy: 'owner',
        verifiedAt: new Date().toISOString(),
        notes: 'Created sale directly from unknown payment',
        syncStatus: 'pending',
      });

      await updatePayment(payment.id, { status: 'verified', syncStatus: 'pending' });
      await load();
      Alert.alert('Resolved', 'Sale created and linked successfully.');
    } catch {
      Alert.alert('Action failed', 'Unable to create and link sale for this payment.');
    } finally {
      setWorkingId(null);
    }
  };

  const matchExistingSale = async (payment: LocalPaymentRecord) => {
    setWorkingId(payment.id);
    try {
      const showroomId = await AsyncStorage.getItem('showroomId');
      if (!showroomId) return;

      const unmatchedSales = await getSalesByShowroom(showroomId, { status: 'unmatched' });
      if (unmatchedSales.length === 0) {
        Alert.alert('No sale found', 'There are no unmatched sales available for linking.');
        return;
      }

      const best = getBestSaleCandidate(payment, unmatchedSales);
      if (!best || best.score < 50) {
        Alert.alert('Low confidence', 'No confident sale candidate found for this payment.');
        return;
      }

      await saveMatch({
        id: String(uuid.v4()),
        showroomId,
        saleId: best.sale.id,
        paymentId: payment.id,
        confidence: Math.round(best.score),
        matchType: 'manual',
        verifiedBy: 'owner',
        verifiedAt: new Date().toISOString(),
        notes: `Matched from unknown queue (amount diff ${best.amountDiff.toFixed(2)})`,
        syncStatus: 'pending',
      });

      await updateSale(best.sale.id, { status: 'verified', syncStatus: 'pending' });
      await updatePayment(payment.id, { status: 'verified', syncStatus: 'pending' });
      await load();
      Alert.alert('Matched', `Linked with sale ₹${best.sale.totalAmount.toLocaleString('en-IN')}`);
    } catch {
      Alert.alert('Match failed', 'Unable to match this payment right now.');
    } finally {
      setWorkingId(null);
    }
  };

  const renderItem = ({ item }: { item: LocalPaymentRecord }) => {
    const age = ageLabel(item.timestamp);
    const isOld = Date.now() - new Date(item.timestamp).getTime() > 48 * 3600000;
    const icon = METHOD_ICON[item.paymentMethod] ?? 'PM';
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.methodBadge}>
            <Text style={s.methodIcon}>{icon}</Text>
            <Text style={s.methodText}>{item.paymentMethod}</Text>
          </View>
          <Text style={[s.age, isOld && s.ageOld]}>{age}</Text>
        </View>
        <Text style={s.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
        <Text style={s.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
        {item.transactionId && <Text style={s.txn}>TXN: {item.transactionId}</Text>}
        {item.sender && <Text style={s.meta}>From: {item.sender}</Text>}
        <View style={s.actions}>
          <TouchableOpacity style={[s.btnPrimary, workingId === item.id && s.btnDisabled]} onPress={() => createSaleAndLink(item)} disabled={workingId === item.id}>
            <Text style={s.btnPrimaryText}>{workingId === item.id ? 'Working...' : 'Create Sale'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnOutline, workingId === item.id && s.btnDisabled]} onPress={() => matchExistingSale(item)} disabled={workingId === item.id}>
            <Text style={s.btnOutlineText}>Match</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fc" />
      <View style={s.header}>
        <Text style={s.title}>Unknown Payments</Text>
        <Text style={s.subtitle}>{payments.length} without matching sales</Text>
      </View>
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1f5eff" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlyph}><Text style={s.emptyGlyphText}>OK</Text></View>
            <Text style={s.emptyTitle}>All clear!</Text>
            <Text style={s.emptyText}>No unknown payments</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f8fc' },
  header: { backgroundColor: '#ffffff', padding: 20, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#d7e1ee' },
  title: { fontSize: 20, fontWeight: '700', color: '#102135' },
  subtitle: { fontSize: 13, color: '#5f6b7d', marginTop: 4 },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#d7e1ee', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e9f0ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  methodIcon: { fontSize: 10, fontWeight: '800', color: '#334155', letterSpacing: 0.5 },
  methodText: { fontSize: 13, fontWeight: '600', color: '#102135' },
  age: { fontSize: 12, color: '#f59e0b', fontWeight: '600', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  ageOld: { color: '#ffb4ab', backgroundColor: 'rgba(255, 180, 171, 0.1)' },
  amount: { fontSize: 28, fontWeight: '800', color: '#102135', marginBottom: 4, letterSpacing: -0.5 },
  time: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  txn: { fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 6 },
  meta: { fontSize: 14, color: '#5f6b7d', marginBottom: 16, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnPrimary: { flex: 2, backgroundColor: '#1f5eff', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  btnOutline: { flex: 1, borderWidth: 1, borderColor: '#d7e1ee', backgroundColor: '#f5f8fc', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnOutlineText: { color: '#5f6b7d', fontSize: 14, fontWeight: '600' },
  empty: { padding: 48, paddingTop: 64, alignItems: 'center' },
  emptyGlyph: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyphText: { fontSize: 16, fontWeight: '800', color: '#334155', letterSpacing: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#102135', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#5f6b7d' },
});
