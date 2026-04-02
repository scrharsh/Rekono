import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPaymentsByShowroom, LocalPaymentRecord } from '../services/database.service';

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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fc" />
      <View style={s.headerGlow} />
      <View style={s.header}>
        <View style={s.headerBadge}><Text style={s.headerBadgeText}>Payment Feed</Text></View>
        <Text style={s.title}>Payments</Text>
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
  container: { flex: 1, backgroundColor: '#f5f8fc' },
  headerGlow: {
    position: 'absolute',
    top: 30,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  header: { backgroundColor: '#fff', padding: 16, paddingTop: 44, borderBottomWidth: 1, borderBottomColor: '#d7e1ee' },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9f0ff',
    borderWidth: 1,
    borderColor: '#c9dafd',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  headerBadgeText: { color: '#1f5eff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive: { backgroundColor: '#1f5eff', borderColor: '#1f5eff' },
  filterText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d7e1ee',
    shadowColor: '#102135',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  methodIcon: { fontSize: 10, fontWeight: '800', color: '#334155', letterSpacing: 0.5 },
  methodText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  statusBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  amount: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  time: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  txn: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 2 },
  meta: { fontSize: 13, color: '#64748b' },
  empty: { padding: 48, alignItems: 'center' },
  emptyGlyph: {
    width: 62,
    height: 62,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyphText: { fontSize: 16, fontWeight: '800', color: '#334155', letterSpacing: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
