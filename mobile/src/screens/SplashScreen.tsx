import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1326" />
      <View style={s.logoWrap}>
        <Text style={s.logo}>R</Text>
      </View>
      <Text style={s.title}>Rekono</Text>
      <Text style={s.subtitle}>Loading your workspace</Text>
      <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 18 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1326',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#222a3d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: {
    color: '#dae2fd',
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    color: '#dae2fd',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#c7c4d8',
    fontSize: 14,
    marginTop: 6,
  },
});
