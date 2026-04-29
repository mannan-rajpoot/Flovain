import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Image, Alert, StatusBar, ActivityIndicator, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Responsive Scaling Functions
const scale = (size) => (SCREEN_W / 390) * size;
const vs = (size) => (SCREEN_H / 844) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.1);

const STORAGE_KEY = '@flovain_habits_data';
const GOAL_META = {
  fitness: { label: 'Fitness', icon: 'barbell', color: '#F43F5E', bg: '#FFF1F2' },
  study: { label: 'Knowledge', icon: 'book', color: '#F59E0B', bg: '#FFFBEB' },
  mental: { label: 'Mindset', icon: 'heart', color: '#8B5CF6', bg: '#F5F3FF' },
  discipline: { label: 'Discipline', icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Focus', icon: 'flash', color: '#10B981', bg: '#ECFDF5' },
};

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

// --- FIXED HABIT ROW COMPONENT ---
const HabitRow = ({ habit, checked, streak, onToggle, onDelete }) => {
  const isDark = ['#000000', '#6366F1', '#F43F5E', '#8B5CF6'].includes(habit.color);
  const textColor = isDark ? '#FFF' : '#1A1A1A';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onToggle(habit.id)} 
      onLongPress={() => onDelete(habit.id)}
      style={[
        styles.habitCard, 
        { backgroundColor: habit.color }, 
        checked && { opacity: 0.6, transform: [{ scale: 0.98 }] }
      ]}
    >
      <View style={styles.habitIconBubble}>
        <Ionicons name={checked ? 'checkmark-circle' : habit.icon} size={scale(20)} color={textColor} />
      </View>
      
      <View style={styles.habitMeta}>
        <Text style={[styles.habitLabel, { color: textColor }, checked && styles.habitLabelDone]}>
          {habit.label}
        </Text>
        <View style={styles.weekTrackerRow}>
          {DAYS_SHORT.map((d, di) => (
            <View key={di} style={[styles.dayDot, { backgroundColor: textColor, opacity: di === TODAY_IDX ? 1 : 0.2 }]} />
          ))}
          <Text style={[styles.streakMini, { color: textColor }]}>{streak} day streak</Text>
        </View>
      </View>

      <View style={[styles.checkOuter, { borderColor: textColor }]}>
        {checked && <View style={[styles.checkInner, { backgroundColor: textColor }]} />}
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ userData, onLogout, onAddPress }) {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState([]); 
  const [checked, setChecked] = useState(new Set());
  const [streaks, setStreaks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const progressW = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(0)).current;
  
  // Responsive Tab Calculation
  const NAV_MARGIN = 28;
  const TAB_BAR_WIDTH = SCREEN_W - (NAV_MARGIN * 2);
  const TAB_WIDTH = (TAB_BAR_WIDTH - 12) / 3;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue) {
        const saved = JSON.parse(jsonValue);
        setHabits(saved.habits || []);
        setStreaks(saved.streaks || {});
        setChecked(new Set(saved.checked || []));
      }
    } finally { setIsLoaded(true); }
  };

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        habits, streaks, checked: Array.from(checked) 
      }));
      const p = habits.length > 0 ? checked.size / habits.length : 0;
      Animated.spring(progressW, { toValue: p, useNativeDriver: false, bounciness: 4 }).start();
    }
  }, [habits, streaks, checked, isLoaded]);

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

  const changeTab = (id, idx) => {
    if(id === 'settings') return onLogout();
    setActiveTab(id);
    Animated.spring(tabTranslateX, { 
      toValue: idx * TAB_WIDTH, 
      useNativeDriver: true, 
      tension: 80, 
      friction: 10 
    }).start();
  };

  const goal = GOAL_META[userData?.goals?.[0] || 'productivity'];

  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color="#000" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
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

      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + vs(140), paddingBottom: 150 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          {/* DASHBOARD CARD */}
          <View style={styles.dashboardCard}>
            <View style={styles.dashTop}>
              <View>
                <Text style={styles.dashLabel}>DAILY MOMENTUM</Text>
                <Text style={styles.dashTitle}>
                  {checked.size === habits.length && habits.length > 0 ? "Perfect Day! 🏆" : "Keep pushing"}
                </Text>
              </View>
              <View style={styles.dashBadge}>
                <Text style={styles.dashBadgeTxt}>{checked.size}/{habits.length}</Text>
              </View>
            </View>
            
            <View style={styles.modernBarContainer}>
              <View style={styles.modernBarTrack}>
                <Animated.View style={[styles.modernBarFill, { 
                  width: progressW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
                }]}>
                  <View style={styles.barShimmer} />
                </Animated.View>
              </View>
              <Animated.Text style={styles.pctText}>
                {Math.round((checked.size/(habits.length||1))*100)}%
              </Animated.Text>
            </View>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyHero}>
              <View style={styles.emptyArt}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <Ionicons name="sparkles" size={40} color="#000" />
              </View>
              <Text style={styles.emptyTitle}>A fresh start awaits</Text>
              <Text style={styles.emptySub}>Your journey to discipline begins with a single habit. What's your focus today?</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={onAddPress}>
                <Text style={styles.emptyActionTxt}>Create Your First Habit</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Current Habits</Text>
                <TouchableOpacity onPress={onAddPress}>
                  <Ionicons name="add-circle-outline" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              {habits.map(h => (
                <HabitRow 
                  key={h.id} 
                  habit={h} 
                  checked={checked.has(h.id)} 
                  streak={streaks[h.id]||0} 
                  onToggle={toggleHabit} 
                  onDelete={(id) => {
                    Alert.alert("Delete", "Remove habit?", [
                      {text: 'Cancel', style: 'cancel'}, 
                      {text: 'Delete', style: 'destructive', onPress: () => setHabits(prev => prev.filter(x => x.id !== id))}
                    ]);
                  }} 
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* NAVIGATION BAR */}
      <View style={[styles.navContainer, { bottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.navInner}>
          <Animated.View style={[styles.navPill, { width: TAB_WIDTH, transform: [{ translateX: tabTranslateX }] }]} />
          {[{id:'home', icon:'grid'}, {id:'stats', icon:'analytics'}, {id:'settings', icon:'settings'}].map((t, i) => (
            <TouchableOpacity key={t.id} style={styles.navTab} onPress={() => changeTab(t.id, i)}>
              <Ionicons 
                name={activeTab === t.id ? t.icon : t.icon + '-outline'} 
                size={22} 
                color={activeTab === t.id ? '#FFF' : '#A0A0A0'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fixedHeader: { 
    position: 'absolute', top: 0, left: 0, right: 0, 
    backgroundColor: '#FFF', zIndex: 100, 
    paddingHorizontal: 22, paddingBottom: 15 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandImg: { width: 22, height: 22, resizeMode: 'contain' },
  brandTxt: { fontWeight: '900', fontSize: fs(14), letterSpacing: 2 },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  goalPillTxt: { fontWeight: '800', fontSize: 9 },
  headerUser: { fontWeight: '900', fontSize: fs(28), letterSpacing: -1 },
  headerDate: { color: '#AAA', fontWeight: '600', fontSize: fs(13), marginTop: 2 },

  content: { paddingHorizontal: 22 },

  // DASHBOARD PROGRESS
  dashboardCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: vs(20), 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    // Android Shadow
    elevation: 4,
    // iOS Shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  dashTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  dashLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 },
  dashTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginTop: 4 },
  dashBadge: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dashBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  modernBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modernBarTrack: { flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  modernBarFill: { height: '100%', backgroundColor: '#000', borderRadius: 10, position: 'relative' },
  barShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  pctText: { fontSize: 14, fontWeight: '900', color: '#000', width: 40, textAlign: 'right' },

  // EMPTY HERO
  emptyHero: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20, 
    backgroundColor: '#F8F8F8', 
    borderRadius: 32, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#CCC',
    marginTop: 20 
  },
  emptyArt: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  circle1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEE' },
  circle2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E0E0', opacity: 0.5 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  emptyAction: { 
    backgroundColor: '#000', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 100,
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
  },
  emptyActionTxt: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // HABITS
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  habitCard: { 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  habitIconBubble: { 
    width: 44, height: 44, borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  habitMeta: { flex: 1 },
  habitLabel: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  habitLabelDone: { textDecorationLine: 'line-through', opacity: 0.7 },
  weekTrackerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayDot: { width: 5, height: 5, borderRadius: 2.5 },
  streakMini: { fontSize: 10, fontWeight: '700', marginLeft: 4, opacity: 0.8 },
  checkOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkInner: { width: 12, height: 12, borderRadius: 6 },

  // NAV BAR
  navContainer: { 
    position: 'absolute', left: 28, right: 28, height: 70, 
    backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 35, 
    borderWidth: 1, borderColor: '#EEE',
    elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20,
  },
  navInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  navPill: { position: 'absolute', height: '80%', backgroundColor: '#000', borderRadius: 30, left: 6 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
});