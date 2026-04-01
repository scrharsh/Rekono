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

type StoredUser = {
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
};

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [contextRefreshing, setContextRefreshing] = useState(false);
  const [showroomName, setShowroomName] = useState('Rekono Business');
  const [user, setUser] = useState<StoredUser | null>(null);

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
      <StatusBar barStyle="light-content" backgroundColor="#131b2e" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Business Profile</Text>
          <Text style={s.mainText}>{showroomName}</Text>
          <Text style={s.subText}>{user?.email || 'No email available'}</Text>
          <Text style={s.subText}>User: {user?.fullName || user?.username || 'Business User'}</Text>
          <Text style={s.subText}>Role: {user?.role || 'staff'}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Data & Sync</Text>
          <TouchableOpacity style={s.actionBtn} onPress={handleSyncNow} disabled={syncing}>
            {syncing ? <ActivityIndicator color="#fff" /> : <Text style={s.actionText}>Sync Now</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleRefreshContext} disabled={contextRefreshing}>
            {contextRefreshing ? <ActivityIndicator color="#dae2fd" /> : <Text style={s.secondaryText}>Refresh Business Context</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Session</Text>
          <TouchableOpacity style={s.dangerBtn} onPress={handleLogout} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.actionText}>Sign Out</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1326' },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#171f33',
    backgroundColor: '#131b2e',
  },
  back: { color: '#c3c0ff', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title: { color: '#dae2fd', fontSize: 24, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: '#171f33',
    borderWidth: 1,
    borderColor: '#222a3d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: '#dae2fd', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  mainText: { color: '#dae2fd', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subText: { color: '#c7c4d8', fontSize: 13, marginBottom: 4 },
  actionBtn: {
    marginTop: 4,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#464555',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: { color: '#dae2fd', fontSize: 14, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: '#c2410c',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
