import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodaySummary, initDatabase } from '../services/database.service';
import { startSyncService } from '../services/sync.service';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState({ totalSales: 0, matchedCount: 0, totalAmount: 0 });
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

  const pending = summary.totalSales - summary.matchedCount;
  const matchRate = summary.totalSales > 0
    ? Math.round((summary.matchedCount / summary.totalSales) * 100) : 0;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</Text>
          <Text style={s.showroomName}>{showroomName || 'Rekono'}</Text>
        </View>
        {!isOnline && (
          <View style={s.offlineBadge}>
            <Text style={s.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Date */}
      <View style={s.dateBar}>
        <Text style={s.dateText}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        <View style={[s.statCard, s.statCardBlue]}>
          <Text style={s.statValue}>₹{summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          <Text style={s.statLabel}>Today’s Sales</Text>
        </View>
        <View style={[s.statCard, s.statCardGreen]}>
          <Text style={s.statValue}>{summary.matchedCount}</Text>
          <Text style={s.statLabel}>Matched</Text>
        </View>
        <View style={[s.statCard, s.statCardOrange]}>
          <Text style={s.statValue}>{pending}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={[s.statCard, s.statCardPurple]}>
          <Text style={s.statValue}>{matchRate}%</Text>
          <Text style={s.statLabel}>Match Rate</Text>
        </View>
      </View>

      {/* Primary CTA */}
      <View style={s.section}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Sales')}>
          <Text style={s.primaryBtnIcon}>+</Text>
          <Text style={s.primaryBtnText}>New Sale Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Queues */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Review Needed</Text>
        <TouchableOpacity style={s.queueCard} onPress={() => navigation.navigate('Unmatched')}>
          <View style={s.queueLeft}>
            <Text style={s.queueIcon}>📋</Text>
            <View>
              <Text style={s.queueTitle}>Unmatched Sales</Text>
              <Text style={s.queueDesc}>Sales without payment confirmation</Text>
            </View>
          </View>
          <View style={[s.queueBadge, pending > 0 && s.queueBadgeAlert]}>
            <Text style={[s.queueCount, pending > 0 && s.queueCountAlert]}>{pending}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.queueCard} onPress={() => navigation.navigate('Unknown')}>
          <View style={s.queueLeft}>
            <Text style={s.queueIcon}>❓</Text>
            <View>
              <Text style={s.queueTitle}>Unknown Payments</Text>
              <Text style={s.queueDesc}>Payments without matching sales</Text>
            </View>
          </View>
          <View style={s.queueBadge}>
            <Text style={s.queueCount}>0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Access</Text>
        <View style={s.quickGrid}>
          {[
            { label: 'Payments', icon: '💰', screen: 'Payments' },
            { label: 'Invoices', icon: '🧾', screen: 'Sales' },
          ].map(q => (
            <TouchableOpacity key={q.label} style={s.quickCard} onPress={() => navigation.navigate(q.screen)}>
              <Text style={s.quickIcon}>{q.icon}</Text>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#0f172a', padding: 20, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: '#94a3b8', marginBottom: 4 },
  showroomName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  offlineBadge: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dateBar: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10 },
  dateText: { color: '#64748b', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, elevation: 1 },
  statCardBlue: { backgroundColor: '#eff6ff' },
  statCardGreen: { backgroundColor: '#f0fdf4' },
  statCardOrange: { backgroundColor: '#fff7ed' },
  statCardPurple: { backgroundColor: '#faf5ff' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3 },
  primaryBtnIcon: { color: '#fff', fontSize: 22, fontWeight: '300' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  queueCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  queueLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  queueIcon: { fontSize: 24 },
  queueTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  queueDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  queueBadge: { backgroundColor: '#f1f5f9', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  queueBadgeAlert: { backgroundColor: '#fef3c7' },
  queueCount: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  queueCountAlert: { color: '#d97706' },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
});
