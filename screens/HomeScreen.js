import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs    = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);
const vs    = (size) => (SCREEN_H / 844) * size;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ── Goal metadata ─────────────────────────────────────────────────────────
const GOAL_META = {
  fitness:      { label: 'Get Fit',             icon: 'barbell',          color: '#F43F5E', bg: '#FFF1F2' },
  study:        { label: 'Study Better',         icon: 'book',             color: '#F59E0B', bg: '#FFFBEB' },
  mental:       { label: 'Mental Health',        icon: 'heart',            color: '#8B5CF6', bg: '#F5F3FF' },
  discipline:   { label: 'Build Discipline',     icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Be More Productive',   icon: 'flash',            color: '#10B981', bg: '#ECFDF5' },
};

// ── Habit suggestions per goal ────────────────────────────────────────────
const GOAL_HABITS = {
  fitness:      [
    { id: 'h1', label: 'Morning workout',       icon: 'barbell-outline',          color: '#F43F5E' },
    { id: 'h2', label: 'Drink 8 glasses water', icon: 'water-outline',            color: '#3B82F6' },
    { id: 'h3', label: '10k steps today',       icon: 'footsteps-outline',        color: '#F97316' },
  ],
  study:        [
    { id: 'h1', label: 'Study session 1hr',     icon: 'book-outline',             color: '#F59E0B' },
    { id: 'h2', label: 'Review notes',          icon: 'document-text-outline',    color: '#6366F1' },
    { id: 'h3', label: 'No distractions block', icon: 'phone-portrait-outline',   color: '#EC4899' },
  ],
  mental:       [
    { id: 'h1', label: '10-min meditation',     icon: 'heart-outline',            color: '#8B5CF6' },
    { id: 'h2', label: 'Gratitude journal',     icon: 'pencil-outline',           color: '#F59E0B' },
    { id: 'h3', label: 'No screens before bed', icon: 'moon-outline',             color: '#6366F1' },
  ],
  discipline:   [
    { id: 'h1', label: 'Wake up at 6 AM',       icon: 'sunny-outline',            color: '#F97316' },
    { id: 'h2', label: 'Cold shower',           icon: 'snow-outline',             color: '#3B82F6' },
    { id: 'h3', label: 'Evening review',        icon: 'checkmark-circle-outline', color: '#6366F1' },
  ],
  productivity: [
    { id: 'h1', label: 'Deep work 2 hrs',       icon: 'flash-outline',            color: '#10B981' },
    { id: 'h2', label: 'Plan tomorrow',         icon: 'list-outline',             color: '#8B5CF6' },
    { id: 'h3', label: 'Inbox zero',            icon: 'mail-outline',             color: '#F43F5E' },
  ],
};

const QUOTES = [
  { text: 'We are what we repeatedly do. Excellence is not an act, but a habit.', author: 'Aristotle' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
];

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const quote = QUOTES[new Date().getDay() % QUOTES.length];

// ── Bottom nav tabs ───────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'home',     label: 'Home',     icon: 'home',              iconOutline: 'home-outline'              },
  { id: 'stats',    label: 'Stats',    icon: 'bar-chart',         iconOutline: 'bar-chart-outline'         },
  { id: 'settings', label: 'Settings', icon: 'settings',          iconOutline: 'settings-outline'          },
];

// ── Habit row component ───────────────────────────────────────────────────
const HabitRow = ({ habit, checked, onToggle, animOpacity, animSlide, goalColor }) => {
  const checkScale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 260, friction: 8, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animSlide }] }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleToggle}
        style={[styles.habitCard, checked && styles.habitCardDone]}
      >
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: checked ? '#16A34A' : habit.color }]} />

        {/* Icon bubble */}
        <View style={[styles.habitIconBubble, {
          backgroundColor: checked ? '#DCFCE7' : habit.color + '18',
        }]}>
          <Ionicons
            name={checked ? 'checkmark-circle' : habit.icon}
            size={scale(20)}
            color={checked ? '#16A34A' : habit.color}
          />
        </View>

        {/* Label + week dots */}
        <View style={styles.habitMeta}>
          <Text style={[
            styles.habitLabel, { fontSize: fs(14) },
            checked && styles.habitLabelDone,
          ]}>
            {habit.label}
          </Text>
          <View style={styles.weekRow}>
            {DAYS.map((d, di) => (
              <View key={di} style={[
                styles.weekDot,
                di === TODAY_IDX
                  ? { backgroundColor: checked ? '#16A34A' : habit.color }
                  : di < TODAY_IDX
                  ? { backgroundColor: habit.color, opacity: 0.3 }
                  : { backgroundColor: '#E5E7EB' },
              ]} />
            ))}
          </View>
        </View>

        {/* Check circle right */}
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <View style={[
            styles.checkCircle,
            checked && { backgroundColor: '#16A34A', borderColor: '#16A34A' },
          ]}>
            {checked && <Ionicons name="checkmark" size={scale(12)} color="#FFF" />}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────
