import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);

const COLORS = [
  '#000000', '#F43F5E', '#8B5CF6', '#10B981', '#3B82F6',
  '#F59E0B', '#6366F1', '#EC4899', '#14B8A6', '#4B5563'
];

const ALL_ICONS = [
  'barbell', 'water', 'book', 'heart', 'sunny', 'flash', 'meditation', 'bicycle', 
  'alarm', 'leaf', 'moon', 'pills', 'walk', 'cafe', 'fast-food', 'bar-chart', 
  'code-slash', 'musical-notes', 'camera', 'airplane', 'basketball', 'brush', 
  'car', 'cart', 'chatbubbles', 'cloudy-night', 'construct', 'desktop', 'egg',
  'extension-puzzle', 'fitness', 'football', 'game-controller', 'gift', 'hammer'
];

export default function AddHabitScreen({ onCancel, onSave }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('barbell');
  const [search, setSearch] = useState('');
  const [time, setTime] = useState({ hr: '08', min: '00', ampm: 'AM' });

  const nextStep = () => {
    if (step === 1 && !name.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(step + 1);
  };

  const prevStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(step - 1);
  };

  const filteredIcons = ALL_ICONS.filter(i => i.includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 1 ? onCancel : prevStep}>
          <Ionicons name={step === 1 ? "close" : "chevron-back"} size={28} />
        </TouchableOpacity>
        <View style={styles.progressRow}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {step === 1 && (
            <View>
              <Text style={styles.title}>New Habit</Text>
              <Text style={styles.label}>HABIT NAME</Text>
              <TextInput style={styles.input} placeholder="e.g. Morning Yoga" value={name} onChangeText={setName} autoFocus />
              
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput style={[styles.input, { fontSize: fs(16) }]} placeholder="e.g. 15 mins flow" value={desc} onChangeText={setDesc} />

              <Text style={styles.label}>THEME COLOR</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorActive]} />
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>Choose Icon</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#AAA" />
                <TextInput style={styles.searchInput} placeholder="Search icons..." value={search} onChangeText={setSearch} />
              </View>
              <View style={styles.iconGrid}>
                {filteredIcons.slice(0, 20).map(i => (
                  <TouchableOpacity key={i} onPress={() => setIcon(i)} style={[styles.iconBtn, icon === i && styles.iconBtnActive]}>
                    <Ionicons name={i} size={24} color={icon === i ? "#FFF" : "#000"} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.title}>Reminder Time</Text>
              <View style={styles.timeRow}>
                <TextInput style={styles.timeInput} value={time.hr} keyboardType="numeric" maxLength={2} onChangeText={t => setTime({...time, hr: t})} />
                <Text style={styles.timeSep}>:</Text>
                <TextInput style={styles.timeInput} value={time.min} keyboardType="numeric" maxLength={2} onChangeText={t => setTime({...time, min: t})} />
              </View>
              <View style={styles.ampmRow}>
                {['AM', 'PM'].map(a => (
                  <TouchableOpacity key={a} onPress={() => setTime({...time, ampm: a})} style={[styles.ampmBtn, time.ampm === a && styles.ampmActive]}>
                    <Text style={[styles.ampmText, time.ampm === a && styles.ampmTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.mainBtn} onPress={step === 3 ? () => onSave({ name, desc, color, icon, time }) : nextStep}>
          <Text style={styles.mainBtnTxt}>{step === 3 ? "Create Habit" : "Continue"}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  progressRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 12, height: 4, borderRadius: 2, backgroundColor: '#EEE' },
  dotActive: { backgroundColor: '#000', width: 24 },
  scrollContent: { padding: 25 },
  title: { fontSize: fs(28), fontWeight: '900', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', color: '#BBB', letterSpacing: 1.5, marginTop: 25, marginBottom: 12 },
  input: { fontSize: fs(20), fontWeight: '700', borderBottomWidth: 1.5, borderColor: '#EEE', paddingBottom: 10 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
  colorCircle: { width: (SCREEN_W - 100) / 5, height: (SCREEN_W - 100) / 5, borderRadius: 12 },
  colorActive: { borderWidth: 4, borderColor: '#DDD' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 15, padding: 12, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '600' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconBtn: { width: (SCREEN_W - 80) / 4, height: (SCREEN_W - 80) / 4, borderRadius: 18, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center' },
  iconBtnActive: { backgroundColor: '#000' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 40 },
  timeInput: { width: scale(80), height: scale(90), backgroundColor: '#F5F5F5', borderRadius: 20, textAlign: 'center', fontSize: 32, fontWeight: '800' },
  timeSep: { fontSize: 32, fontWeight: '800' },
  ampmRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 15, padding: 5, marginTop: 30 },
  ampmBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  ampmActive: { backgroundColor: '#FFF', elevation: 2, shadowOpacity: 0.1 },
  ampmText: { fontWeight: '800', color: '#AAA' },
  ampmTextActive: { color: '#000' },
  footer: { paddingHorizontal: 25 },
  mainBtn: { backgroundColor: '#000', padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});