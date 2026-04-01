import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginMobile } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginMobile(username.trim(), password);
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
      <StatusBar barStyle="light-content" backgroundColor="#0b1326" />
      <View style={s.card}>
        <Text style={s.eyebrow}>Business Login</Text>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to your business workspace.</Text>

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
  container: { flex: 1, backgroundColor: '#0b1326', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#131b2e', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222a3d' },
  eyebrow: { color: '#33d6a6', textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  title: { color: '#dae2fd', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#c7c4d8', marginTop: 8, marginBottom: 20 },
  input: { backgroundColor: '#171f33', borderWidth: 1, borderColor: '#222a3d', borderRadius: 14, padding: 14, color: '#dae2fd', marginBottom: 12 },
  error: { color: '#ffb4ab', marginBottom: 10 },
  primaryBtn: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  link: { color: '#dcecff', textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
