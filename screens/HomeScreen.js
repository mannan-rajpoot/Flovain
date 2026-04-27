import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Platform, Image, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs    = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);
const vs    = (size) => (SCREEN_H / 844) * size;

// Goal Meta updated with colors matching SetupScreen
const GOAL_META = {
  fitness:      { label: 'Get Fit',             icon: 'barbell',          color: '#F43F5E', bg: '#FFF1F2' },
  study:        { label: 'Study Better',         icon: 'book',             color: '#F59E0B', bg: '#FFFBEB' },
  mental:       { label: 'Mental Health',        icon: 'heart',            color: '#8B5CF6', bg: '#F5F3FF' },
  discipline:   { label: 'Build Discipline',     icon: 'shield-checkmark', color: '#6366F1', bg: '#EEF2FF' },
  productivity: { label: 'Be More Productive',   icon: 'flash',            color: '#10B981', bg: '#ECFDF5' },
};

const GOAL_HABITS = {
  fitness:      [{ id: 'h1', label: 'Morning workout', icon: 'barbell-outline' }, { id: 'h2', label: 'Drink 8 glasses water', icon: 'water-outline' }, { id: 'h3', label: '10k steps today', icon: 'footsteps-outline' }],
  study:        [{ id: 'h1', label: 'Study session 1hr', icon: 'book-outline' }, { id: 'h2', label: 'Review notes', icon: 'document-text-outline' }, { id: 'h3', label: 'No distractions block', icon: 'phone-portrait-outline' }],
  mental:       [{ id: 'h1', label: '10-min meditation', icon: 'heart-outline' }, { id: 'h2', label: 'Gratitude journal', icon: 'pencil-outline' }, { id: 'h3', label: 'No screens before bed', icon: 'moon-outline' }],
  discipline:   [{ id: 'h1', label: 'Wake up at 6 AM', icon: 'sunny-outline' }, { id: 'h2', label: 'Cold shower', icon: 'snow-outline' }, { id: 'h3', label: 'Evening review', icon: 'checkmark-circle-outline' }],
  productivity: [{ id: 'h1', label: 'Deep work 2 hrs', icon: 'flash-outline' }, { id: 'h2', label: 'Plan tomorrow', icon: 'list-outline' }, { id: 'h3', label: 'Inbox zero', icon: 'mail-outline' }],
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const NAV_TABS = [
  { id: 'home',     label: 'Home',     icon: 'home',              iconOutline: 'home-outline' },
  { id: 'stats',    label: 'Stats',    icon: 'bar-chart',         iconOutline: 'bar-chart-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings',          iconOutline: 'settings-outline' },
];

const HabitRow = ({ habit, checked, streak, onToggle, animOpacity, animSlide }) => {
  const checkScale = useRef(new Animated.Value(1)).current;
  const opacity = animOpacity || new Animated.Value(1);
  const translateY = animSlide || new Animated.Value(0);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 260, friction: 8, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity activeOpacity={0.8} onPress={handleToggle} style={[styles.habitCard, checked && styles.habitCardDone]}>
        <View style={[styles.accentBar, { backgroundColor: checked ? '#000' : '#E5E7EB' }]} />
        <View style={[styles.habitIconBubble, { backgroundColor: checked ? '#F3F4F6' : '#F9FAFB' }]}>
          <Ionicons name={checked ? 'checkmark-done' : habit.icon} size={scale(20)} color="#000" />
        </View>
        <View style={styles.habitMeta}>
          <View style={styles.habitTitleRow}>
            <Text style={[styles.habitLabel, { fontSize: fs(14) }, checked && styles.habitLabelDone]}>{habit.label}</Text>
            <View style={styles.habitStreakBadge}>
              <Ionicons name="flame" size={scale(10)} color={streak > 0 ? "#000" : "#CCC"} />
              <Text style={[styles.habitStreakText, { color: streak > 0 ? "#000" : "#AAA" }]}>{streak}</Text>
            </View>
          </View>
          <View style={styles.weekTrackerRow}>
            {DAYS.map((d, di) => (
              <View key={di} style={styles.dayColumn}>
                <View style={[styles.weekDot, di === TODAY_IDX ? { backgroundColor: '#000' } : di < TODAY_IDX ? { backgroundColor: '#000', opacity: 0.2 } : { backgroundColor: '#E5E7EB' }]} />
                <Text style={[styles.dayLetter, di === TODAY_IDX ? { color: '#000', fontWeight: '800' } : { color: '#CCC' }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <View style={[styles.checkCircle, checked && { backgroundColor: '#000', borderColor: '#000' }]}>
            {checked && <Ionicons name="checkmark" size={scale(12)} color="#FFF" />}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ userData, onLogout }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');
  const [checked, setChecked] = useState(new Set());
  const [streaks, setStreaks] = useState({ h1: 5, h2: 12, h3: 3 });

  const username  = userData?.username || 'User';
  const goalId    = userData?.goals?.[0] || 'productivity';
  const goalMeta  = GOAL_META[goalId] || GOAL_META.productivity;
  const habits    = GOAL_HABITS[goalId] || GOAL_HABITS.productivity;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(vs(20))).current;
  const progressW = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(0)).current;

  const habitAnims = useRef(habits.map(() => ({
    opacity: new Animated.Value(0),
    translate: new Animated.Value(vs(15))
  }))).current;

  const NAV_PADDING = scale(6);
  const TAB_CONTAINER_WIDTH = SCREEN_W - scale(44);
  const TAB_WIDTH = (TAB_CONTAINER_WIDTH - (NAV_PADDING * 2)) / NAV_TABS.length;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp,  { toValue: 0, tension: 25, friction: 9, useNativeDriver: true }),
    ]).start();

    Animated.stagger(80, habitAnims.map(anim => 
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(anim.translate, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true })
      ])
    )).start();
  }, []);

  const handleTabPress = (id, index) => {
    setActiveTab(id);
    Animated.spring(tabTranslateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();

    if (id === 'settings') {
      Alert.alert(
        "Reset App",
        "Are you sure you want to clear all data and restart?",
        [
          { text: "Cancel", style: "cancel", onPress: () => handleTabPress('home', 0) },
          { text: "Reset", style: "destructive", onPress: onLogout }
        ]
      );
    }
  };

  const toggleHabit = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.has(id)) {
        next.add(id);
        setStreaks(s => ({ ...s, [id]: (s[id] || 0) + 1 }));
      } else {
        next.delete(id);
        setStreaks(s => ({ ...s, [id]: Math.max(0, (s[id] || 0) - 1) }));
      }
      Animated.timing(progressW, { toValue: next.size / habits.length, duration: 400, useNativeDriver: false }).start();
      return next;
    });
  };

  const pct = habits.length > 0 ? Math.round((checked.size / habits.length) * 100) : 0;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: vs(120) }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} bounces={false}>
        <View style={styles.stickyHeaderContainer}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.brandRow}>
                <Image source={require('../assets/flovain-intro.png')} style={styles.brandIcon} resizeMode="contain" />
                <Text style={styles.brandName}>FLOVAIN</Text>
              </View>
              {/* Goal Badge with dynamic colors */}
              <View style={[styles.goalBadge, { backgroundColor: goalMeta.bg }]}>
                <Ionicons name={goalMeta.icon} size={scale(12)} color={goalMeta.color} />
                <Text style={[styles.goalBadgeText, { color: goalMeta.color }]}>{goalMeta.label.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.headerBottomRow}>
              <View>
                <Text style={styles.username}>{username} 👋</Text>
                <Text style={styles.dateText}>{currentDate}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <View>
                  <Text style={styles.progressLabel}>TODAY'S COMPLETION</Text>
                  <Text style={styles.progressCount}>{checked.size}<Text style={{color: '#BBB'}}>/{habits.length}</Text></Text>
                </View>
                <View style={[styles.ringOuter, { borderColor: '#000' }]}>
                  <Text style={styles.ringPct}>{pct}%</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { width: progressW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Daily Habits</Text>
            {habits.map((habit, i) => (
              <View key={habit.id} style={{ marginTop: vs(12) }}>
                <HabitRow habit={habit} checked={checked.has(habit.id)} streak={streaks[habit.id] || 0} onToggle={() => toggleHabit(habit.id)} animOpacity={habitAnims[i]?.opacity} animSlide={habitAnims[i]?.translate} />
              </View>
            ))}
            <TouchableOpacity activeOpacity={0.85} style={styles.addHabitBtn} onPress={() => {}}>
              <Ionicons name="add" size={scale(24)} color="#FFF" />
              <Text style={styles.addHabitText}>Add Habit</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNavContainer, { bottom: Math.max(insets.bottom, vs(14)) }]}>
        <View style={styles.navInner}>
          <Animated.View style={[styles.navPill, { width: TAB_WIDTH, transform: [{ translateX: tabTranslateX }] }]} />
          {NAV_TABS.map((tab, index) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} activeOpacity={1} style={[styles.navTab, { width: TAB_WIDTH }]} onPress={() => handleTabPress(tab.id, index)}>
                <Ionicons name={active ? tab.icon : tab.iconOutline} size={scale(22)} color={active ? '#FFF' : '#A3A3A3'} />
                <Text style={[styles.navLabel, active && { color: '#FFF' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  stickyHeaderContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: scale(22), paddingBottom: vs(15), paddingTop: vs(10), zIndex: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(18) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  brandIcon: { width: scale(20), height: scale(20) },
  brandName: { fontWeight: '900', fontSize: fs(13), letterSpacing: 2.5, color: '#000' },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: scale(5), paddingHorizontal: scale(10), paddingVertical: vs(5), borderRadius: scale(8) },
  goalBadgeText: { fontWeight: '800', fontSize: fs(9) },
  headerBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  username: { fontWeight: '900', fontSize: fs(28), color: '#000', letterSpacing: -1 },
  dateText: { fontWeight: '600', fontSize: fs(13), color: '#AAA' },
  content: { paddingHorizontal: scale(22), paddingTop: vs(15) },
  progressCard: { backgroundColor: '#FFF', borderRadius: scale(24), padding: scale(22), borderWidth: 1, borderColor: '#F3F4F6' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontWeight: '800', fontSize: fs(10), letterSpacing: 1.2, color: '#AAA' },
  progressCount: { fontWeight: '900', fontSize: fs(38), color: '#000' },
  ringOuter: { width: scale(60), height: scale(60), borderRadius: scale(30), borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  ringPct: { fontWeight: '900', fontSize: fs(14) },
  barTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: vs(20), overflow: 'hidden' },
  barFill:  { height: '100%', backgroundColor: '#000' },
  sectionTitle: { fontWeight: '900', fontSize: fs(18), color: '#000', marginTop: vs(30), marginBottom: vs(5) },
  habitCard: { backgroundColor: '#FFF', borderRadius: scale(20), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  habitCardDone: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  accentBar: { width: scale(4), height: '100%' },
  habitIconBubble: { width: scale(44), height: scale(44), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center', marginHorizontal: scale(12) },
  habitMeta: { flex: 1, paddingVertical: vs(14) },
  habitTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: scale(10) },
  habitLabel: { fontWeight: '700', color: '#000' },
  habitLabelDone: { color: '#AAA', textDecorationLine: 'line-through' },
  habitStreakBadge: { flexDirection: 'row', alignItems: 'center', gap: scale(3), backgroundColor: '#F3F4F6', paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(6) },
  habitStreakText: { fontSize: fs(10), fontWeight: '800' },
  weekTrackerRow: { flexDirection: 'row', gap: scale(8), marginTop: vs(10) },
  dayColumn: { alignItems: 'center', gap: vs(4) },
  weekDot: { width: scale(6), height: scale(6), borderRadius: 3 },
  dayLetter: { fontSize: fs(8), fontWeight: '700' },
  checkCircle: { width: scale(24), height: scale(24), borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', marginRight: scale(15), justifyContent: 'center', alignItems: 'center' },
  addHabitBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(16), borderRadius: scale(20), marginTop: vs(24), gap: scale(8) },
  addHabitText: { color: '#FFF', fontWeight: '800', fontSize: fs(15) },
  bottomNavContainer: { position: 'absolute', left: scale(22), right: scale(22), backgroundColor: '#FFF', borderRadius: scale(28), height: vs(72), borderWidth: 1, borderColor: '#F3F4F6', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } }, android: { elevation: 8 } }) },
  navInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(6) },
  navPill: { position: 'absolute', height: '75%', backgroundColor: '#000', borderRadius: scale(22), left: scale(6) },
  navTab: { height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  navLabel: { fontSize: fs(10), fontWeight: '700', color: '#A3A3A3', marginTop: vs(2) },
});