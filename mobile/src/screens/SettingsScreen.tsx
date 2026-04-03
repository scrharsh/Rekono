import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { forceSyncNow } from '../services/sync.service';
import { getStoredUser, logoutMobile } from '../services/auth.service';
import { hydrateBusinessContextFromServer } from '../services/businessProfile.service';
import colors from '../constants/colors';

type StoredUser = {
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  subscription?: {
    plan?: string;
    status?: string;
    required?: boolean;
  };
};

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [contextRefreshing, setContextRefreshing] = useState(false);
  const [showroomName, setShowroomName] = useState('Rekono Business');
  const [user, setUser] = useState<StoredUser | null>(null);

  const subscription = (user?.subscription || {}) as Record<string, unknown>;
  const subscriptionLabel = `${String(subscription.plan || 'business_monthly').replace('_', ' ').toUpperCase()} • ${String(subscription.status || 'inactive').toUpperCase()}`;

  const loadProfile = useCallback(async () => {
    const storedUser = await getStoredUser();
    const name = await AsyncStorage.getItem('showroomName');

    setUser((storedUser || null) as StoredUser | null);
    setShowroomName(name || 'Rekono Business');
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await forceSyncNow();
      Alert.alert('Sync complete', 'Local records are synced to the server.');
    } catch {
      Alert.alert('Sync failed', 'Please try again in a moment.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshContext = async () => {
    try {
      setContextRefreshing(true);
      await hydrateBusinessContextFromServer();
      await loadProfile();
      Alert.alert('Updated', 'Business context refreshed from server.');
    } catch {
      Alert.alert('Refresh failed', 'Unable to refresh business context right now.');
    } finally {
      setContextRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign out', 'Do you want to sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await logoutMobile();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.headerGlow} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Workspace Settings</Text>
        <Text style={s.subtitle}>Account, sync and workspace controls</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Workspace</Text>
          <Text style={s.cardTitle}>Business Profile</Text>
          <Text style={s.mainText}>{showroomName}</Text>
          <Text style={s.subText}>{user?.email || 'No email available'}</Text>
          <Text style={s.subText}>User: {user?.fullName || user?.username || 'Business User'}</Text>
          <Text style={s.subText}>Role: {user?.role || 'staff'}</Text>
          <Text style={s.subText}>Subscription: {subscriptionLabel}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Data Integrity</Text>
          <Text style={s.cardTitle}>Data & Sync</Text>
          <TouchableOpacity style={s.actionBtn} onPress={handleSyncNow} disabled={syncing}>
            {syncing ? <ActivityIndicator color={colors.white} /> : <Text style={s.actionText}>Sync Now</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleRefreshContext} disabled={contextRefreshing}>
            {contextRefreshing ? <ActivityIndicator color={colors.primary} /> : <Text style={s.secondaryText}>Refresh Business Context</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Notifications</Text>
          <Text style={s.cardTitle}>Activity Feed</Text>
          <Text style={s.subText}>View task assignments, payment events, and CA updates in one place.</Text>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Main', { screen: 'Notifications' })}>
            <Text style={s.secondaryText}>Open Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Security</Text>
          <Text style={s.cardTitle}>Session</Text>
          <TouchableOpacity style={s.dangerBtn} onPress={handleLogout} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.actionText}>Sign Out</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerGlow: {
    position: 'absolute',
    top: 20,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineLighter,
    backgroundColor: colors.surfaceContainer,
  },
  back: { color: colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: 13, marginTop: 6 },
  content: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#102135',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  cardTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  mainText: { color: colors.onSurface, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subText: { color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 4 },
  actionBtn: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: { color: colors.onSurface, fontSize: 14, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
