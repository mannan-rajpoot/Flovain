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
  Image,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Responsive utilities
const scale = (size) => (SCREEN_W / 390) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.1);
const vs = (size) => (SCREEN_H / 844) * size;

export default function SetupScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const inputScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(inputScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const canContinue = username.trim().length >= 2;

  const handleFinish = () => {
    if (!canContinue) return;

    Keyboard.dismiss();

    // Only "Begin Experience" button triggers navigation to Home
    onFinish({
      username: username.trim(),
      goals: ['productivity'], // Default goal
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

          {/* Background Decoration */}
          <View style={styles.topDecoration} />

          <View style={styles.inner}>
            
            {/* Brand Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
              <View style={styles.brandRow}>
                <Image 
                  source={require('../assets/flovain-intro.png')} 
                  style={styles.brandImg} 
                />
                <Text style={styles.brandTxt}>FLOVAIN</Text>
              </View>
              <Text style={styles.title}>What's your name?</Text>
              <Text style={styles.subtitle}>
                We'll use this to personalize your journey.
              </Text>
            </Animated.View>

            {/* Input Field */}
            <Animated.View
              style={[
                styles.inputSection,
                { opacity: fadeAnim, transform: [{ scale: inputScale }] },
              ]}
            >
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                <View style={styles.iconBox}>
                  <Ionicons 
                    name="person" 
                    size={scale(20)} 
                    color={isFocused ? '#000' : '#999'} 
                  />
                </View>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#BBB"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={20}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="words"
                />
              </View>
            </Animated.View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Begin Experience Button */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!canContinue}
                onPress={handleFinish}
                style={[
                  styles.primaryBtn,
                  !canContinue && styles.btnDisabled,
                ]}
              >
                <Text style={[styles.btnTxt, !canContinue && styles.btnTxtDisabled]}>
                  Begin Experience
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={scale(20)} 
                  color={canContinue ? '#FFF' : '#AAA'} 
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              <Text style={styles.hintText}>
                Tap "Begin Experience" to continue
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topDecoration: {
    position: 'absolute',
    top: -vs(80),
    right: -scale(60),
    width: scale(280),
    height: scale(280),
    borderRadius: scale(140),
    backgroundColor: '#F8F9FA',
    zIndex: -1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: scale(32),
    paddingTop: vs(30),
  },
  header: {
    marginBottom: vs(50),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: vs(20),
  },
  brandImg: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  brandTxt: {
    fontWeight: '900',
    fontSize: fs(18),
    letterSpacing: 1.5,
    color: '#000',
  },
  title: {
    fontSize: fs(38),
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.4,
    lineHeight: fs(44),
  },
  subtitle: {
    fontSize: fs(15.5),
    color: '#666',
    marginTop: vs(10),
    lineHeight: 24,
  },
  inputSection: {
    marginTop: vs(20),
  },
  fieldLabel: {
    fontSize: fs(10.5),
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: vs(68),
    borderWidth: 1.5,
    borderColor: '#F1F1F1',
  },
  inputFocused: {
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: fs(17),
    fontWeight: '600',
    color: '#111',
    paddingVertical: 0,
  },
  footer: {
    marginBottom: 30,
  },
  primaryBtn: {
    backgroundColor: '#000',
    height: vs(68),
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#F1F1F1',
  },
  btnTxt: {
    color: '#FFF',
    fontSize: fs(17),
    fontWeight: '700',
  },
  btnTxtDisabled: {
    color: '#AAA',
  },
  hintText: {
    textAlign: 'center',
    fontSize: fs(11.5),
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
});