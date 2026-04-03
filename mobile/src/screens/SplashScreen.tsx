import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import BrandMark from '../components/BrandMark';
import colors from '../constants/colors';

export default function SplashScreen() {
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={s.heroGlow} />
      <View style={s.logoWrap}>
        <View style={s.logoBadge}>
          <BrandMark size={58} />
        </View>
        <View style={s.logoMeta}>
          <Text style={s.logoMetaTitle}>Business Reconciliation OS</Text>
          <Text style={s.logoMetaSub}>Mobile Workspace</Text>
        </View>
      </View>
      <Text style={s.title}>Rekono</Text>
      <Text style={s.subtitle}>Loading your workspace</Text>
      <View style={s.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroGlow: {
    position: 'absolute',
    top: 130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(31, 94, 255, 0.08)',
  },
  logoWrap: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#102135',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoMeta: {
    flex: 1,
  },
  logoMetaTitle: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  logoMetaSub: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  title: {
    color: colors.onSurface,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 6,
  },
  loaderWrap: {
    marginTop: 20,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.outlineLighter,
  },
});
