import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Platform, Image, Alert, Modal, TextInput, KeyboardAvoidingView,
  StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);
const vs = (size) => (SCREEN_H / 844) * size;

const STORAGE_KEY = '@flovain_habits_data';

const GOAL_META = {
  fitness: { label: 'Get Fit', icon: 'barbell', color: '#F43F5E', bg: '#FFF1F2' },
  study: { label: 'Study Better', icon: 'book', color: '#F59E0B', bg: '#FFFBEB' },
  mental: { label: 'Mental Health', icon: 'heart', color: '#8B5CF6', bg: '#F5F3FF' },
  discipline: { label: 'Build Discipline', icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Be More Productive', icon: 'flash', color: '#10B981', bg: '#ECFDF5' },
};

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const ICONS = ['barbell', 'water', 'book', 'heart', 'sunny', 'flash', 'meditation', 'bicycle', 'alarm', 'leaf', 'moon', 'pills', 'walk'];
const COLORS = ['#000000', '#F43F5E', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

const NAV_TABS = [
  { id: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { id: 'stats', label: 'Stats', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
];

// --- Habit Row Component ---
const HabitRow = ({ habit, checked, streak, onToggle, onDelete }) => {
  const isDark = ['#000000', '#6366F1', '#F43F5E', '#8B5CF6'].includes(habit.color);
  const textColor = isDark ? '#FFF' : '#000';

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onToggle(habit.id)} 
      onLongPress={() => onDelete(habit.id)}
      style={[styles.habitCard, { backgroundColor: habit.color }, checked && { opacity: 0.6 }]}
    >
      <View style={styles.habitIconBubble}>
        <Ionicons name={checked ? 'checkmark-circle' : habit.icon} size={scale(22)} color={textColor} />
      </View>
      <View style={styles.habitMeta}>
        <View style={styles.habitTitleRow}>
          <Text style={[styles.habitLabel, { color: textColor }, checked && styles.habitLabelDone]}>{habit.label}</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={scale(10)} color={textColor} />
            <Text style={[styles.streakText, { color: textColor }]}>{streak}</Text>
          </View>
        </View>
        <View style={styles.weekTrackerRow}>
          {DAYS_SHORT.map((d, di) => {
            if (!habit.days.includes(di)) return null;
            const isToday = di === TODAY_IDX;
            return (
              <View key={di} style={styles.dayColumn}>
                <View style={[styles.weekDot, { backgroundColor: textColor, opacity: isToday ? 1 : 0.3 }]} />
                <Text style={[styles.dayLetter, { color: textColor, fontWeight: isToday ? '900' : '500' }]}>{d}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={[styles.checkCircle, { borderColor: textColor }, checked && { backgroundColor: textColor }]}>
        {checked && <Ionicons name="checkmark" size={scale(14)} color={habit.color} />}
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ userData, onLogout }) {
  const insets = useSafeAreaInsets();
  
  // State
  const [habits, setHabits] = useState([]); 
  const [checked, setChecked] = useState(new Set());
  const [streaks, setStreaks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Form State
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [remTime, setRemTime] = useState({ hr: '08', min: '00', ampm: 'AM' });
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);

  const progressW = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(0)).current;

  // --- PERSISTENCE LOGIC ---
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const savedData = JSON.parse(jsonValue);
          setHabits(savedData.habits || []);
          setStreaks(savedData.streaks || {});
          setChecked(new Set(savedData.checked || []));
        }
      } catch (e) {
        console.error("Failed to load habits", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data whenever habits, streaks, or checked changes
  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          const dataToSave = {
            habits,
            streaks,
            checked: Array.from(checked), // Convert Set to Array for JSON
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
          console.error("Failed to save habits", e);
        }
      };
      saveData();
    }
  }, [habits, streaks, checked, isLoaded]);

  // --- Handlers ---

  const handleTabPress = (id, index) => {
    setActiveTab(id);
    Animated.spring(tabTranslateX, { toValue: index * ((SCREEN_W - scale(56)) / 3), useNativeDriver: true, tension: 50, friction: 10 }).start();
    if (id === 'settings') {
      Alert.alert("Reset App", "Clear all data?", [
        { text: "Cancel", onPress: () => handleTabPress('home', 0) },
        { text: "Reset", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          onLogout();
        }}
      ]);
    }
  };

  const toggleHabit = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setStreaks(s => ({ ...s, [id]: Math.max(0, (s[id] || 0) - 1) }));
      } else {
        next.add(id);
        setStreaks(s => ({ ...s, [id]: (s[id] || 0) + 1 }));
      }
      return next;
    });
  };

  const deleteHabit = (id) => {
    Alert.alert("Remove Habit", "Delete this habit permanently?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        setHabits(prev => prev.filter(h => h.id !== id));
        setChecked(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }}
    ]);
  };

  const handleCreate = () => {
    if (!newName.trim()) return Alert.alert("Wait", "Please name your habit");
    const h = { id: Date.now().toString(), label: newName, icon: selectedIcon, color: selectedColor, days: selectedDays, time: remTime };
    setHabits([...habits, h]);
    setModalVisible(false);
    setNewName(''); setModalStep(1);
  };

  useEffect(() => {
    const p = habits.length > 0 ? checked.size / habits.length : 0;
    Animated.timing(progressW, { toValue: p, duration: 400, useNativeDriver: false }).start();
  }, [checked, habits]);

  const goal = GOAL_META[userData?.goals?.[0] || 'productivity'];

  if (!isLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* SOLID FIXED HEADER */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/flovain-intro.png')} style={styles.brandImg} />
            <Text style={styles.brandTxt}>FLOVAIN</Text>
          </View>
          <View style={[styles.goalPill, { backgroundColor: goal.bg }]}>
            <Ionicons name={goal.icon} size={12} color={goal.color} />
            <Text style={[styles.goalPillTxt, { color: goal.color }]}>{goal.label.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.headerUser}>{userData?.username || 'User'}</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: vs(160), paddingBottom: vs(120) }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {habits.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}><Ionicons name="sparkles-outline" size={40} color="#000" /></View>
              <Text style={styles.emptyTitle}>Your journey starts here</Text>
              <Text style={styles.emptySub}>Transform your life one small habit at a time. Create your first goal below.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalVisible(true)}>
                <Text style={styles.btnPrimaryTxt}>Add First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.statCard}>
                <View style={styles.statTop}>
                  <View>
                    <Text style={styles.statLabel}>DAILY PROGRESS</Text>
                    <Text style={styles.statCount}>{checked.size}<Text style={{color:'#CCC'}}>/{habits.length}</Text></Text>
                  </View>
                  <View style={styles.statCircle}><Text style={styles.statPct}>{Math.round((checked.size/habits.length)*100)}%</Text></View>
                </View>
                <View style={styles.statBarTrack}>
                  <Animated.View style={[styles.statBarFill, { width: progressW.interpolate({inputRange:[0,1], outputRange:['0%','100%']}) }]} />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Today's Focus</Text>
              {habits.map(h => (
                <HabitRow key={h.id} habit={h} checked={checked.has(h.id)} streak={streaks[h.id]||0} onToggle={toggleHabit} onDelete={deleteHabit} />
              ))}
              <TouchableOpacity style={styles.addSmallBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={24} color="#FFF" />
                <Text style={styles.addSmallBtnTxt}>Add New Habit</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* GLASSMORPHISM NAV BAR */}
      <View style={[styles.navContainer, { bottom: Math.max(insets.bottom, 15) }]}>
        <View style={styles.navInner}>
          <Animated.View style={[styles.navPill, { transform: [{ translateX: tabTranslateX }] }]} />
          {NAV_TABS.map((t, i) => (
            <TouchableOpacity key={t.id} style={styles.navTab} onPress={() => handleTabPress(t.id, i)}>
              <Ionicons name={activeTab === t.id ? t.icon : t.iconOutline} size={22} color={activeTab === t.id ? '#FFF' : '#999'} />
              <Text style={[styles.navTabTxt, { color: activeTab === t.id ? '#FFF' : '#999' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ADD HABIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => modalStep === 1 ? setModalVisible(false) : setModalStep(1)}>
              <Ionicons name={modalStep === 1 ? "close" : "arrow-back"} size={26} />
            </TouchableOpacity>
            <View style={styles.modalProgress}>
              <View style={[styles.mDot, { backgroundColor: '#000' }]} />
              <View style={[styles.mLine, { backgroundColor: modalStep === 2 ? '#000' : '#EEE' }]} />
              <View style={[styles.mDot, { backgroundColor: modalStep === 2 ? '#000' : '#EEE' }]} />
            </View>
            <View style={{ width: 26 }} />
          </View>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <ScrollView style={{ padding: 25 }}>
              {modalStep === 1 ? (
                <>
                  <Text style={styles.mTitle}>What is your habit?</Text>
                  <TextInput style={styles.mInput} placeholder="E.g. Read 10 Pages" value={newName} onChangeText={setNewName} autoFocus placeholderTextColor="#CCC" />
                  <Text style={styles.mLabel}>CHOOSE ICON</Text>
                  <View style={styles.mIconGrid}>
                    {ICONS.map(icon => (
                      <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.mIconBtn, selectedIcon === icon && styles.mIconBtnActive]}>
                        <Ionicons name={icon} size={22} color={selectedIcon === icon ? "#FFF" : "#000"} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.mLabel}>THEME COLOR</Text>
                  <View style={styles.mColorGrid}>
                    {COLORS.map(c => (
                      <TouchableOpacity key={c} onPress={() => setSelectedColor(c)} style={[styles.mColorCircle, { backgroundColor: c }, selectedColor === c && { borderWidth: 3, borderColor: '#DDD' }]} />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.mTitle}>Set the schedule</Text>
                  <Text style={styles.mLabel}>TIME REMINDER</Text>
                  <View style={styles.mTimeRow}>
                    <TextInput style={styles.mTimeBox} value={remTime.hr} onChangeText={t => setRemTime({...remTime, hr:t})} keyboardType="numeric" maxLength={2} />
                    <Text style={styles.mTimeSep}>:</Text>
                    <TextInput style={styles.mTimeBox} value={remTime.min} onChangeText={t => setRemTime({...remTime, min:t})} keyboardType="numeric" maxLength={2} />
                    <View style={styles.mAmPm}>
                      {['AM', 'PM'].map(a => (
                        <TouchableOpacity key={a} onPress={() => setRemTime({...remTime, ampm:a})} style={[styles.mAmBtn, remTime.ampm === a && { backgroundColor: '#000' }]}>
                          <Text style={{ fontWeight: '800', fontSize: 10, color: remTime.ampm === a ? '#FFF' : '#AAA' }}>{a}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.mLabel}>REPEAT DAYS</Text>
                  <View style={styles.mDayGrid}>
                    {FULL_DAYS.map((d, i) => {
                      const sel = selectedDays.includes(i);
                      return (
                        <TouchableOpacity key={d} onPress={() => setSelectedDays(prev => sel ? prev.filter(x => x !== i) : [...prev, i])} style={[styles.mDayChip, sel && { backgroundColor: '#000' }]}>
                          <Text style={[styles.mDayChipTxt, sel && { color: '#FFF' }]}>{d}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={styles.mFooter}>
            <TouchableOpacity style={styles.mMainBtn} onPress={() => modalStep === 1 ? setModalStep(2) : handleCreate()}>
              <Text style={styles.mMainBtnTxt}>{modalStep === 1 ? "Continue" : "Create Habit"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#FFF', zIndex: 100, paddingHorizontal: 22, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandImg: { width: 22, height: 22, resizeMode: 'contain' },
  brandTxt: { fontWeight: '900', fontSize: fs(14), letterSpacing: 2, right: '6' },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  goalPillTxt: { fontWeight: '800', fontSize: 9 },
  headerUser: { fontWeight: '900', fontSize: fs(28), letterSpacing: -1, left : '5' , bottom: '14' },
  headerDate: { color: '#AAA', fontWeight: '600', fontSize: fs(13) , left : '5', bottom: '14' },
  content: { paddingHorizontal: 22 },
  emptyBox: { alignItems: 'center', marginTop: vs(40) },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
  emptySub: { color: '#666', textAlign: 'center', lineHeight: 22, paddingHorizontal: 30, marginBottom: 30 },
  btnPrimary: { backgroundColor: '#000', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 100 },
  btnPrimaryTxt: { color: '#FFF', fontWeight: '800' },
  statCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#F3F4F6' },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  statCount: { fontSize: 38, fontWeight: '900' },
  statCircle: { width: 55, height: 55, borderRadius: 30, borderWidth: 4, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  statPct: { fontWeight: '900', fontSize: 13 },
  statBarTrack: { height: 6, backgroundColor: '#F5F5F5', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  statBarFill: { height: '100%', backgroundColor: '#000' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginTop: 30, marginBottom: 15 },
  habitCard: { borderRadius: 22, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  habitIconBubble: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  habitMeta: { flex: 1 },
  habitTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 },
  habitLabel: { fontWeight: '800', fontSize: 16 },
  habitLabelDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  streakText: { fontSize: 10, fontWeight: '900' },
  weekTrackerRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dayColumn: { alignItems: 'center', gap: 4 },
  weekDot: { width: 4, height: 4, borderRadius: 2 },
  dayLetter: { fontSize: 9 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  addSmallBtn: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 20, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addSmallBtnTxt: { color: '#FFF', fontWeight: '800' },
  navContainer: { position: 'absolute', left: 22, right: 22, height: 72, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 35, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  navInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  navPill: { position: 'absolute', height: '75%', width: (SCREEN_W - scale(56)) / 3, backgroundColor: '#000', borderRadius: 30, left: 6 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  navTabTxt: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  modalRoot: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mDot: { width: 6, height: 6, borderRadius: 3 },
  mLine: { width: 30, height: 2, borderRadius: 1 },
  mTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 20 },
  mLabel: { fontSize: 10, fontWeight: '900', color: '#BBB', letterSpacing: 1.5, marginTop: 30, marginBottom: 15 },
  mInput: { fontSize: 24, fontWeight: '700', borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 15 },
  mIconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mIconBtn: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  mIconBtnActive: { backgroundColor: '#000' },
  mColorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  mColorCircle: { width: 42, height: 42, borderRadius: 21 },
  mTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mTimeBox: { width: 75, height: 65, backgroundColor: '#F5F5F5', borderRadius: 18, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  mTimeSep: { fontSize: 24, fontWeight: '800' },
  mAmPm: { gap: 6 },
  mAmBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F5' },
  mDayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mDayChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5F5F5' },
  mDayChipTxt: { fontWeight: '700', color: '#666' },
  mFooter: { padding: 25, paddingBottom: 40 },
  mMainBtn: { backgroundColor: '#000', paddingVertical: 20, borderRadius: 24, alignItems: 'center' },
  mMainBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});