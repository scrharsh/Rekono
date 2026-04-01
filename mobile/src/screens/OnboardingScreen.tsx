import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import {
  BusinessMode,
  fetchBusinessContext,
  fetchCurrentUser,
  refreshAccessToken,
  upsertBusinessProfile,
} from '../services/businessProfile.service';

const MODES = [
  { id: 'retail', label: 'Retail Store', desc: 'Fast billing, standard items' },
  { id: 'wholesale', label: 'Wholesale', desc: 'Bulk orders, credit tracking' },
  { id: 'services', label: 'Services', desc: 'Time-based billing, labor' },
  { id: 'agency', label: 'Agency', desc: 'Project milestones, retainers' },
  { id: 'workshop', label: 'Workshop/Repair', desc: 'Estimates, parts + labor' },
  { id: 'mixed', label: 'Mixed', desc: 'Products + Services combined' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  const handleComplete = async () => {
    try {
      if (!businessName || !selectedMode) return;

      const profile = await upsertBusinessProfile({
        name: businessName,
        businessMode: selectedMode as BusinessMode,
      });

      await refreshAccessToken();
      const context = await fetchBusinessContext();
      const me = await fetchCurrentUser();

      const existingShowroomId = await AsyncStorage.getItem('showroomId');
      if (context?.showroomId) {
        await AsyncStorage.setItem('showroomId', String(context.showroomId));
      } else if (profile?.showroomId || profile?.legacyShowroomId) {
        await AsyncStorage.setItem('showroomId', String(profile.showroomId || profile.legacyShowroomId));
      } else if (me?.showroomIds?.length) {
        await AsyncStorage.setItem('showroomId', String(me.showroomIds[0]));
      } else if (!existingShowroomId) {
        await AsyncStorage.setItem('showroomId', String(uuid.v4()));
      }

      await AsyncStorage.setItem('showroomName', businessName);
      await AsyncStorage.setItem('businessMode', selectedMode);
      if (context?.businessProfileId) {
        await AsyncStorage.setItem('businessProfileId', context.businessProfileId);
      } else if (profile?._id) {
        await AsyncStorage.setItem('businessProfileId', profile._id);
      }
      await AsyncStorage.setItem('onboardingComplete', 'true');
      navigation.replace('Main');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1326" />
      
      {step === 1 && (
        <View style={s.content}>
          <Text style={s.title}>Welcome to Rekono</Text>
          <Text style={s.subtitle}>Let&apos;s set up your business intelligence workspace.</Text>
          
          <View style={s.inputContainer}>
            <Text style={s.label}>What is the name of your business?</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Sharma Electronics"
              placeholderTextColor="#464555"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          <TouchableOpacity 
            style={[s.primaryBtn, !businessName && s.disabledBtn]} 
            disabled={!businessName}
            onPress={() => setStep(2)}
          >
            <Text style={s.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={s.content}>
          <Text style={s.title}>Business Mode</Text>
          <Text style={s.subtitle}>How does {businessName} operate? This adapts Rekono to your workflow.</Text>
          
          <ScrollView style={s.modesList} showsVerticalScrollIndicator={false}>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[s.modeCard, selectedMode === m.id && s.modeCardSelected]}
                onPress={() => setSelectedMode(m.id)}
              >
                <View style={s.modeInfo}>
                  <Text style={s.modeLabel}>{m.label}</Text>
                  <Text style={s.modeDesc}>{m.desc}</Text>
                </View>
                <View style={[s.radio, selectedMode === m.id && s.radioSelected]}>
                  {selectedMode === m.id && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity 
              style={[s.primaryBtn, !selectedMode && s.disabledBtn]} 
              disabled={!selectedMode}
              onPress={handleComplete}
            >
              <Text style={s.primaryBtnText}>Start Using Rekono</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1326' },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#dae2fd', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#c7c4d8', marginBottom: 32, lineHeight: 24 },
  inputContainer: { marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#dae2fd', marginBottom: 12 },
  input: {
    backgroundColor: '#171f33',
    borderRadius: 12,
    padding: 16,
    color: '#dae2fd',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#464555',
  },
  modesList: { flex: 1 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171f33',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#171f33', // or 'transparent'
  },
  modeCardSelected: {
    backgroundColor: '#222a3d',
    borderColor: '#4f46e5',
  },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: 16, fontWeight: '600', color: '#dae2fd', marginBottom: 4 },
  modeDesc: { fontSize: 13, color: '#c7c4d8' },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#464555',
    alignItems: 'center', justifyContent: 'center'
  },
  radioSelected: { borderColor: '#4f46e5' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4f46e5' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0b1326', padding: 24,
    borderTopWidth: 1, borderTopColor: '#171f33'
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#222a3d', opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
