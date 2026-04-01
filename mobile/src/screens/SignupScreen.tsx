import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signupMobile } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({ username: '', fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    try {
      setError('');
      if (form.password !== form.confirm) {
        setError('Passwords do not match');
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setLoading(true);
      await signupMobile({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });

      await AsyncStorage.setItem('onboardingComplete', 'false');
      navigation.replace('Onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1326" />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.eyebrow}>Business Signup</Text>
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Get started with Rekono on mobile.</Text>

          <TextInput style={s.input} placeholder="Full name" placeholderTextColor="#7d859b" value={form.fullName} onChangeText={update('fullName')} />
          <TextInput style={s.input} placeholder="Username" placeholderTextColor="#7d859b" value={form.username} onChangeText={update('username')} autoCapitalize="none" />
          <TextInput style={s.input} placeholder="Email" placeholderTextColor="#7d859b" value={form.email} onChangeText={update('email')} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={s.input} placeholder="Phone (optional)" placeholderTextColor="#7d859b" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor="#7d859b" value={form.password} onChangeText={update('password')} secureTextEntry />
          <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor="#7d859b" value={form.confirm} onChangeText={update('confirm')} secureTextEntry />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.primaryBtn, loading && s.disabledBtn]} onPress={handleSignup} disabled={loading}>
            <Text style={s.primaryBtnText}>{loading ? 'Creating account...' : 'Create account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1326' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
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