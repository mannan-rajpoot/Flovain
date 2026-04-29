import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Image, Alert, StatusBar, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const scale = (size) => (SCREEN_W / 390) * size;
const vs = (size) => (SCREEN_H / 844) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.1);

const STORAGE_KEY = '@flovain_habits_data';

const GOAL_META = {
  fitness:      { label: 'Fitness',     icon: 'barbell',          color: '#F43F5E', bg: '#FFF1F2' },
  study:        { label: 'Knowledge',   icon: 'book',             color: '#F59E0B', bg: '#FFFBEB' },
  mental:       { label: 'Mindset',     icon: 'heart',            color: '#8B5CF6', bg: '#F5F3FF' },
  discipline:   { label: 'Discipline',  icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Focus',       icon: 'flash',            color: '#10B981', bg: '#ECFDF5' },
};

const MOTIVATION_LINES = [
  "Small steps every day build empires.",
  "Discipline is freedom in disguise.",
  "The best time to start was yesterday.",
  "Your habits define your future self.",
  "One more rep. One more page. One more day.",
  "Champions are built in the quiet moments.",
  "Progress, not perfection.",
  "Consistency is a superpower.",
  "Show up even when it's hard.",
  "Every master was once a beginner.",
  "The compound effect is working for you.",
  "Build the life you keep dreaming about.",
  "Momentum starts with a single action.",
  "You don't rise to goals, you fall to systems.",
  "Today's effort is tomorrow's result.",
  "Earn your rest. Own your morning.",
  "The habit you skip today costs tomorrow.",
  "Make it so automatic it feels like breathing.",
  "Be the person your habits say you are.",
  "Relentless beats talented every time.",
];

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

// ─── Habit Row ────────────────────────────────────────────────────────────────
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
        checked && { opacity: 0.6, transform: [{ scale: 0.98 }] },
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
            <View
              key={di}
              style={[styles.dayDot, { backgroundColor: textColor, opacity: di === TODAY_IDX ? 1 : 0.2 }]}
            />
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ userData, onLogout, onAddPress }) {
  const insets = useSafeAreaInsets();
  const [habits, setHabits]   = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [streaks, setStreaks]  = useState({});
  const [activeTab, setActiveTab] = useState('home');

  const [currentQuote, setCurrentQuote] = useState("");
  const [currentGoalKey, setCurrentGoalKey] = useState("productivity");

  const progressW = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current;
  const quoteAnim  = useRef(new Animated.Value(0)).current;

  const NAV_MARGIN   = 28;
  const TAB_BAR_W    = SCREEN_W - NAV_MARGIN * 2;
  const TAB_WIDTH    = (TAB_BAR_W - 12) / 3;

  useEffect(() => {
    const load = async () => {
      // Randomize content on every open
      const goalKeys = Object.keys(GOAL_META);
      setCurrentGoalKey(goalKeys[Math.floor(Math.random() * goalKeys.length)]);
      setCurrentQuote(MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)]);

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setHabits(saved.habits   || []);
          setStreaks(saved.streaks  || {});
          setChecked(new Set(saved.checked || []));
        }
      } catch (_) {}

      Animated.parallel([
        Animated.timing(screenFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(quoteAnim,  { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
      ]).start();
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      habits, streaks, checked: Array.from(checked),
    }));
    const p = habits.length > 0 ? checked.size / habits.length : 0;
    Animated.spring(progressW, { toValue: p, useNativeDriver: false, bounciness: 2 }).start();
  }, [habits, streaks, checked]);

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
    if (id === 'settings') return onLogout();
    setActiveTab(id);
    Animated.spring(tabTranslateX, {
      toValue: idx * TAB_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const activeGoal = GOAL_META[currentGoalKey];
  const NAV_TABS = [
    { id: 'home',     iconFill: 'grid',             iconOutline: 'grid-outline'             },
    { id: 'stats',    iconFill: 'bar-chart',         iconOutline: 'bar-chart-outline'        },
    { id: 'settings', iconFill: 'person-circle',     iconOutline: 'person-circle-outline'    },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── FIXED HEADER ──────────────────────────────────────── */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/flovain-intro.png')} style={styles.brandImg} />
            <Text style={styles.brandTxt}>FLOVAIN</Text>
          </View>
          <View style={[styles.goalPill, { backgroundColor: activeGoal.bg }]}>
            <Ionicons name={activeGoal.icon} size={11} color={activeGoal.color} />
            <Text style={[styles.goalPillTxt, { color: activeGoal.color }]}>{activeGoal.label.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.headerMidRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerUser}>{userData?.username || 'User'}</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.quoteRow, { opacity: quoteAnim, transform: [{ translateY: quoteAnim.interpolate({inputRange:[0,1], outputRange:[10,0]}) }] }]}>
          <View style={[styles.quoteDot, { backgroundColor: activeGoal.color }]} />
          <Text style={styles.quoteText} numberOfLines={1}>{currentQuote}</Text>
        </Animated.View>
      </View>

      {/* ── SCROLL CONTENT ────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + vs(158), paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* REFINED SMALL PROFESSIONAL DASHBOARD CARD */}
          <View style={styles.dashboardCard}>
            <View style={styles.dashHeader}>
              <View>
                <Text style={styles.dashLabel}>DAILY MOMENTUM</Text>
                <Text style={styles.dashTitle}>
                  {checked.size === habits.length && habits.length > 0 ? 'Perfect Day! 🏆' : 'Keep pushing'}
                </Text>
              </View>
              <View style={styles.dashBadge}>
                <Text style={styles.dashBadgeTxt}>{checked.size}/{habits.length}</Text>
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[styles.progressBarFill, {
                    width: progressW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]}
                />
              </View>
              <Text style={styles.progressPctText}>
                {Math.round((checked.size / (habits.length || 1)) * 100)}%
              </Text>
            </View>
          </View>

          {/* EMPTY STATE - KEPT EXACTLY SAME */}
          {habits.length === 0 ? (
            <View style={styles.emptyHero}>
              <View style={styles.emptyArt}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <Ionicons name="sparkles" size={40} color="#000" />
              </View>
              <Text style={styles.emptyTitle}>A fresh start awaits</Text>
              <Text style={styles.emptySub}>
                Your journey to discipline begins with a single habit. What's your focus today?
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={onAddPress}>
                <Text style={styles.emptyActionTxt}>Create Your First Habit</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Current Habits</Text>
                <TouchableOpacity onPress={onAddPress} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              {habits.map(h => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  checked={checked.has(h.id)}
                  streak={streaks[h.id] || 0}
                  onToggle={toggleHabit}
                  onDelete={(id) => {
                    Alert.alert('Delete', 'Remove habit?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => setHabits(prev => prev.filter(x => x.id !== id)) },
                    ]);
                  }}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── BOTTOM NAV ────────────────────────────────────────── */}
      <View style={[styles.navContainer, { bottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.navInner}>
          <Animated.View style={[styles.navPill, { width: TAB_WIDTH, transform: [{ translateX: tabTranslateX }] }]} />
          {NAV_TABS.map((t, i) => {
            const isActive = activeTab === t.id;
            return (
              <TouchableOpacity key={t.id} style={styles.navTab} onPress={() => changeTab(t.id, i)}>
                <Ionicons name={isActive ? t.iconFill : t.iconOutline} size={22} color={isActive ? '#FFF' : '#B0B0B0'} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFF', zIndex: 100,
    paddingHorizontal: 22, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  brandRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandImg:  { width: 22, height: 22, resizeMode: 'contain' },
  brandTxt:  { fontWeight: '900', fontSize: fs(13), letterSpacing: 2 },
  goalPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  goalPillTxt: { fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },
  headerMidRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  headerUser:   { fontWeight: '900', fontSize: fs(27), letterSpacing: -1, color: '#111' },
  headerDate:   { color: '#AAA', fontWeight: '600', fontSize: fs(13), marginTop: 2 },
  quoteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0',
  },
  quoteDot:  { width: 6, height: 6, borderRadius: 3 },
  quoteText: { flex: 1, fontSize: fs(12), fontWeight: '600', color: '#555' },
  content: { paddingHorizontal: 22 },

  // PROFESSIONAL SMALL DASHBOARD CARD
  dashboardCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 18,
    marginBottom: vs(22), borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dashLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 2 },
  dashTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  dashBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dashBadgeTxt: { color: '#000', fontSize: 11, fontWeight: '800' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarTrack: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#000', borderRadius: 10 },
  progressPctText: { fontSize: 12, fontWeight: '800', color: '#000', width: 35, textAlign: 'right' },

  // EMPTY STATE - KEPT EXACTLY SAME
  emptyHero: {
    alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, bottom: '12',
    backgroundColor: '#F8F8F8', borderRadius: 32, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CCC', marginTop: 20,
  },
  emptyArt:   { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  circle1:    { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEE' },
  circle2:    { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E0E0', opacity: 0.5 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 10 },
  emptySub:   { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  emptyAction: {
    backgroundColor: '#000', flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100,
  },
  emptyActionTxt: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle:{ fontSize: 18, fontWeight: '900', color: '#000' },
  addBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  habitCard: { borderRadius: 22, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  habitIconBubble: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  habitMeta:       { flex: 1 },
  habitLabel:      { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  habitLabelDone:  { textDecorationLine: 'line-through', opacity: 0.7 },
  weekTrackerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayDot:          { width: 5, height: 5, borderRadius: 2.5 },
  streakMini:      { fontSize: 10, fontWeight: '700', marginLeft: 4, opacity: 0.8 },
  checkOuter:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkInner:      { width: 12, height: 12, borderRadius: 6 },
  navContainer: {
    position: 'absolute', left: 28, right: 28, height: 68,
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 34,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  navInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  navPill:  { position: 'absolute', height: '78%', backgroundColor: '#111', borderRadius: 28, left: 6 },
  navTab:   { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
});