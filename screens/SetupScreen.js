import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const scale = (size) => (SCREEN_W / 390) * size;
const fs    = (size) => Math.min((SCREEN_W / 390) * size, size * 1.25);
const vs    = (size) => (SCREEN_H / 844) * size;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const GOALS = [
  {
    id: 'fitness',
    label: 'Get Fit',
    sub: 'Build a stronger, healthier body',
    icon: 'barbell-outline',
    iconFilled: 'barbell',
    color: '#F43F5E',
    bg: '#FFF1F2',
  },
  {
    id: 'study',
    label: 'Study Better',
    sub: 'Focus deeper and retain more',
    icon: 'book-outline',
    iconFilled: 'book',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'mental',
    label: 'Mental Health',
    sub: 'Reduce stress and build calm',
    icon: 'heart-outline',
    iconFilled: 'heart',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'discipline',
    label: 'Build Discipline',
    sub: 'Stay consistent and wake early',
    icon: 'shield-checkmark-outline',
    iconFilled: 'shield-checkmark',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    id: 'productivity',
    label: 'Be More Productive',
    sub: 'Stop procrastinating, do more',
    icon: 'flash-outline',
    iconFilled: 'flash',
    color: '#10B981',
    bg: '#ECFDF5',
  },
];

// ── Goal card component ────────────────────────────────────────────────────
const GoalCard = ({ goal, isSelected, onPress, animOpacity, animSlide }) => {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, tension: 260, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: animOpacity,
        transform: [{ translateY: animSlide }, { scale: pressScale }],
        flex: 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={[
          styles.card,
          isSelected && {
            borderColor: goal.color,
            borderWidth: 2,
            backgroundColor: goal.bg,
          },
        ]}
      >
        {/* Icon bubble */}
        <View style={[
          styles.cardIconBubble,
          { backgroundColor: isSelected ? goal.color : '#F3F4F6' },
        ]}>
          <Ionicons
            name={isSelected ? goal.iconFilled : goal.icon}
            size={scale(22)}
            color={isSelected ? '#FFF' : '#999'}
          />
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <Text
            style={[
              styles.cardLabel,
              { fontSize: fs(15) },
              isSelected && { color: goal.color },
            ]}
          >
            {goal.label}
          </Text>
          <Text style={[styles.cardSub, { fontSize: fs(12) }]}>
            {goal.sub}
          </Text>
        </View>

        {/* Radio */}
        <View style={[styles.radio, isSelected && { borderColor: goal.color }]}>
          {isSelected && (
            <View style={[styles.radioDot, { backgroundColor: goal.color }]} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function SetupScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername]    = useState('');
  const [selectedGoal, setGoal]    = useState(null);
  const [inputFocused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // ── Animations — same pattern as WelcomeScreen ──────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(vs(30))).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Per-card stagger: opacity + slide
  const cardOpacities = useRef(GOALS.map(() => new Animated.Value(0))).current;
  const cardSlides    = useRef(GOALS.map(() => new Animated.Value(vs(20)))).current;

  useEffect(() => {
    // Header + input entrance — exact same as WelcomeScreen
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideUp,  { toValue: 0, tension: 22, friction: 9, useNativeDriver: true }),
      Animated.timing(footerFade, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();

    // Cards stagger in — same spring params as WelcomeScreen
    Animated.parallel(
      GOALS.map((_, i) =>
        Animated.parallel([
          Animated.timing(cardOpacities[i], {
            toValue: 1,
            duration: 500,
            delay: 350 + i * 70,
            useNativeDriver: true,
          }),
          Animated.spring(cardSlides[i], {
            toValue: 0,
            tension: 22,
            friction: 9,
            delay: 350 + i * 70,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const canContinue = username.trim().length > 0 && selectedGoal !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    if (onFinish) onFinish({ username: username.trim(), goals: [selectedGoal] });
  };

  const footerH = clamp(vs(130), 110, 160) + insets.bottom;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

        {/* Background circle — same as WelcomeScreen */}
        <View
          pointerEvents="none"
          style={[styles.bgCircle, {
            width: scale(300), height: scale(300), borderRadius: scale(150),
            top: -scale(150), right: -scale(100),
          }]}
        />

        {/* ── MAIN CONTENT — flex layout, no scroll needed ── */}
        <View style={[styles.content, { paddingBottom: footerH }]}>

          {/* HERO */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
            <Text style={[styles.kicker, { fontSize: fs(11) }]}>Almost there</Text>
            <Text style={[styles.title, { fontSize: fs(34), lineHeight: fs(40) }]}>
              Let’s build your best routine.
            </Text>
          </Animated.View>

          {/* NAME INPUT */}
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
            <Text style={[styles.fieldLabel, { fontSize: fs(11) }]}>YOUR NAME</Text>
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconBubble, inputFocused && styles.inputIconFocused]}>
                  <Ionicons
                    name={inputFocused ? 'person' : 'person-outline'}
                    size={scale(15)}
                    color={inputFocused ? '#8B5CF6' : '#AAA'}
                  />
                </View>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { fontSize: fs(15) }]}
                  placeholder="Enter your name"
                  placeholderTextColor="#C4C4C4"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  maxLength={24}
                  autoCorrect={false}
                  autoCapitalize="words"
                  underlineColorAndroid="transparent"
                />
                {username.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { setUsername(''); inputRef.current?.focus(); }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close-circle" size={scale(18)} color="#D1D5DB" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* GOAL QUESTION */}
          <Animated.View style={[styles.goalSection, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
            <Text style={[styles.fieldLabel, { fontSize: fs(11), marginBottom: vs(10) }]}>
              WHAT DO YOU WANT TO IMPROVE MOST?
            </Text>
          </Animated.View>

          {/* GOAL CARDS — flex column fills remaining space */}
          <View style={styles.cardList}>
            {GOALS.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={selectedGoal === goal.id}
                onPress={() => setGoal(goal.id)}
                animOpacity={cardOpacities[i]}
                animSlide={cardSlides[i]}
              />
            ))}
          </View>

        </View>

        {/* FIXED FOOTER */}
        <Animated.View style={[styles.footer, {
          opacity: footerFade,
          paddingBottom: insets.bottom > 0 ? insets.bottom : vs(28),
          paddingHorizontal: scale(26),
          paddingTop: vs(14),
        }]}>
          <TouchableOpacity
            activeOpacity={canContinue ? 0.88 : 1}
            style={[
              styles.primaryButton,
              { height: clamp(vs(60), 52, 68), borderRadius: scale(18) },
              !canContinue && styles.primaryButtonDisabled,
            ]}
            onPress={handleContinue}
          >
            <Text style={[
              styles.buttonText,
              { fontSize: fs(17) },
              !canContinue && styles.buttonTextDisabled,
            ]}>
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={scale(18)}
              color={canContinue ? '#FFF' : '#C0C0C0'}
              style={{ marginLeft: scale(8) }}
            />
          </TouchableOpacity>

          <Text style={[styles.footerHint, { fontSize: fs(12), marginTop: vs(10) }]}>
            {!selectedGoal
              ? 'Pick your main focus to continue'
              : !username.trim()
              ? 'Enter your name to continue'
              : `Let's go, ${username.trim().split(' ')[0]} 🚀`}
          </Text>
        </Animated.View>

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  bgCircle: {
    position: 'absolute',
    backgroundColor: '#F5F3FF',
    zIndex: -1,
  },

  // Full-height flex column — everything fits on screen
  content: {
    flex: 1,
    paddingHorizontal: scale(26),
    paddingTop: vs(16),
  },

  kicker: {
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: vs(6),
  },
  title: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.2,
  },

  // Input block
  inputSection: {
    marginTop: vs(20),
  },
  fieldLabel: {
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: vs(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(14),
    backgroundColor: '#FAFAFA',
    paddingHorizontal: scale(14),
    height: clamp(vs(52), 48, 58),
    gap: scale(10),
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FDFCFF',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6', shadowOpacity: 0.14,
        shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  inputIconBubble: {
    width: scale(28), height: scale(28),
    borderRadius: scale(8),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  inputIconFocused: { backgroundColor: '#EDE9FE' },
  textInput: {
    flex: 1,
    color: '#111',
    fontWeight: '600',
    height: '100%',
    paddingVertical: 0,
  },

  goalSection: {
    marginTop: vs(18),
  },

  // Cards fill all remaining vertical space evenly
  cardList: {
    flex: 1,
    gap: scale(8),
    paddingBottom: vs(4),
  },

  // Each card — height comes from flex:1 on parent
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    gap: scale(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.04,
        shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },

  cardIconBubble: {
    width: scale(42), height: scale(42),
    borderRadius: scale(12),
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  cardText: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.3,
    marginBottom: vs(1),
  },
  cardSub: {
    color: '#AAA',
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  radio: {
    width: scale(20), height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  radioDot: {
    width: scale(10), height: scale(10),
    borderRadius: scale(5),
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
    }),
  },
  primaryButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDisabled: { backgroundColor: '#E5E7EB' },
  buttonText: { color: '#FFF', fontWeight: '700', letterSpacing: -0.3 },
  buttonTextDisabled: { color: '#A1A1AA' },
  footerHint: { textAlign: 'center', color: '#AAA', fontWeight: '500' },
});