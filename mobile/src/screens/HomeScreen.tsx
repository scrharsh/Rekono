import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, StatusBar,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPaymentsByShowroom, getTodaySummary, initDatabase } from '../services/database.service';
import { startSyncService } from '../services/sync.service';
import colors from '../constants/colors';
import { getUnreadNotificationCount } from '../services/notification.service';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, unknown>>>();
  const [summary, setSummary] = useState({ totalSales: 0, matchedCount: 0, totalAmount: 0 });
  const [unknownCount, setUnknownCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
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
        const unreadNotifications = await getUnreadNotificationCount(30);
        setNotificationCount(unreadNotifications);
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
  const partOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {partOfDay}</Text>
          <Text style={s.showroomName}>{showroomName || 'Rekono Business'}</Text>
        </View>
        <View style={s.headerActions}>
           {!isOnline && (
             <View style={s.offlineBadge}>
               <Text style={s.offlineText}>Offline</Text>
             </View>
           )}
           <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Settings')}>
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

        <TouchableOpacity style={[s.resolveBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Notifications')}>
          <View style={[s.resolveBadge, { backgroundColor: colors.surfaceHigh }]}><Text style={s.resolveBadgeText}>{notificationCount}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.resolveBtnText}>Open Notifications</Text>
            <Text style={s.resolveBtnSubtext}>Task, payment, and document updates</Text>
          </View>
          <Text style={s.resolveBtnArrow}>→</Text>
        </TouchableOpacity>

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
              <Text style={s.queueIcon}>UN</Text>
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
              <Text style={s.queueIcon}>UK</Text>
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
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineLighter,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 4, fontWeight: '500' },
  showroomName: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  offlineBadge: { backgroundColor: colors.errorDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  offlineText: { color: colors.error, fontSize: 11, fontWeight: '700' },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  content: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.onSurface, marginBottom: 12, letterSpacing: 0.3 },

  primaryCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    overflow: 'hidden',
    position: 'relative',
  },
  primaryCardBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: `rgba(11, 87, 208, 0.06)`,
  },
  primaryTotalLabel: { fontSize: 14, color: colors.onSurfaceVariant, fontWeight: '500', marginBottom: 6 },
  primaryTotalValue: { fontSize: 36, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  primaryStatsRow: { flexDirection: 'row', marginTop: 24, gap: 40, zIndex: 1 },
  primaryStatLabel: { fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 4 },
  primaryStatValue: { fontSize: 20, fontWeight: '700', color: colors.onSurface },

  resolveBtn: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineLighter,
  },
  resolveBadge: { backgroundColor: colors.errorDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  resolveBadgeText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  resolveBtnText: { flex: 1, color: colors.onSurface, fontSize: 15, fontWeight: '600' },
  resolveBtnSubtext: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  resolveBtnArrow: { color: colors.onSurfaceVariant, fontSize: 18 },

  quickEntryBtn: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineLighter,
  },
  quickEntryIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  quickEntryIcon: { color: colors.white, fontSize: 24, fontWeight: '300', marginTop: -2 },
  quickEntryTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: 2 },
  quickEntryDesc: { fontSize: 13, color: colors.onSurfaceVariant },

  queueContainer: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    overflow: 'hidden',
  },
  queueCard: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  queueDivider: { height: 1, backgroundColor: colors.outlineLighter, marginHorizontal: 16 },
  queueIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  queueIcon: { fontSize: 11, fontWeight: '800', color: colors.onSurfaceVariant, letterSpacing: 0.6 },
  queueInfo: { flex: 1 },
  queueTitle: { fontSize: 15, fontWeight: '600', color: colors.onSurface, marginBottom: 2 },
  queueDesc: { fontSize: 13, color: colors.onSurfaceVariant },
  queueCount: { fontSize: 18, fontWeight: '700', color: colors.onSurfaceVariant },
});
