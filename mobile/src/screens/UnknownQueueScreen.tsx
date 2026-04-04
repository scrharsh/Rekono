import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import colors from '../constants/colors';
import { subscribeToReconciliationChanges } from '../services/reconciliationEvents.service';
import { selectClosestByAmountAndTime } from '../services/reconciliation.util';
import { fetchCatalogItems, hydrateBusinessContextFromServer, CatalogItem } from '../services/businessProfile.service';

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const unsubscribe = subscribeToReconciliationChanges(() => {
      void load();
    });

    return unsubscribe;
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const findExactCatalogItem = async (amount: number): Promise<CatalogItem | null> => {
    const context = await hydrateBusinessContextFromServer();
    const showroomId = context?.showroomId || await AsyncStorage.getItem('showroomId');
    const businessProfileId = context?.businessProfileId || await AsyncStorage.getItem('businessProfileId');
    const primaryScopeId = showroomId || businessProfileId;

    if (!primaryScopeId) {
      return null;
    }

    const withinTolerance = (item: CatalogItem) => Math.abs((item.sellingPrice || 0) - amount) <= 1;

    const primaryItems = await fetchCatalogItems(primaryScopeId);
    let match = primaryItems.find(withinTolerance) || null;

    if (!match && showroomId && businessProfileId && showroomId !== businessProfileId) {
      const fallbackItems = await fetchCatalogItems(businessProfileId);
      match = fallbackItems.find(withinTolerance) || null;
    }

    return match;
  };

  const createSaleAndLink = async (payment: LocalPaymentRecord) => {
    setWorkingId(payment.id);
    try {
      const showroomId = await AsyncStorage.getItem('showroomId');
      if (!showroomId) return;

      const exactCatalogItem = await findExactCatalogItem(payment.amount);
      const rawGstRate = exactCatalogItem?.gstRate;
      const gstRate = rawGstRate === 0 || rawGstRate === 5 || rawGstRate === 12 || rawGstRate === 18 || rawGstRate === 28
        ? rawGstRate
        : 0;

      const taxableAmount = gstRate > 0 ? payment.amount / (1 + gstRate / 100) : payment.amount;
      const gstAmount = payment.amount - taxableAmount;

      const saleId = String(uuid.v4());
      await saveSale({
        id: saleId,
        showroomId,
        totalAmount: payment.amount,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        cgst: Math.round((gstAmount / 2) * 100) / 100,
        sgst: Math.round((gstAmount / 2) * 100) / 100,
        igst: 0,
        items: [
          {
            name: exactCatalogItem?.name || exactCatalogItem?.category || (payment.sender ? `Payment from ${payment.sender}` : 'Captured from unknown payment'),
            quantity: 1,
            price: payment.amount,
            gstRate,
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
        notes: exactCatalogItem
          ? `Created sale from catalog item: ${exactCatalogItem.name || exactCatalogItem.category}`
          : 'Created sale directly from unknown payment',
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
        const exactCatalogItem = await findExactCatalogItem(payment.amount);
        if (exactCatalogItem) {
          await createSaleAndLink(payment);
        } else {
          Alert.alert('No sale found', 'No unmatched sale found. Use Create Sale to generate one from this payment.');
        }
        return;
      }

      const matchedSale = selectClosestByAmountAndTime(
        unmatchedSales,
        (sale) => sale.totalAmount,
        (sale) => sale.timestamp,
        payment.amount,
        payment.timestamp,
        1,
        180,
      );

      if (!matchedSale) {
        Alert.alert('No exact candidate', 'No unmatched sale found with near-exact amount.');
        return;
      }

      const amountDiff = Math.abs(matchedSale.totalAmount - payment.amount);

      await saveMatch({
        id: String(uuid.v4()),
        showroomId,
        saleId: matchedSale.id,
        paymentId: payment.id,
        confidence: 95,
        matchType: 'manual',
        verifiedBy: 'owner',
        verifiedAt: new Date().toISOString(),
        notes: `Matched from unknown queue (amount diff ${amountDiff.toFixed(2)})`,
        syncStatus: 'pending',
      });

      await updateSale(matchedSale.id, { status: 'verified', syncStatus: 'pending' });
      await updatePayment(payment.id, { status: 'verified', syncStatus: 'pending' });
      await load();
      Alert.alert('Matched', `Linked with sale ₹${matchedSale.totalAmount.toLocaleString('en-IN')}`);
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.header}>
        <Text style={s.title}>Payments Awaiting Match</Text>
        <Text style={s.subtitle}>{payments.length} without matching sales</Text>
      </View>
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
  container: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.surfaceContainer, padding: 20, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: colors.outlineLighter },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  subtitle: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  list: { padding: 16 },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.outlineLighter, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceHigh, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  methodIcon: { fontSize: 10, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  methodText: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  age: { fontSize: 12, color: colors.warning, fontWeight: '600', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  ageOld: { color: colors.errorLight, backgroundColor: 'rgba(255, 180, 171, 0.1)' },
  amount: { fontSize: 28, fontWeight: '800', color: colors.onSurface, marginBottom: 4, letterSpacing: -0.5 },
  time: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 4 },
  txn: { fontSize: 12, color: colors.onSurfaceVariant, fontFamily: 'monospace', marginBottom: 6 },
  meta: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 16, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnPrimary: { flex: 2, backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  btnOutline: { flex: 1, borderWidth: 1, borderColor: colors.outlineLighter, backgroundColor: colors.surface, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnOutlineText: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  empty: { padding: 48, paddingTop: 64, alignItems: 'center' },
  emptyGlyph: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyphText: { fontSize: 16, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant },
});
