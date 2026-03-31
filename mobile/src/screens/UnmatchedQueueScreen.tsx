import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSalesByShowroom, LocalSaleEntry } from '../services/database.service';

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

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getSalesByShowroom(showroomId, { status: 'unmatched' });
    // Sort oldest first
    setSales(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

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
        <TouchableOpacity style={s.btn} onPress={() => Alert.alert('Match', 'Manual matching coming soon')}>
          <Text style={s.btnText}>Match Payment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Unmatched Sales</Text>
        <Text style={s.subtitle}>{sales.length} waiting for payment</Text>
      </View>
      <FlatList
        data={sales}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptyText}>No unmatched sales</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  amount: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  age: { fontSize: 12, color: '#f59e0b', fontWeight: '600', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  ageOld: { color: '#ef4444', backgroundColor: '#fee2e2' },
  time: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  meta: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  gstRow: { flexDirection: 'row', gap: 16, marginTop: 8, marginBottom: 12 },
  gstText: { fontSize: 12, color: '#94a3b8' },
  btn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});
