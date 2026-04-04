import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPaymentsByShowroom, LocalPaymentRecord } from '../services/database.service';
import colors from '../constants/colors';
import { subscribeToReconciliationChanges } from '../services/reconciliationEvents.service';

const METHOD_ICON: Record<string, string> = {
  PhonePe: 'PP',
  'Google Pay': 'GP',
  Paytm: 'PT',
  BHIM: 'BH',
  cash: 'CS',
  bank_transfer: 'BN',
  other: 'OT',
};

const STATUS_COLOR: Record<string, object> = {
  unmatched: { backgroundColor: '#fef3c7', color: '#d97706' },
  matched:   { backgroundColor: '#d1fae5', color: '#065f46' },
  verified:  { backgroundColor: '#d1fae5', color: '#065f46' },
};

export default function PaymentListScreen() {
  const [payments, setPayments] = useState<LocalPaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unmatched' | 'matched'>('all');

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getPaymentsByShowroom(showroomId, filter !== 'all' ? { status: filter } : {});
    setPayments(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [filter]);

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

  const renderItem = ({ item }: { item: LocalPaymentRecord }) => {
    const icon = METHOD_ICON[item.paymentMethod] ?? 'PM';
    const statusStyle = STATUS_COLOR[item.status] ?? STATUS_COLOR.unmatched;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.methodBadge}>
            <Text style={s.methodIcon}>{icon}</Text>
            <Text style={s.methodText}>{item.paymentMethod}</Text>
          </View>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Text style={[s.statusBadge, statusStyle as any]}>{item.status}</Text>
        </View>
        <Text style={s.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
        <Text style={s.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
        {item.transactionId && <Text style={s.txn}>TXN: {item.transactionId}</Text>}
        {item.sender && <Text style={s.meta}>From: {item.sender}</Text>}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.headerGlow} />
      <View style={s.header}>
        <View style={s.headerBadge}><Text style={s.headerBadgeText}>Payment Inbox</Text></View>
        <Text style={s.title}>Payment Inbox</Text>
        <View style={s.filterRow}>
          {(['all', 'unmatched', 'matched'] as const).map(f => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlyph}>
              <Text style={s.emptyGlyphText}>PM</Text>
            </View>
            <Text style={s.emptyTitle}>No payments yet</Text>
            <Text style={s.emptyText}>UPI payments will appear here automatically</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerGlow: {
    position: 'absolute',
    top: 30,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  header: { backgroundColor: colors.surfaceContainer, padding: 16, paddingTop: 44, borderBottomWidth: 1, borderBottomColor: colors.outlineLighter },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  headerBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.outlineLighter },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.onSurfaceVariant, fontWeight: '500' },
  filterTextActive: { color: colors.white, fontWeight: '700' },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    shadowColor: '#102135',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  methodIcon: { fontSize: 10, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  methodText: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },
  statusBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  amount: { fontSize: 22, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  time: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 2 },
  txn: { fontSize: 11, color: colors.onSurfaceVariant, fontFamily: 'monospace', marginBottom: 2 },
  meta: { fontSize: 13, color: colors.onSurfaceVariant },
  empty: { padding: 48, alignItems: 'center' },
  emptyGlyph: {
    width: 62,
    height: 62,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyphText: { fontSize: 16, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' },
});
