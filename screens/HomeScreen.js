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

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs    = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);
const vs    = (size) => (SCREEN_H / 844) * size;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
// ─────────────────────────────────────────────────────────────────────────────

// Goal → habit mapping
const GOAL_HABITS = {
  discipline:    { emoji: '🧠', label: 'Daily focus block',      color: '#6D28D9' },
  fitness:       { emoji: '💪', label: 'Morning workout',         color: '#DC2626' },
  study:         { emoji: '📚', label: 'Study session',           color: '#2563EB' },
  productivity:  { emoji: '⚡', label: 'Deep work (2 hrs)',       color: '#D97706' },
  lifestyle:     { emoji: '🌿', label: 'Healthy meal',            color: '#16A34A' },
  consistent:    { emoji: '🔁', label: 'Evening review',          color: '#0891B2' },
  procrastinate: { emoji: '🎯', label: 'Do it now rule',          color: '#7C3AED' },
  mental:        { emoji: '🧘', label: '10-min meditation',       color: '#DB2777' },
  wakeup:        { emoji: '🌅', label: 'Wake up at 6 AM',        color: '#EA580C' },
  skills:        { emoji: '🚀', label: 'Learn for 30 min',        color: '#0284C7' },
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─────────────────────────────────────────────────────────────────────────────

const HomeScreen = ({ userData }) => {
  const insets = useSafeAreaInsets();

  // Derive habits from user's selected goals (max 5 shown)
  const habits = userData?.goals
    ? userData.goals
        .filter((g) => GOAL_HABITS[g])
        .slice(0, 6)
        .map((g, i) => ({
          id: g,
          ...GOAL_HABITS[g],
          streak: Math.floor(Math.random() * 7) + 1,
          // Pre-fill some days as done for visual richness
          done: Array.from({ length: 7 }, (_, d) => d < TODAY_INDEX),
        }))
    : Object.entries(GOAL_HABITS)
        .slice(0, 4)
        .map(([id, h]) => ({
          id,
          ...h,
          streak: 3,
          done: Array.from({ length: 7 }, (_, d) => d < TODAY_INDEX),
        }));

  const [checkedHabits, setCheckedHabits] = useState(
    () => new Set()
  );

  const username = userData?.username || 'Friend';

  // ── Entrance animations ───────────────────────────────────────────────────
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideUp    = useRef(new Animated.Value(vs(30))).current;
  const cardAnims  = useRef(habits.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(vs(24)),
  }))).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const progressW  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideUp,   { toValue: 0, tension: 22, friction: 9, useNativeDriver: true }),
    ]).start();

    // Habit cards stagger
    const staggered = cardAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1, duration: 420, delay: 250 + i * 80, useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0, tension: 24, friction: 9, delay: 250 + i * 80, useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(staggered).start();

    // Stats card fade
    Animated.timing(statsAnim, {
      toValue: 1, duration: 600, delay: 200, useNativeDriver: true,
    }).start();

    // Progress bar
    Animated.timing(progressW, {
      toValue: checkedHabits.size / Math.max(habits.length, 1),
      duration: 900,
      delay: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const toggleHabit = (id) => {
    setCheckedHabits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      // Animate progress bar
      Animated.timing(progressW, {
        toValue: next.size / habits.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
      return next;
    });
  };

  const completedCount = checkedHabits.size;
  const totalCount     = habits.length;
  const allDone        = completedCount === totalCount;

  const totalStreak = habits.reduce((s, h) => s + h.streak, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* BG decorations */}
      <View style={[styles.bgBlob, {
        width: scale(260), height: scale(260),
        borderRadius: scale(130),
        top: -scale(130), right: -scale(70),
      }]} />
      <View style={[styles.bgBlobPurple, {
        width: scale(160), height: scale(160),
        borderRadius: scale(80),
        bottom: vs(160), left: -scale(60),
      }]} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: vs(100) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >

        {/* ── TOP NAV ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.nav, { opacity: fadeAnim }]}>
          <View>
            <Text style={[styles.greeting, { fontSize: fs(13) }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.username, { fontSize: fs(26) }]}>
              {username} 👋
            </Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarEmoji}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* ── DAILY PROGRESS CARD ──────────────────────────────────────── */}
        <Animated.View
          style={[styles.progressCard, {
            opacity: statsAnim,
            marginTop: vs(20),
          }]}
        >
          <View style={styles.progressTop}>
            <View>
              <Text style={[styles.progressLabel, { fontSize: fs(11) }]}>
                TODAY'S PROGRESS
              </Text>
              <Text style={[styles.progressCount, { fontSize: fs(32) }]}>
                {completedCount}
                <Text style={[styles.progressTotal, { fontSize: fs(18) }]}>
                  /{totalCount}
                </Text>
              </Text>
              <Text style={[styles.progressSub, { fontSize: fs(13) }]}>
                {allDone
                  ? '🎉 All done! You crushed it.'
                  : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? 's' : ''} remaining`}
              </Text>
            </View>
            <View style={styles.ringWrapper}>
              <View style={[styles.ringOuter, {
                width: scale(72), height: scale(72),
                borderRadius: scale(36),
              }]}>
                <View style={[styles.ringInner, {
                  width: scale(56), height: scale(56),
                  borderRadius: scale(28),
                }]}>
                  <Text style={[styles.ringPct, { fontSize: fs(15) }]}>
                    {totalCount > 0
                      ? Math.round((completedCount / totalCount) * 100)
                      : 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.barTrack, { borderRadius: scale(6), marginTop: vs(16) }]}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  borderRadius: scale(6),
                  width: progressW.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: allDone ? '#16A34A' : '#8B5CF6',
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* ── STATS ROW ────────────────────────────────────────────────── */}
        <Animated.View style={[styles.statsRow, { opacity: statsAnim, marginTop: vs(16) }]}>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { fontSize: fs(22) }]}>{totalStreak}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(11) }]}>Total streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={[styles.statValue, { fontSize: fs(22) }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(11) }]}>Done today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statValue, { fontSize: fs(22) }]}>{habits.length}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(11) }]}>Active habits</Text>
          </View>
        </Animated.View>

        {/* ── SECTION TITLE ────────────────────────────────────────────── */}
        <Animated.View style={[styles.sectionHeader, {
          opacity: fadeAnim,
          transform: [{ translateY: slideUp }],
          marginTop: vs(28),
        }]}>
          <Text style={[styles.sectionTitle, { fontSize: fs(18) }]}>
            Today's Habits
          </Text>
          <Text style={[styles.sectionDate, { fontSize: fs(12) }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            })}
          </Text>
        </Animated.View>

        {/* ── HABIT CARDS ──────────────────────────────────────────────── */}
        {habits.map((habit, i) => {
          const isChecked = checkedHabits.has(habit.id);
          return (
            <Animated.View
              key={habit.id}
              style={{
                opacity: cardAnims[i]?.opacity ?? 1,
                transform: [{ translateY: cardAnims[i]?.translateY ?? 0 }],
                marginTop: vs(10),
              }}
            >
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => toggleHabit(habit.id)}
                style={[
                  styles.habitCard,
                  isChecked && styles.habitCardDone,
                ]}
              >
                {/* Left accent bar */}
                <View style={[styles.accentBar, { backgroundColor: isChecked ? '#16A34A' : habit.color }]} />

                {/* Emoji bubble */}
                <View style={[styles.emojiBubble, {
                  backgroundColor: isChecked ? '#DCFCE7' : habit.color + '18',
                }]}>
                  <Text style={styles.habitEmoji}>{isChecked ? '✅' : habit.emoji}</Text>
                </View>

                {/* Text */}
                <View style={styles.habitMeta}>
                  <Text style={[
                    styles.habitLabel,
                    { fontSize: fs(15) },
                    isChecked && styles.habitLabelDone,
                  ]}>
                    {habit.label}
                  </Text>
                  {/* Week dots */}
                  <View style={styles.weekDots}>
                    {DAYS.map((d, di) => (
                      <View
                        key={di}
                        style={[
                          styles.weekDot,
                          di === TODAY_INDEX
                            ? { backgroundColor: isChecked ? '#16A34A' : habit.color, opacity: 1 }
                            : habit.done[di]
                            ? { backgroundColor: habit.color, opacity: 0.35 }
                            : { backgroundColor: '#E5E7EB', opacity: 1 },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Streak badge */}
                <View style={[styles.streakBadge, {
                  backgroundColor: isChecked ? '#DCFCE7' : '#F5F5F5',
                }]}>
                  <Text style={[styles.streakNum, {
                    fontSize: fs(14),
                    color: isChecked ? '#16A34A' : '#555',
                  }]}>
                    {habit.streak + (isChecked ? 1 : 0)}
                  </Text>
                  <Text style={[styles.streakFire, { fontSize: fs(10) }]}>🔥</Text>
                </View>

              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* ── MOTIVATIONAL QUOTE ───────────────────────────────────────── */}
        <Animated.View style={[styles.quoteCard, {
          opacity: statsAnim,
          marginTop: vs(24),
        }]}>
          <Text style={[styles.quoteText, { fontSize: fs(15) }]}>
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </Text>
          <Text style={[styles.quoteAuthor, { fontSize: fs(12) }]}>— Aristotle</Text>
        </Animated.View>

      </ScrollView>

      {/* ── BOTTOM NAV BAR ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottomNav, {
        opacity: fadeAnim,
        paddingBottom: insets.bottom > 0 ? insets.bottom : vs(16),
      }]}>
        {[
          { icon: '🏠', label: 'Home',    active: true  },
          { icon: '📊', label: 'Stats',   active: false },
          { icon: '➕', label: 'Add',     active: false, big: true },
          { icon: '🏅', label: 'Goals',   active: false },
          { icon: '👤', label: 'Profile', active: false },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.label}
            activeOpacity={0.7}
            style={[styles.navTab, tab.big && styles.navTabBig]}
            onPress={() => {}}
          >
            {tab.big ? (
              <View style={styles.addBtn}>
                <Text style={styles.addBtnIcon}>＋</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.navIcon, { fontSize: fs(20) }]}>{tab.icon}</Text>
                <Text style={[
                  styles.navLabel,
                  { fontSize: fs(10) },
                  tab.active && styles.navLabelActive,
                ]}>
                  {tab.label}
                </Text>
                {tab.active && <View style={styles.navDot} />}
              </>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FB',
  },

  // BG
  bgBlob: {
    position: 'absolute',
    backgroundColor: '#F5F3FF',
    zIndex: -1,
  },
  bgBlobPurple: {
    position: 'absolute',
    backgroundColor: '#F0FDF4',
    zIndex: -1,
  },

  scroll: {
    paddingHorizontal: scale(22),
    paddingTop: vs(14),
  },

  // ── Nav ──────────────────────────────────────────────────────────────────
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(4),
  },
  greeting: {
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  username: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.8,
    marginTop: vs(2),
  },
  avatarWrapper: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 5 },
    }),
  },
  avatarEmoji: {
    fontSize: fs(20),
    color: '#FFF',
    fontWeight: '900',
  },

  // ── Progress card ────────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: scale(22),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: { shadowColor: '#8B5CF6', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: vs(4),
  },
  progressCount: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1,
  },
  progressTotal: {
    fontWeight: '500',
    color: '#CCC',
  },
  progressSub: {
    color: '#888',
    fontWeight: '500',
    marginTop: vs(4),
  },
  ringWrapper: {},
  ringOuter: {
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPct: {
    fontWeight: '900',
    color: '#8B5CF6',
    letterSpacing: -0.5,
  },
  barTrack: {
    height: 7,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },

  // ── Stats row ────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  statCard: {
    flex: 1,
    borderRadius: scale(16),
    padding: scale(14),
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: fs(20),
    marginBottom: vs(4),
  },
  statValue: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.8,
  },
  statLabel: {
    color: '#888',
    fontWeight: '600',
    marginTop: vs(2),
    textAlign: 'center',
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.6,
  },
  sectionDate: {
    color: '#AAA',
    fontWeight: '500',
  },

  // ── Habit cards ───────────────────────────────────────────────────────────
  habitCard: {
    backgroundColor: '#fff',
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
  habitCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  accentBar: {
    width: scale(4),
    alignSelf: 'stretch',
    marginRight: scale(14),
    borderTopLeftRadius: scale(18),
    borderBottomLeftRadius: scale(18),
  },
  emojiBubble: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(13),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  habitEmoji: {
    fontSize: fs(20),
  },
  habitMeta: {
    flex: 1,
    paddingVertical: vs(14),
  },
  habitLabel: {
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
    marginBottom: vs(6),
  },
  habitLabelDone: {
    color: '#16A34A',
    textDecorationLine: 'line-through',
    textDecorationColor: '#16A34A',
  },
  weekDots: {
    flexDirection: 'row',
    gap: scale(4),
  },
  weekDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: vs(6),
    borderRadius: scale(10),
    marginLeft: scale(10),
  },
  streakNum: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  streakFire: {},

  // ── Quote card ────────────────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: '#111',
    borderRadius: scale(20),
    padding: scale(22),
    marginBottom: vs(8),
  },
  quoteText: {
    color: '#E5E7EB',
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: fs(24),
    letterSpacing: 0.1,
  },
  quoteAuthor: {
    color: '#8B5CF6',
    fontWeight: '700',
    marginTop: vs(12),
    letterSpacing: 0.2,
  },

  // ── Bottom nav ────────────────────────────────────────────────────────────
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingTop: vs(10),
    paddingHorizontal: scale(10),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 10 },
    }),
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: vs(4),
  },
  navTabBig: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  navIcon: {
    marginBottom: vs(2),
  },
  navLabel: {
    color: '#BBB',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#111',
    fontWeight: '800',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
    marginTop: vs(3),
  },
  addBtn: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(16),
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(2),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  addBtnIcon: {
    color: '#FFF',
    fontSize: fs(24),
    fontWeight: '300',
    lineHeight: fs(27),
  },
});

export default HomeScreen;