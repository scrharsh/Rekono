import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, StatusBar,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPaymentsByShowroom, getTodaySummary, initDatabase } from '../services/database.service';
import { startSyncService } from '../services/sync.service';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, unknown>>>();
  const [summary, setSummary] = useState({ totalSales: 0, matchedCount: 0, totalAmount: 0 });
  const [unknownCount, setUnknownCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showroomName, setShowroomName] = useState('');
  const [isOnline] = useState(true);

  const init = useCallback(async () => {
    try {
      await initDatabase();
      const showroomId = await AsyncStorage.getItem('showroomId');
      const name = await AsyncStorage.getItem('showroomName');
      if (name) setShowroomName(name);
      if (showroomId) {
        const data = await getTodaySummary(showroomId);
        setSummary(data);
        const unmatchedPayments = await getPaymentsByShowroom(showroomId, { status: 'unmatched' });
        setUnknownCount(unmatchedPayments.length);
      }
      startSyncService();
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { init(); }, [init]);

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const pending = Math.max(0, summary.totalSales - summary.matchedCount);

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1326" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</Text>
          <Text style={s.showroomName}>{showroomName || 'Rekono Business'}</Text>
        </View>
        <View style={s.headerActions}>
           {!isOnline && (
             <View style={s.offlineBadge}>
               <Text style={s.offlineText}>Offline</Text>
             </View>
           )}
           <TouchableOpacity style={s.avatarBtn}>
             <Text style={s.avatarText}>{showroomName ? showroomName.charAt(0) : 'R'}</Text>
           </TouchableOpacity>
        </View>
      </View>

      <View style={s.content}>
        <Text style={s.sectionTitle}>Today&apos;s Summary</Text>
        
        {/* Main Status Card */}
        <View style={s.primaryCard}>
          <View style={s.primaryCardBg} />
          <View style={{ zIndex: 1 }}>
            <Text style={s.primaryTotalLabel}>Received</Text>
            <Text style={s.primaryTotalValue}>₹{summary.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.primaryStatsRow}>
            <View>
              <Text style={s.primaryStatLabel}>Processed</Text>
              <Text style={s.primaryStatValue}>{summary.matchedCount}</Text>
            </View>
            <View>
              <Text style={s.primaryStatLabel}>Needs Review</Text>
              <Text style={[s.primaryStatValue, pending > 0 && { color: '#ffb4ab' }]}>{pending}</Text>
            </View>
          </View>
        </View>

        {/* Resolve CTA */}
        {pending > 0 && (
          <TouchableOpacity style={s.resolveBtn} onPress={() => navigation.navigate('Unmatched')}>
            <View style={s.resolveBadge}><Text style={s.resolveBadgeText}>{pending}</Text></View>
            <Text style={s.resolveBtnText}>Resolve Pending Items</Text>
            <Text style={s.resolveBtnArrow}>→</Text>
          </TouchableOpacity>
        )}

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Quick Action</Text>
        
        <TouchableOpacity style={s.quickEntryBtn} onPress={() => navigation.navigate('Sales')}>
          <View style={s.quickEntryIconBg}><Text style={s.quickEntryIcon}>+</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.quickEntryTitle}>New Sale Entry</Text>
            <Text style={s.quickEntryDesc}>Record a cash or unlinked transaction</Text>
          </View>
        </TouchableOpacity>

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Queues & Exceptions</Text>
        
        {/* Queues list */}
        <View style={s.queueContainer}>
          <TouchableOpacity style={s.queueCard} onPress={() => navigation.navigate('Unmatched')}>
            <View style={[s.queueIconContainer, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
              <Text style={s.queueIcon}>📋</Text>
            </View>
            <View style={s.queueInfo}>
              <Text style={s.queueTitle}>Unmatched Sales</Text>
              <Text style={s.queueDesc}>Bills lacking payment</Text>
            </View>
            <Text style={[s.queueCount, pending > 0 && { color: '#ffb4ab' }]}>{pending}</Text>
          </TouchableOpacity>

          <View style={s.queueDivider} />

          <TouchableOpacity style={s.queueCard} onPress={() => navigation.navigate('Unknown')}>
             <View style={[s.queueIconContainer, { backgroundColor: 'rgba(255,180,171,0.1)' }]}>
              <Text style={s.queueIcon}>❓</Text>
            </View>
            <View style={s.queueInfo}>
              <Text style={s.queueTitle}>Unknown Payments</Text>
              <Text style={s.queueDesc}>Bank credits missing a bill</Text>
            </View>
            <Text style={[s.queueCount, unknownCount > 0 && { color: '#ffb4ab' }]}>{unknownCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1326' },
  header: { 
    padding: 24, paddingTop: 60, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#131b2e',
    borderBottomWidth: 1, borderBottomColor: '#171f33'
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 13, color: '#c7c4d8', marginBottom: 4, fontWeight: '500' },
  showroomName: { fontSize: 24, fontWeight: '700', color: '#dae2fd' },
  offlineBadge: { backgroundColor: '#ffb4ab', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  offlineText: { color: '#410e0b', fontSize: 11, fontWeight: '700' },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  content: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#dae2fd', marginBottom: 12, letterSpacing: 0.3 },
  
  primaryCard: { 
    backgroundColor: '#171f33', borderRadius: 20, padding: 24, 
    borderWidth: 1, borderColor: '#222a3d', overflow: 'hidden',
    position: 'relative'
  },
  primaryCardBg: { 
    position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(79,70,229,0.05)',
  },
  primaryTotalLabel: { fontSize: 14, color: '#c7c4d8', fontWeight: '500', marginBottom: 6 },
  primaryTotalValue: { fontSize: 36, fontWeight: '800', color: '#dae2fd', letterSpacing: -0.5 },
  primaryStatsRow: { flexDirection: 'row', marginTop: 24, gap: 40, zIndex: 1 },
  primaryStatLabel: { fontSize: 13, color: '#c7c4d8', marginBottom: 4 },
  primaryStatValue: { fontSize: 20, fontWeight: '700', color: '#dae2fd' },

  resolveBtn: {
    backgroundColor: '#222a3d', borderRadius: 12, padding: 16, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#464555'
  },
  resolveBadge: { backgroundColor: '#ffb4ab', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  resolveBadgeText: { color: '#410e0b', fontSize: 13, fontWeight: '700' },
  resolveBtnText: { flex: 1, color: '#dae2fd', fontSize: 15, fontWeight: '600' },
  resolveBtnArrow: { color: '#c7c4d8', fontSize: 18 },

  quickEntryBtn: {
    backgroundColor: '#171f33', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#222a3d'
  },
  quickEntryIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  quickEntryIcon: { color: '#fff', fontSize: 24, fontWeight: '300', marginTop: -2 },
  quickEntryTitle: { fontSize: 16, fontWeight: '600', color: '#dae2fd', marginBottom: 2 },
  quickEntryDesc: { fontSize: 13, color: '#c7c4d8' },

  queueContainer: {
    backgroundColor: '#171f33', borderRadius: 16, borderWidth: 1, borderColor: '#222a3d',
    overflow: 'hidden'
  },
  queueCard: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  queueDivider: { height: 1, backgroundColor: '#222a3d', marginHorizontal: 16 },
  queueIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  queueIcon: { fontSize: 18 },
  queueInfo: { flex: 1 },
  queueTitle: { fontSize: 15, fontWeight: '600', color: '#dae2fd', marginBottom: 2 },
  queueDesc: { fontSize: 13, color: '#c7c4d8' },
  queueCount: { fontSize: 18, fontWeight: '700', color: '#c7c4d8' },
});