export default function HomeScreen({ userData }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');

  const username  = userData?.username || 'Friend';
  const goalId    = userData?.goals?.[0] || 'productivity';
  const goalMeta  = GOAL_META[goalId] || GOAL_META.productivity;
  const habits    = GOAL_HABITS[goalId] || GOAL_HABITS.productivity;

  const [checked, setChecked] = useState(new Set());

  const toggleHabit = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      Animated.timing(progressW, {
        toValue: next.size / habits.length,
        duration: 450,
        useNativeDriver: false,
      }).start();
      return next;
    });

  // ── Animations — same DNA as WelcomeScreen ────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(vs(30))).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const navAnim   = useRef(new Animated.Value(0)).current;
  const progressW = useRef(new Animated.Value(0)).current;

  const cardAnims = useRef(habits.map(() => ({
    opacity:    new Animated.Value(0),
    translateY: new Animated.Value(vs(24)),
  }))).current;

  useEffect(() => {
    // Header — exact same as WelcomeScreen
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideUp,   { toValue: 0, tension: 22, friction: 9, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(navAnim,   { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }),
    ]).start();

    // Habit cards stagger
    Animated.parallel(
      cardAnims.map((a, i) =>
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1, duration: 420, delay: 300 + i * 80, useNativeDriver: true,
          }),
          Animated.spring(a.translateY, {
            toValue: 0, tension: 22, friction: 9, delay: 300 + i * 80, useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const completedCount = checked.size;
  const totalCount     = habits.length;
  const allDone        = completedCount === totalCount;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const navH           = clamp(vs(70), 60, 80) + (insets.bottom > 0 ? insets.bottom : vs(12));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* Background blobs — same as WelcomeScreen */}
      <View pointerEvents="none" style={[styles.bgBlob, {
        width: scale(280), height: scale(280), borderRadius: scale(140),
        top: -scale(140), right: -scale(80),
      }]} />
      <View pointerEvents="none" style={[styles.bgBlobGreen, {
        width: scale(180), height: scale(180), borderRadius: scale(90),
        bottom: vs(140), left: -scale(60),
      }]} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: navH + vs(16) }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>

          {/* Left: app name + greeting */}
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Image
                source={require('../assets/flovain-intro.png')}
                style={{ width: scale(18), height: scale(18) }}
                resizeMode="contain"
              />
              <Text style={[styles.brandName, { fontSize: fs(15) }]}>Flovain</Text>
            </View>
            <Text style={[styles.greeting, { fontSize: fs(13) }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.username, { fontSize: fs(24) }]}>
              {username} 👋
            </Text>
          </View>

          {/* Right: goal badge + avatar */}
          <View style={styles.headerRight}>
            {/* Goal badge */}
            <View style={[styles.goalBadge, { backgroundColor: goalMeta.bg, borderColor: goalMeta.color + '40' }]}>
              <Ionicons name={goalMeta.icon} size={scale(12)} color={goalMeta.color} />
              <Text style={[styles.goalBadgeText, { fontSize: fs(11), color: goalMeta.color }]}>
                {goalMeta.label}
              </Text>
            </View>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={[styles.avatarLetter, { fontSize: fs(18) }]}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

        </Animated.View>

        {/* ── PROGRESS CARD ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.progressCard, {
          opacity: statsAnim,
          transform: [{ translateY: slideUp }],
          marginTop: vs(18),
          borderColor: goalMeta.color + '22',
        }]}>
          <View style={styles.progressTop}>
            <View>
              <Text style={[styles.progressLabel, { fontSize: fs(11), color: goalMeta.color }]}>
                TODAY'S PROGRESS
              </Text>
              <Text style={[styles.progressCount, { fontSize: fs(36) }]}>
                {completedCount}
                <Text style={[styles.progressOf, { fontSize: fs(20) }]}>/{totalCount}</Text>
              </Text>
              <Text style={[styles.progressSub, { fontSize: fs(13) }]}>
                {allDone
                  ? '🎉 All done — you crushed it!'
                  : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? 's' : ''} remaining`}
              </Text>
            </View>

            {/* Ring */}
            <View style={[styles.ringOuter, { borderColor: goalMeta.color + '30' }]}>
              <View style={styles.ringInner}>
                <Text style={[styles.ringPct, { fontSize: fs(16), color: goalMeta.color }]}>
                  {pct}%
                </Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <Animated.View style={[
              styles.barFill,
              {
                width: progressW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: allDone ? '#16A34A' : goalMeta.color,
              },
            ]} />
          </View>
        </Animated.View>

        {/* ── STATS ROW ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.statsRow, { opacity: statsAnim, marginTop: vs(14) }]}>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="flame" size={scale(20)} color="#8B5CF6" />
            <Text style={[styles.statValue, { fontSize: fs(20) }]}>7</Text>
            <Text style={[styles.statLabel, { fontSize: fs(10) }]}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="checkmark-circle" size={scale(20)} color="#F97316" />
            <Text style={[styles.statValue, { fontSize: fs(20) }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(10) }]}>Done today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="trophy" size={scale(20)} color="#16A34A" />
            <Text style={[styles.statValue, { fontSize: fs(20) }]}>12</Text>
            <Text style={[styles.statLabel, { fontSize: fs(10) }]}>Best streak</Text>
          </View>
        </Animated.View>

        {/* ── TODAY'S HABITS ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.sectionRow, {
          opacity: fadeAnim,
          transform: [{ translateY: slideUp }],
          marginTop: vs(26),
        }]}>
          <Text style={[styles.sectionTitle, { fontSize: fs(18) }]}>Today's Habits</Text>
          <Text style={[styles.sectionDate, { fontSize: fs(12) }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Animated.View>

        {habits.map((habit, i) => (
          <View key={habit.id} style={{ marginTop: vs(10) }}>
            <HabitRow
              habit={habit}
              checked={checked.has(habit.id)}
              onToggle={() => toggleHabit(habit.id)}
              animOpacity={cardAnims[i]?.opacity ?? new Animated.Value(1)}
              animSlide={cardAnims[i]?.translateY ?? new Animated.Value(0)}
              goalColor={goalMeta.color}
            />
          </View>
        ))}

        {/* ── WEEK OVERVIEW CARD ─────────────────────────────────────────── */}
        <Animated.View style={[styles.weekCard, {
          opacity: statsAnim,
          marginTop: vs(24),
        }]}>
          <Text style={[styles.weekCardTitle, { fontSize: fs(13) }]}>This Week</Text>
          <View style={styles.weekBarRow}>
            {DAYS.map((d, i) => {
              const isToday = i === TODAY_IDX;
              const filled  = i < TODAY_IDX;
              const barH    = filled ? clamp(Math.random() * 40 + 40, 40, 80) : isToday ? 56 : 20;
              return (
                <View key={i} style={styles.weekBarCol}>
                  <View style={[
                    styles.weekBar,
                    {
                      height: scale(barH * 0.55),
                      backgroundColor: isToday
                        ? goalMeta.color
                        : filled
                        ? goalMeta.color + '40'
                        : '#F0F0F0',
                      borderRadius: scale(6),
                    },
                  ]} />
                  <Text style={[
                    styles.weekBarLabel,
                    { fontSize: fs(10) },
                    isToday && { color: goalMeta.color, fontWeight: '800' },
                  ]}>
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── MOTIVATIONAL QUOTE ─────────────────────────────────────────── */}
        <Animated.View style={[styles.quoteCard, { opacity: statsAnim, marginTop: vs(16) }]}>
          <Ionicons name="chatbubble-ellipses" size={scale(18)} color="#8B5CF6" style={{ marginBottom: vs(8) }} />
          <Text style={[styles.quoteText, { fontSize: fs(14) }]}>"{quote.text}"</Text>
          <Text style={[styles.quoteAuthor, { fontSize: fs(12) }]}>— {quote.author}</Text>
        </Animated.View>

      </ScrollView>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottomNav, {
        opacity: navAnim,
        paddingBottom: insets.bottom > 0 ? insets.bottom : vs(14),
      }]}>
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.75}
              style={styles.navTab}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={[styles.navIconWrap, active && { backgroundColor: '#111' }]}>
                <Ionicons
                  name={active ? tab.icon : tab.iconOutline}
                  size={scale(20)}
                  color={active ? '#FFF' : '#AAA'}
                />
              </View>
              <Text style={[
                styles.navLabel,
                { fontSize: fs(10) },
                active && styles.navLabelActive,
              ]}>
                {tab.label}
              </Text>
              {active && <View style={[styles.navDot, { backgroundColor: goalMeta.color }]} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FB' },

  bgBlob: { position: 'absolute', backgroundColor: '#F5F3FF', zIndex: -1 },
  bgBlobGreen: { position: 'absolute', backgroundColor: '#F0FDF4', zIndex: -1 },

  scroll: { paddingHorizontal: scale(22), paddingTop: vs(12) },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(4),
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: vs(8) },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: vs(6),
  },
  brandName: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.5,
  },

  greeting: { color: '#999', fontWeight: '500', letterSpacing: 0.1 },
  username: { fontWeight: '900', color: '#111', letterSpacing: -0.8, marginTop: vs(2) },

  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: vs(5),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  goalBadgeText: { fontWeight: '700', letterSpacing: 0.1 },

  avatar: {
    width: scale(42), height: scale(42),
    borderRadius: scale(21),
    backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 5 },
    }),
  },
  avatarLetter: { color: '#FFF', fontWeight: '900' },

  // ── Progress card ────────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(22),
    padding: scale(20),
    borderWidth: 1.5,
    ...Platform.select({
      ios: { shadowColor: '#8B5CF6', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: vs(4) },
  progressCount: { fontWeight: '900', color: '#111', letterSpacing: -1.2 },
  progressOf:    { fontWeight: '400', color: '#CCC' },
  progressSub:   { color: '#999', fontWeight: '500', marginTop: vs(4) },

  ringOuter: {
    width: scale(68), height: scale(68),
    borderRadius: scale(34),
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  ringInner: {
    width: scale(52), height: scale(52),
    borderRadius: scale(26),
    backgroundColor: '#F8F8FB',
    justifyContent: 'center', alignItems: 'center',
  },
  ringPct: { fontWeight: '900', letterSpacing: -0.5 },

  barTrack: { height: 7, backgroundColor: '#F0F0F0', borderRadius: scale(6), marginTop: vs(16), overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: scale(6) },

  // ── Stats row ────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: scale(10) },
  statCard: {
    flex: 1, borderRadius: scale(16), padding: scale(13),
    alignItems: 'center', gap: vs(3),
  },
  statValue: { fontWeight: '900', color: '#111', letterSpacing: -0.8 },
  statLabel: { color: '#888', fontWeight: '600', textAlign: 'center' },

  // ── Section header ───────────────────────────────────────────────────────
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontWeight: '900', color: '#111', letterSpacing: -0.6 },
  sectionDate: { color: '#AAA', fontWeight: '500' },

  // ── Habit card ───────────────────────────────────────────────────────────
  habitCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(18),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingRight: scale(14),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  habitCardDone: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  accentBar: { width: scale(4), alignSelf: 'stretch', marginRight: scale(14), borderTopLeftRadius: scale(18), borderBottomLeftRadius: scale(18) },
  habitIconBubble: {
    width: scale(40), height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center', alignItems: 'center',
    marginRight: scale(12), flexShrink: 0,
  },
  habitMeta: { flex: 1, paddingVertical: vs(13) },
  habitLabel: { fontWeight: '700', color: '#111', letterSpacing: -0.3, marginBottom: vs(5) },
  habitLabelDone: { color: '#16A34A', textDecorationLine: 'line-through', textDecorationColor: '#16A34A' },
  weekRow: { flexDirection: 'row', gap: scale(4) },
  weekDot: { width: scale(7), height: scale(7), borderRadius: scale(4) },

  checkCircle: {
    width: scale(26), height: scale(26),
    borderRadius: scale(13),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  // ── Week overview card ───────────────────────────────────────────────────
  weekCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(20),
    padding: scale(18),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  weekCardTitle: {
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: vs(14),
  },
  weekBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  weekBarCol: { alignItems: 'center', gap: vs(5), flex: 1 },
  weekBar: { width: scale(22) },
  weekBarLabel: { color: '#BBB', fontWeight: '600' },

  // ── Quote card ───────────────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: '#111',
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: vs(8),
  },
  quoteText: { color: '#E5E7EB', fontStyle: 'italic', fontWeight: '400', lineHeight: fs(22), letterSpacing: 0.1 },
  quoteAuthor: { color: '#8B5CF6', fontWeight: '700', marginTop: vs(10), fontSize: fs(12) },

  // ── Bottom nav ────────────────────────────────────────────────────────────
  bottomNav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingTop: vs(10),
    paddingHorizontal: scale(20),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 10 },
    }),
  },
  navTab: { flex: 1, alignItems: 'center', gap: vs(3) },
  navIconWrap: {
    width: scale(40), height: scale(34),
    borderRadius: scale(11),
    justifyContent: 'center', alignItems: 'center',
  },
  navLabel: { color: '#BBB', fontWeight: '600' },
  navLabelActive: { color: '#111', fontWeight: '800' },
  navDot: { width: 4, height: 4, borderRadius: 2, marginTop: vs(1) },
});