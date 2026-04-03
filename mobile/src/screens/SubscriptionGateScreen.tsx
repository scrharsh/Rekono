import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createBusinessSubscriptionPaymentLink,
  getStoredUser,
  refreshStoredSubscription,
} from '../services/auth.service';
import colors from '../constants/colors';

function isSubscriptionActive(user: Record<string, unknown> | null): boolean {
  const subscription = (user?.subscription || {}) as Record<string, unknown>;
  const required = Boolean(subscription.required);
  const status = String(subscription.status || 'inactive');
  return !required || status === 'active';
}

export default function SubscriptionGateScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    try {
      setLoading(true);
      const paymentLink = await createBusinessSubscriptionPaymentLink('business_monthly', 30);
      await Linking.openURL(paymentLink.paymentUrl);
      Alert.alert('Razorpay opened', 'Complete payment in Razorpay, then tap "I already subscribed".');
    } catch (error) {
      Alert.alert('Checkout failed', error instanceof Error ? error.message : 'Unable to start Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleRecheck = async () => {
    await refreshStoredSubscription();
    const user = await getStoredUser();
    if (isSubscriptionActive(user)) {
      const onboarded = await AsyncStorage.getItem('onboardingComplete');
      navigation.reset({
        index: 0,
        routes: [{ name: onboarded === 'true' ? 'Main' : 'Onboarding' }],
      });
      return;
    }

    Alert.alert('Payment pending', 'We could not confirm payment yet. Complete Razorpay payment and try again.');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.heroGlow} />

      <View style={s.card}>
        <Text style={s.eyebrow}>Business Subscription</Text>
        <Text style={s.title}>Activate to continue</Text>
        <Text style={s.subtitle}>
          Rekono Business OS requires an active subscription. CA workspaces remain free for now.
        </Text>

        <View style={s.featuresWrap}>
          <Text style={s.feature}>• Reconciliation queues and auto-match</Text>
          <Text style={s.feature}>• Sales, payments, and catalog workflows</Text>
          <Text style={s.feature}>• Sync across mobile, web, and desktop</Text>
        </View>

        <TouchableOpacity style={[s.primaryBtn, loading && s.disabledBtn]} onPress={handleActivate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.primaryBtnText}>Pay with Razorpay</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={handleRecheck}>
          <Text style={s.secondaryText}>I already subscribed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, justifyContent: 'center', padding: 20 },
  heroGlow: {
    position: 'absolute',
    top: 90,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
  },
  eyebrow: {
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  featuresWrap: {
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  feature: { color: colors.onSurface, fontSize: 13, fontWeight: '500' },
  primaryBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    padding: 14,
  },
  secondaryText: { color: colors.onSurface, fontWeight: '600' },
});
