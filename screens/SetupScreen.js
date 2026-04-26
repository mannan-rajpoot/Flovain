import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
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
  { id: 'discipline',    label: 'Build discipline',       icon: 'shield-checkmark-outline' },
  { id: 'fitness',       label: 'Get fit',                icon: 'barbell-outline'          },
  { id: 'study',         label: 'Study better',           icon: 'book-outline'             },
  { id: 'productivity',  label: 'Improve productivity',   icon: 'flash-outline'            },
  { id: 'lifestyle',     label: 'Improve lifestyle',      icon: 'leaf-outline'             },
  { id: 'consistent',    label: 'Stay consistent',        icon: 'repeat-outline'           },
  { id: 'procrastinate', label: 'Reduce procrastination', icon: 'timer-outline'            },
  { id: 'mental',        label: 'Mental health',          icon: 'heart-outline'            },
  { id: 'wakeup',        label: 'Wake up early',          icon: 'sunny-outline'            },
  { id: 'skills',        label: 'Learn new skills',       icon: 'rocket-outline'           },
];

const SetupScreen = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const [username, setUsername]           = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [inputFocused, setInputFocused]   = useState(false);
  const inputRef = useRef(null);

  // ── Animations ────────────────────────────────────────────────────────────
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(vs(30))).current;
  const footerAnim  = useRef(new Animated.Value(0)).current;
  const cardFades   = useRef(GOALS.map(() => new Animated.Value(0))).current;
  const cardSlides  = useRef(GOALS.map(() => new Animated.Value(scale(18)))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 22, friction: 9, useNativeDriver: true }),
      Animated.timing(footerAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();

    Animated.parallel(
      GOALS.map((_, i) =>
        Animated.parallel([
          Animated.timing(cardFades[i], {
            toValue: 1, duration: 380, delay: 300 + i * 50, useNativeDriver: true,
          }),
          Animated.spring(cardSlides[i], {
            toValue: 0, tension: 26, friction: 8, delay: 300 + i * 50, useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const toggleGoal = (id) =>
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const canContinue = username.trim().length > 0 && selectedGoals.length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    if (onFinish) onFinish({ username: username.trim(), goals: selectedGoals });
  };

  const footerH = clamp(vs(130), 110, 160) + insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* 
         FIX 1: Added pointerEvents="none" 
         This prevents the background circles from intercepting touch events 
         that should go to the TextInput or Chips.
      */}
      <View 
        pointerEvents="none"
        style={[styles.bgCircle, {
          width: scale(280), height: scale(280), borderRadius: scale(140),
          top: -scale(140), right: -scale(80),
        }]} 
      />
      <View 
        pointerEvents="none"
        style={[styles.bgCircleBottom, {
          width: scale(200), height: scale(200), borderRadius: scale(100),
          bottom: -scale(80), left: -scale(60),
        }]} 
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: footerH + vs(24) },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          // FIX 2: handled is correct, but we ensure the ScrollView doesn't 
          // capture the touch before it hits the input.
          keyboardShouldPersistTaps="always" 
          keyboardDismissMode="on-drag"
        >

          {/* ── STEP DOTS ── */}
          <Animated.View style={[styles.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerSlide }],
          }]}>
            <View style={styles.stepDots}>
              <View style={[styles.dot, styles.dotDone]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotIdle]} />
            </View>
          </Animated.View>

          {/* ── HERO TEXT ── */}
          <Animated.View style={{
            opacity: headerAnim,
            transform: [{ translateY: headerSlide }],
          }}>
            <Text style={[styles.kicker, { fontSize: fs(11) }]}>Almost there</Text>
            <Text style={[styles.title, { fontSize: fs(36), lineHeight: fs(42) }]}>
              Let's personalise{'\n'}your journey.
            </Text>
            <Text style={[styles.subtitle, { fontSize: fs(15), lineHeight: fs(24) }]}>
              Tell us who you are and what you want to achieve.
            </Text>
          </Animated.View>

          {/* ── USERNAME INPUT ── */}
          <View style={{ marginTop: vs(30) }}>
            <Text style={[styles.fieldLabel, { fontSize: fs(12) }]}>YOUR NAME</Text>
            
            {/* 
                FIX 3: Wrap input in a focusable area 
                Sometimes on Android, clicking the icon or the wrapper doesn't 
                trigger the inner TextInput focus correctly.
            */}
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[
                styles.inputWrapper,
                inputFocused && styles.inputWrapperFocused,
              ]}>
                <Ionicons
                  name="person-outline"
                  size={scale(18)}
                  color={inputFocused ? '#8B5CF6' : '#C0C0C0'}
                  style={{ marginRight: scale(10) }}
                />
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { fontSize: fs(16) }]}
                  placeholder="Enter your name"
                  placeholderTextColor="#C0C0C0"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  maxLength={24}
                  autoCorrect={false}
                  autoCapitalize="words"
                  underlineColorAndroid="transparent"
                />
                {username.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setUsername('');
                      inputRef.current?.focus();
                    }}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons name="close-circle" size={scale(18)} color="#C0C0C0" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* ── GOAL CHIPS ── */}
          <View style={{ marginTop: vs(28) }}>
            <Text style={[styles.fieldLabel, { fontSize: fs(12), marginBottom: vs(14) }]}>
              YOUR GOALS
            </Text>
            <View style={styles.chipGrid}>
              {GOALS.map((goal, i) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <Animated.View
                    key={goal.id}
                    style={{
                      opacity: cardFades[i],
                      transform: [{ translateX: cardSlides[i] }],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => toggleGoal(goal.id)}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                    >
                      <Ionicons
                        name={isSelected ? goal.icon.replace('-outline', '') : goal.icon}
                        size={scale(14)}
                        color={isSelected ? '#FFF' : '#666'}
                      />
                      <Text style={[
                        styles.chipLabel,
                        { fontSize: fs(13) },
                        isSelected && styles.chipLabelSelected,
                      ]}>
                        {goal.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.chipCheck}>
                          <Ionicons name="checkmark" size={scale(9)} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── FIXED FOOTER ── */}
      <Animated.View style={[styles.footer, {
        opacity: footerAnim,
        paddingBottom: insets.bottom > 0 ? insets.bottom : vs(32),
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
          <Text style={[styles.buttonText, { fontSize: fs(17) }]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={scale(18)}
            color={canContinue ? '#FFF' : '#BBB'}
            style={{ marginLeft: scale(8) }}
          />
        </TouchableOpacity>
        <Text style={[styles.termsText, { fontSize: fs(12), marginTop: vs(14) }]}>
          {selectedGoals.length > 0
            ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected`
            : 'Select at least one goal to continue'}
        </Text>
      </Animated.View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  bgCircle: { position: 'absolute', backgroundColor: '#F5F3FF', zIndex: -1 },
  bgCircleBottom: { position: 'absolute', backgroundColor: '#F0FDF4', zIndex: -1 },

  header: { marginBottom: vs(24) },
  stepDots: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  dot: { height: 6, borderRadius: 3 },
  dotDone:   { width: scale(18), backgroundColor: '#8B5CF6', opacity: 0.4 },
  dotActive: { width: scale(28), backgroundColor: '#8B5CF6' },
  dotIdle:   { width: scale(18), backgroundColor: '#E5E7EB' },

  scrollContent: { paddingHorizontal: scale(28), paddingTop: vs(16) },

  kicker: {
    fontWeight: '800', color: '#8B5CF6',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: vs(10),
  },
  title: { fontWeight: '900', color: '#111', letterSpacing: -1.2 },
  subtitle: { color: '#666', marginTop: vs(12), fontWeight: '400' },

  fieldLabel: {
    fontWeight: '800', color: '#999',
    letterSpacing: 1.4, marginBottom: vs(10),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(16),
    backgroundColor: '#FAFAFA',
    paddingHorizontal: scale(16),
    height: clamp(vs(54), 50, 62),
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FDFCFF',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6', shadowOpacity: 0.15,
        shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  textInput: {
    flex: 1,
    color: '#111',
    fontWeight: '600',
    // Removed specific padding/margin constraints that sometimes 
    // shrink the tappable area on Android
    height: '100%', 
  },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10) },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: scale(13), paddingVertical: vs(10),
    borderRadius: scale(50), borderWidth: 1.5,
    borderColor: '#E5E7EB', backgroundColor: '#FAFAFA',
    gap: scale(6),
  },
  chipSelected: {
    backgroundColor: '#111', borderColor: '#111',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.14,
        shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  chipLabel: { fontWeight: '600', color: '#444', letterSpacing: -0.2 },
  chipLabelSelected: { color: '#FFF' },
  chipCheck: {
    width: scale(16), height: scale(16), borderRadius: scale(8),
    backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
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
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: { color: '#FFF', fontWeight: '700', letterSpacing: -0.3 },
  termsText: { textAlign: 'center', color: '#AAA', fontWeight: '500' },
});

export default SetupScreen;