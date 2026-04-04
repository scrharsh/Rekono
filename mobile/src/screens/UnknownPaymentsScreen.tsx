import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPaymentsByShowroom,
  LocalPaymentRecord,
} from '../services/database.service';
import colors from '../constants/colors';
import { QuickResolvePaymentButton } from '../components/QuickResolvePaymentButton';

function ageLabel(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UnknownPaymentsScreen() {
  const [payments, setPayments] = useState<LocalPaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const showroomId = await AsyncStorage.getItem('showroomId');
    if (!showroomId) return;
    const data = await getPaymentsByShowroom(showroomId, { status: 'unmatched' });
    // Sort oldest first
    setPayments(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleResolveSuccess = () => {
    load();
  };

  const handleResolveError = (error: Error) => {
    Alert.alert('Resolution failed', error.message);
  };

  const renderItem = ({ item }: { item: LocalPaymentRecord }) => {
    const age = ageLabel(item.timestamp);
    const isOld = Date.now() - new Date(item.timestamp).getTime() > 48 * 3600000;
    
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
          <Text style={[s.age, isOld && s.ageOld]}>{age}</Text>
        </View>
        <Text style={s.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
        <View style={s.methodRow}>
          <Text style={s.method}>{item.paymentMethod || 'Unknown Method'}</Text>
          {item.transactionId && <Text style={s.txnId}>{item.transactionId.slice(0, 12)}...</Text>}
        </View>
        {item.source && <Text style={s.source}>Source: {item.source}</Text>}
        
        <View style={s.buttonContainer}>
          <QuickResolvePaymentButton
            paymentId={item.id}
            amount={item.amount}
            onSuccess={handleResolveSuccess}
            onError={handleResolveError}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.header}>
        <Text style={s.title}>Payments Awaiting Match</Text>
        <Text style={s.subtitle}>{payments.length} waiting for matching</Text>
      </View>
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlyph}><Text style={s.emptyGlyphText}>✓</Text></View>
            <Text style={s.emptyTitle}>All caught up!</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  age: { fontSize: 12, color: colors.warning, fontWeight: '600', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  ageOld: { color: colors.errorLight, backgroundColor: 'rgba(255, 180, 171, 0.1)' },
  time: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  method: { fontSize: 14, color: colors.onSurfaceVariant, fontWeight: '600' },
  txnId: { fontSize: 12, color: colors.onSurfaceVariant, fontFamily: 'monospace', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  source: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 12 },
  buttonContainer: { marginTop: 12 },
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
  emptyGlyphText: { fontSize: 28, fontWeight: '800', color: colors.success, letterSpacing: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant },
});
