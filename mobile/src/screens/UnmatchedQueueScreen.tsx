import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSalesByShowroom,
  getPaymentsByShowroom,
  saveMatch,
  updatePayment,
  updateSale,
  LocalSaleEntry,
  LocalPaymentRecord,
} from '../services/database.service';
import uuid from 'react-native-uuid';
import colors from '../constants/colors';

function ageLabel(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UnmatchedQueueScreen() {
  const [sales, setSales] = useState<LocalSaleEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getSalesByShowroom(showroomId, { status: 'unmatched' });
    // Sort oldest first
    setSales(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getBestPaymentCandidate = (sale: LocalSaleEntry, payments: LocalPaymentRecord[]) => {
    const scored = payments.map((payment) => {
      const amountDiff = Math.abs(payment.amount - sale.totalAmount);
      const timeDiffMins = Math.abs(
        new Date(payment.timestamp).getTime() - new Date(sale.timestamp).getTime(),
      ) / 60000;

      const score = Math.max(0, 100 - amountDiff * 40 - timeDiffMins * 1.2);
      return { payment, score, amountDiff, timeDiffMins };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  };

  const resolveSale = async (sale: LocalSaleEntry) => {
    setResolvingId(sale.id);
    try {
      const showroomId = await AsyncStorage.getItem('showroomId');
      if (!showroomId) return;

      const unmatchedPayments = await getPaymentsByShowroom(showroomId, { status: 'unmatched' });
      if (unmatchedPayments.length === 0) {
        Alert.alert('No payment found', 'There are no unmatched payments available to link.');
        return;
      }

      const best = getBestPaymentCandidate(sale, unmatchedPayments);
      if (!best || best.score < 50) {
        Alert.alert('Low confidence', 'No confident payment candidate found for this sale.');
        return;
      }

      await saveMatch({
        id: String(uuid.v4()),
        showroomId,
        saleId: sale.id,
        paymentId: best.payment.id,
        confidence: Math.round(best.score),
        matchType: 'manual',
        verifiedBy: 'owner',
        verifiedAt: new Date().toISOString(),
        notes: `Auto-linked from unmatched queue (amount diff ${best.amountDiff.toFixed(2)})`,
        syncStatus: 'pending',
      });

      await updateSale(sale.id, { status: 'verified', syncStatus: 'pending' });
      await updatePayment(best.payment.id, { status: 'verified', syncStatus: 'pending' });
      await load();

      Alert.alert('Resolved', `Linked with payment ₹${best.payment.amount.toLocaleString('en-IN')}`);
    } catch {
      Alert.alert('Resolution failed', 'Unable to resolve this sale right now.');
    } finally {
      setResolvingId(null);
    }
  };

  const renderItem = ({ item }: { item: LocalSaleEntry }) => {
    const age = ageLabel(item.timestamp);
    const isOld = Date.now() - new Date(item.timestamp).getTime() > 48 * 3600000;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.amount}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={[s.age, isOld && s.ageOld]}>{age}</Text>
        </View>
        <Text style={s.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
        {item.customerName && <Text style={s.meta}>Customer: {item.customerName}</Text>}
        {item.items.length > 0 && (
          <Text style={s.meta}>{item.items.length} item{item.items.length > 1 ? 's' : ''}</Text>
        )}
        <View style={s.gstRow}>
          <Text style={s.gstText}>Taxable: ₹{item.taxableAmount.toFixed(2)}</Text>
          <Text style={s.gstText}>GST: ₹{(item.cgst + item.sgst).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={[s.btn, resolvingId === item.id && s.btnDisabled]} onPress={() => resolveSale(item)} disabled={resolvingId === item.id}>
          <Text style={s.btnText}>{resolvingId === item.id ? 'Resolving...' : 'Auto Resolve'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.header}>
        <Text style={s.title}>Pending Sales</Text>
        <Text style={s.subtitle}>{sales.length} waiting for payment</Text>
      </View>
      <FlatList
        data={sales}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlyph}><Text style={s.emptyGlyphText}>OK</Text></View>
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptyText}>No unmatched sales</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  age: { fontSize: 12, color: colors.warning, fontWeight: '600', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  ageOld: { color: colors.errorLight, backgroundColor: 'rgba(255, 180, 171, 0.1)' },
  time: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 4 },
  meta: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 4, fontWeight: '500' },
  gstRow: { flexDirection: 'row', gap: 16, marginTop: 4, marginBottom: 16, backgroundColor: colors.surface, padding: 8, borderRadius: 8 },
  gstText: { fontSize: 12, color: colors.onSurfaceVariant },
  btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
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
