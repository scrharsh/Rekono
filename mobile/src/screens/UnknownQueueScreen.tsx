import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPaymentsByShowroom, LocalPaymentRecord } from '../services/database.service';

function ageLabel(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const METHOD_ICON: Record<string, string> = {
  PhonePe: '📱', 'Google Pay': '🔵', Paytm: '💙', BHIM: '🇮🇳', cash: '💵', bank_transfer: '🏦', other: '💳',
};

export default function UnknownQueueScreen() {
  const [payments, setPayments] = useState<LocalPaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getPaymentsByShowroom(showroomId, { status: 'unmatched' });
    setPayments(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: { item: LocalPaymentRecord }) => {
    const age = ageLabel(item.timestamp);
    const isOld = Date.now() - new Date(item.timestamp).getTime() > 48 * 3600000;
    const icon = METHOD_ICON[item.paymentMethod] ?? '💳';
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
          <TouchableOpacity style={s.btnPrimary} onPress={() => Alert.alert('Create Sale', 'Sale creation from payment coming soon')}>
            <Text style={s.btnPrimaryText}>Create Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnOutline} onPress={() => Alert.alert('Match', 'Manual matching coming soon')}>
            <Text style={s.btnOutlineText}>Match Sale</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Unknown Payments</Text>
        <Text style={s.subtitle}>{payments.length} without matching sales</Text>
      </View>
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyTitle}>All clear!</Text>
            <Text style={s.emptyText}>No unknown payments</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  methodIcon: { fontSize: 14 },
  methodText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  age: { fontSize: 12, color: '#f59e0b', fontWeight: '600', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  ageOld: { color: '#ef4444', backgroundColor: '#fee2e2' },
  amount: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  time: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  txn: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 4 },
  meta: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnPrimary: { flex: 1, backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOutlineText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});
