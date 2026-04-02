import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import BrandMark from '../components/BrandMark';

export default function SplashScreen() {
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fc" />
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
        <ActivityIndicator size="large" color="#1f5eff" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fc',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e1ee',
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
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#c9dafd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoMeta: {
    flex: 1,
  },
  logoMetaTitle: {
    color: '#102135',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  logoMetaSub: {
    color: '#5f6b7d',
    fontSize: 12,
  },
  title: {
    color: '#102135',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#5f6b7d',
    fontSize: 14,
    marginTop: 6,
  },
  loaderWrap: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d7e1ee',
  },
});
