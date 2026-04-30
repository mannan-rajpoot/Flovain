import React, { 
  useEffect, useRef, useState, useMemo, useCallback, memo 
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Image, Alert, StatusBar, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (s) => (SCREEN_W / 390) * s;
const vs    = (s) => (SCREEN_H / 844) * s;
const fs    = (s) => Math.min((SCREEN_W / 390) * s, s * 1.1);

const STORAGE_KEY = '@flovain_habits_data';

const GOAL_META = {
  fitness:      { label: 'Fitness',    icon: 'barbell',          color: '#F43F5E', bg: '#FFF1F2' },
  study:        { label: 'Knowledge',  icon: 'book',             color: '#F59E0B', bg: '#FFFBEB' },
  mental:       { label: 'Mindset',    icon: 'heart',            color: '#8B5CF6', bg: '#F5F3FF' },
  discipline:   { label: 'Discipline', icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Focus',      icon: 'flash',            color: '#10B981', bg: '#ECFDF5' },
};

const MOTIVATION_LINES = [
  "Small steps every day build empires.", "Discipline is freedom in disguise.",
  "The best time to start was yesterday.", "Your habits define your future self.",
  "One more rep. One more page. One more day.", "Champions are built in the quiet moments.",
  "Progress, not perfection.", "Consistency is a superpower.", "Show up even when it's hard.",
  "Every master was once a beginner.", "The compound effect is working for you.",
  "Build the life you keep dreaming about.", "Momentum starts with a single action.",
  "You don't rise to goals, you fall to systems.", "Today's effort is tomorrow's result.",
];

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DUMMY_HABITS = [
  { id: 'dummy_1', label: 'Training', description: 'Be healthy and strong', icon: 'barbell', color: '#6366F1', category: 'Personal' },
  { id: 'dummy_2', label: 'Reading', description: 'Read before sleep to relax', icon: 'book', color: '#F59E0B', category: 'Personal' },
  { id: 'dummy_3', label: 'Water Flowers', description: 'So they keep being beautiful!', icon: 'leaf', color: '#10B981', category: 'Team Denda' },
  { id: 'dummy_4', label: 'Meditation', description: '10 minutes mindful breathing', icon: 'heart', color: '#8B5CF6', category: 'Personal' },
  { id: 'dummy_5', label: 'Cold Shower', description: 'Build mental resilience daily', icon: 'water', color: '#0EA5E9', category: 'Personal' },
];

// Color Helper
const getContribColor = (habitColor, level) => {
  if (level === 0) return '#181826';
  const h = habitColor.replace('#', '');
  const r = parseInt(h.substr(0,2), 16);
  const g = parseInt(h.substr(2,2), 16);
  const b = parseInt(h.substr(4,2), 16);
  const alphas = [0, 0.25, 0.50, 0.75, 1.0];
  return `rgba(${r},${g},${b},${alphas[level]})`;
};

// Current Month Grid
const CurrentMonthGrid = memo(({ habitColor, habitId }) => {
  const daysInMonth = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      let level = 0;

      if (date < today) {
        const seed = habitId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const r = Math.abs(Math.sin(seed + Math.floor(date.getTime() / 86400000)));
        level = r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.65 ? 2 : r < 0.85 ? 3 : 4;
      } else if (isToday) level = 3;

      days.push({ level, isToday, date: d });
    }
    return days;
  }, [habitId]);

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < daysInMonth.length; i += 10) {
      r.push(daysInMonth.slice(i, i + 10));
    }
    return r;
  }, [daysInMonth]);

  return (
    <View style={{ marginVertical: vs(8) }}>
      <Text style={{
        fontSize: fs(10.2),
        fontWeight: '700',
        color: '#505068',
        marginBottom: 8,
      }}>
        {MONTHS_SHORT[new Date().getMonth()]} {new Date().getFullYear()}
      </Text>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(5) }}>
          {row.map((day, index) => (
            <View key={index} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: fs(7.2),
                color: day.isToday ? '#FFFFFF' : '#707080',
                fontWeight: day.isToday ? '700' : '500',
                marginBottom: 3,
              }}>
                {day.date}
              </Text>
              <View style={{
                width: scale(13.8),
                height: scale(13.8),
                borderRadius: scale(3.5),
                backgroundColor: getContribColor(habitColor, day.level),
                borderWidth: day.isToday ? 2 : 0,
                borderColor: '#FFFFFF',
              }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

// Habit Contrib Card - Removed Cross Button
const HabitContribCard = memo(({ habit, checked, streak, onToggle, onDelete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[cStyles.card, { opacity: fadeAnim }]}>
      <View style={cStyles.header}>
        <View style={[cStyles.iconWrap, { backgroundColor: habit.color + '22' }]}>
          <Ionicons name={habit.icon} size={scale(15)} color={habit.color} />
        </View>
        <View style={cStyles.meta}>
          <Text style={cStyles.catLabel}>{habit.category}</Text>
          <Text style={cStyles.habitName} numberOfLines={1}>{habit.label}</Text>
          <Text style={cStyles.habitDesc} numberOfLines={1}>{habit.description}</Text>
        </View>
        <View style={cStyles.controls}>
          <View style={cStyles.streakPill}>
            <Ionicons name="flame" size={scale(9)} color="#FF6B35" />
            <Text style={cStyles.streakTxt}>{streak}d</Text>
          </View>
          <TouchableOpacity 
            style={[cStyles.checkBtn, checked && { backgroundColor: habit.color, borderColor: habit.color }]} 
            onPress={() => onToggle(habit.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={scale(12)} color={checked ? '#FFF' : habit.color} />
          </TouchableOpacity>
        </View>
      </View>

      <CurrentMonthGrid habitColor={habit.color} habitId={habit.id} />

      <View style={cStyles.legend}>
        <Text style={cStyles.legendLabel}>Less</Text>
        {[0,1,2,3,4].map(lv => (
          <View key={lv} style={[cStyles.legendCell, { backgroundColor: getContribColor(habit.color, lv) }]} />
        ))}
        <Text style={cStyles.legendLabel}>More</Text>
      </View>
    </Animated.View>
  );
});

// HabitRow - Long Press to Delete
const HabitRow = memo(({ habit, checked, streak, onToggle, onDelete }) => {
  const isDark = ['#000000', '#6366F1', '#F43F5E', '#8B5CF6'].includes(habit.color);
  const textColor = isDark ? '#FFF' : '#1A1A1A';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onToggle(habit.id)}
      onLongPress={() => onDelete(habit.id)}   // Long press to delete
      style={[styles.habitCard, { backgroundColor: habit.color }, checked && { opacity: 0.68, transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.habitIconBubble}>
        <Ionicons name={checked ? 'checkmark-circle' : habit.icon} size={scale(21)} color={textColor} />
      </View>
      <View style={styles.habitMeta}>
        <Text style={[styles.habitLabel, { color: textColor }, checked && styles.habitLabelDone]}>
          {habit.label}
        </Text>
        <View style={styles.weekTrackerRow}>
          {DAYS_SHORT.map((_, di) => (
            <View key={di} style={[styles.dayDot, { backgroundColor: textColor, opacity: di === TODAY_IDX ? 1 : 0.28 }]} />
          ))}
          <Text style={[styles.streakMini, { color: textColor }]}>{streak} day streak</Text>
        </View>
      </View>
      <View style={[styles.checkOuter, { borderColor: textColor }]}>
        {checked && <View style={[styles.checkInner, { backgroundColor: textColor }]} />}
      </View>
    </TouchableOpacity>
  );
});

// ==================== MAIN SCREEN ====================
export default function HomeScreen({ userData, onLogout, onAddPress }) {
  const insets = useSafeAreaInsets();

  const [habits, setHabits] = useState([]);
  const [dummyHabits, setDummyHabits] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [streaks, setStreaks] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [showDummy, setShowDummy] = useState(false);

  const [currentQuote, setCurrentQuote] = useState('');
  const [currentGoalKey, setCurrentGoalKey] = useState('productivity');

  const progressW = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;

  const NAV_MARGIN = 28;
  const TAB_BAR_W = SCREEN_W - NAV_MARGIN * 2;
  const TAB_WIDTH = (TAB_BAR_W - 12) / 3;

  const activeGoal = GOAL_META[currentGoalKey] || GOAL_META.productivity;

  // Load Data
  useEffect(() => {
    const load = async () => {
      const goalKeys = Object.keys(GOAL_META);
      setCurrentGoalKey(goalKeys[Math.floor(Math.random() * goalKeys.length)]);
      setCurrentQuote(MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)]);

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setHabits(saved.habits || []);
          setStreaks(saved.streaks || {});
          setChecked(new Set(saved.checked || []));
          if (saved.dummyHabits?.length) {
            setDummyHabits(saved.dummyHabits);
            setShowDummy(true);
          }
        }
      } catch (_) {}

      Animated.parallel([
        Animated.timing(screenFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(quoteAnim, { toValue: 1, duration: 600, delay: 250, useNativeDriver: true }),
      ]).start();
    };
    load();
  }, []);

  // Persist
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, streaks, checked: Array.from(checked), dummyHabits }));

    const total = habits.length + dummyHabits.length;
    const p = total > 0 ? checked.size / total : 0;
    Animated.spring(progressW, { toValue: p, useNativeDriver: false, bounciness: 3 }).start();
  }, [habits, streaks, checked, dummyHabits]);

  const toggleHabit = useCallback((id) => {
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
  }, []);

  const handleAddPress = useCallback(() => {
    if (!showDummy) {
      setDummyHabits(DUMMY_HABITS);
      setShowDummy(true);
    }
    onAddPress?.();
  }, [showDummy, onAddPress]);

  const deleteHabit = useCallback((id) => {
    Alert.alert('Delete Habit', 'Remove this habit?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setHabits(p => p.filter(x => x.id !== id)) }
    ]);
  }, []);

  const deleteDummy = useCallback((id) => {
    Alert.alert('Remove Habit', 'Delete this habit?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setDummyHabits(p => p.filter(x => x.id !== id)) }
    ]);
  }, []);

  const changeTab = useCallback((id, idx) => {
    if (id === 'settings') return onLogout?.();
    setActiveTab(id);
    Animated.spring(tabTranslateX, { 
      toValue: idx * TAB_WIDTH, 
      tension: 85, 
      friction: 12, 
      useNativeDriver: true 
    }).start();
  }, [TAB_WIDTH, onLogout]);

  const allCount = habits.length + dummyHabits.length;

  const allHabitsList = useMemo(() => {
    const list = habits.map(h => ({ ...h, isDummy: false }));
    if (showDummy) dummyHabits.forEach(h => list.push({ ...h, isDummy: true }));
    return list;
  }, [habits, dummyHabits, showDummy]);

  const renderHabitItem = useCallback(({ item }) => {
    return item.isDummy ? (
      <HabitContribCard habit={item} checked={checked.has(item.id)} streak={streaks[item.id] || 0} onToggle={toggleHabit} onDelete={deleteDummy} />
    ) : (
      <HabitRow habit={item} checked={checked.has(item.id)} streak={streaks[item.id] || 0} onToggle={toggleHabit} onDelete={deleteHabit} />
    );
  }, [checked, streaks, toggleHabit, deleteDummy, deleteHabit]);

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <StatusBar barStyle="dark-content" />

      {/* Fixed Header */}
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

        <Animated.View style={[styles.quoteRow, {
          opacity: quoteAnim,
          transform: [{ translateY: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}>
          <View style={[styles.quoteDot, { backgroundColor: activeGoal.color }]} />
          <Text style={styles.quoteText} numberOfLines={1}>{currentQuote}</Text>
        </Animated.View>
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingTop: insets.top + vs(155), 
          paddingHorizontal: 22,
          paddingBottom: 160 
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
      >
        <View style={{ marginTop: vs(12) }}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Current Habits</Text>
            <TouchableOpacity onPress={handleAddPress} style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={allHabitsList}
            renderItem={renderHabitItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            removeClippedSubviews={true}
            windowSize={8}
            maxToRenderPerBatch={5}
            initialNumToRender={4}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.navContainer, { bottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navInner}>
          <Animated.View style={[styles.navPill, { width: TAB_WIDTH, transform: [{ translateX: tabTranslateX }] }]} />

          {[
            { id: 'home',     label: 'Home',     iconFill: 'grid',          iconOutline: 'grid-outline' },
            { id: 'stats',    label: 'Stats',    iconFill: 'bar-chart',     iconOutline: 'bar-chart-outline' },
            { id: 'settings', label: 'Settings', iconFill: 'person-circle', iconOutline: 'person-circle-outline' },
          ].map((t, i) => (
            <TouchableOpacity 
              key={t.id} 
              style={styles.navTab} 
              onPress={() => changeTab(t.id, i)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={activeTab === t.id ? t.iconFill : t.iconOutline} 
                size={20} 
                color={activeTab === t.id ? '#FFF' : '#888'} 
              />
              <Text style={[styles.navLabel, { color: activeTab === t.id ? '#FFF' : '#888' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

/* ====================== STYLES ====================== */
const cStyles = StyleSheet.create({
  card: { 
    backgroundColor: '#0D0D1C', 
    borderRadius: scale(16), 
    paddingHorizontal: scale(15), 
    paddingVertical: scale(13), 
    marginBottom: vs(12), 
    borderWidth: 1, 
    borderColor: '#1F1F2E' 
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(10) },
  iconWrap: { width: scale(33), height: scale(33), borderRadius: scale(10), justifyContent: 'center', alignItems: 'center', marginRight: scale(10) },
  meta: { flex: 1 },
  catLabel: { fontSize: fs(7.4), color: '#4A4A66', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  habitName: { fontSize: fs(13.8), fontWeight: '800', color: '#E8E8F0' },
  habitDesc: { fontSize: fs(9.6), color: '#5A5A78' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#16162A', paddingHorizontal: scale(7), paddingVertical: scale(3.5), borderRadius: 20 },
  streakTxt: { fontSize: fs(8.8), color: '#7070A8', fontWeight: '700' },
  checkBtn: { 
    width: scale(27), height: scale(27), borderRadius: scale(8), 
    backgroundColor: '#16162A', borderWidth: 1.8, borderColor: '#2A2A4A', 
    justifyContent: 'center', alignItems: 'center' 
  },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: scale(4), marginTop: vs(8) },
  legendLabel: { fontSize: scale(7), color: '#484866', fontWeight: '700' },
  legendCell: { width: scale(8), height: scale(8), borderRadius: scale(2) },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#FFF', zIndex: 100, paddingHorizontal: 22, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandImg: { width: 24, height: 24, resizeMode: 'contain' },
  brandTxt: { fontWeight: '900', fontSize: fs(13.5), letterSpacing: 2.2 },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5.5, borderRadius: 12 },
  goalPillTxt: { fontWeight: '800', fontSize: 9.2, letterSpacing: 0.6 },
  headerMidRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  headerUser: { fontWeight: '900', fontSize: fs(27.5), letterSpacing: -1.1, color: '#111' },
  headerDate: { color: '#A0A0A0', fontWeight: '600', fontSize: fs(13.2), marginTop: 1 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  quoteDot: { width: 7, height: 7, borderRadius: 3.5 },
  quoteText: { flex: 1, fontSize: fs(12.2), fontWeight: '600', color: '#555' },

  content: { paddingHorizontal: 22 },

  emptyHero: { 
    alignItems: 'center', 
    paddingVertical: 60, 
    backgroundColor: '#F8F8F8', 
    borderRadius: 32, 
    borderWidth: 1.5, 
    borderStyle: 'dashed', 
    borderColor: '#D1D1D1', 
    marginTop: 20 
  },
  emptyTitle: { fontSize: 21, fontWeight: '900', color: '#000', marginBottom: 22 },
  emptyAction: { 
    backgroundColor: '#000', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingHorizontal: 26, 
    paddingVertical: 17, 
    borderRadius: 100 
  },
  emptyActionTxt: { color: '#FFF', fontWeight: '800', fontSize: 15.5 },

  sectionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18, 
    marginTop: 8 
  },
  sectionTitle: { fontSize: 18.5, fontWeight: '900' },
  addBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  habitCard: { 
    borderRadius: 22, 
    padding: 17, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  habitIconBubble: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.28)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  habitMeta: { flex: 1 },
  habitLabel: { fontWeight: '800', fontSize: 16.2 },
  habitLabelDone: { textDecorationLine: 'line-through', opacity: 0.75 },
  weekTrackerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  dayDot: { width: 5.5, height: 5.5, borderRadius: 3 },
  streakMini: { fontSize: 10.5, fontWeight: '700', marginLeft: 6, opacity: 0.85 },
  checkOuter: { width: 26, height: 26, borderRadius: 13, borderWidth: 2.2, justifyContent: 'center', alignItems: 'center' },
  checkInner: { width: 13, height: 13, borderRadius: 6.5 },

  navContainer: { 
    position: 'absolute', 
    left: 24, 
    right: 24, 
    height: 74, 
    backgroundColor: 'rgba(255,255,255,0.98)', 
    borderRadius: 34, 
    borderWidth: 1, 
    borderColor: '#EBEBEB', 
    elevation: 10 
  },
  navInner: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 6 
  },
  navPill: { 
    position: 'absolute', 
    height: '78%', 
    backgroundColor: '#111', 
    borderRadius: 28, 
    left: 6 
  },
  navTab: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1,
    paddingVertical: 6 
  },
  navLabel: {
    fontSize: fs(9.5),
    fontWeight: '600',
    marginTop: 2,
  },
});