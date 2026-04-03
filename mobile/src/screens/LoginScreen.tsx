import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginMobile } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSubscriptionActive = (user: Record<string, unknown> | undefined) => {
    const subscription = (user?.subscription || {}) as Record<string, unknown>;
    const required = Boolean(subscription.required);
    const status = String(subscription.status || 'inactive');
    return !required || status === 'active';
  };

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await loginMobile(username.trim(), password);
      if (!isSubscriptionActive(data?.user)) {
        navigation.replace('Subscription');
        return;
      }
      const onboarded = await AsyncStorage.getItem('onboardingComplete');
      navigation.replace(onboarded === 'true' ? 'Main' : 'Onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.heroGlow} />
      <View style={s.card}>
        <View style={s.brandRow}>
          <View style={s.brandBadge}>
            <Text style={s.brandBadgeText}>RK</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>Owner Sign In</Text>
            <Text style={s.title}>Welcome back</Text>
          </View>
        </View>
        <Text style={s.subtitle}>Sign in to access your reconciliation workspace and exception queues.</Text>

        <View style={s.signalRow}>
          <View style={s.signalPill}><Text style={s.signalText}>Secure Session</Text></View>
          <View style={s.signalPill}><Text style={s.signalText}>Live Sync</Text></View>
        </View>

        <TextInput
          style={s.input}
          placeholder="Username"
          placeholderTextColor="#7d859b"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#7d859b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.primaryBtn, loading && s.disabledBtn]} onPress={handleLogin} disabled={loading || !username || !password}>
          <Text style={s.primaryBtnText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={s.link}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, justifyContent: 'center', padding: 20 },
  heroGlow: {
    position: 'absolute',
    top: 80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    shadowColor: '#102135',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  brandBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  eyebrow: { color: colors.success, textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 14, lineHeight: 20 },
  signalRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  signalPill: {
    backgroundColor: colors.surfaceLow,
    borderColor: colors.outlineLighter,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signalText: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' },
  input: { backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.outlineLighter, borderRadius: 14, padding: 14, color: colors.onSurface, marginBottom: 12 },
  error: { color: colors.error, marginBottom: 10 },
  primaryBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
