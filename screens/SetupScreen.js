import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  TextInput, Platform, Keyboard, TouchableWithoutFeedback, Image,
  StatusBar, KeyboardAvoidingView, Pressable
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Responsive utility functions
const scale = (size) => (SCREEN_W / 390) * size;
const fs = (size) => Math.min((SCREEN_W / 390) * size, size * 1.1);
const vs = (size) => (SCREEN_H / 844) * size;

export default function SetupScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const inputScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Smooth Staggered Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(inputScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Validation: Button only becomes active if name is 2+ characters
  const canContinue = username.trim().length >= 2;

  const handleFinish = () => {
    // Strict check: will not execute onFinish if validation fails
    if (!canContinue) return;

    Keyboard.dismiss();
    
    // This triggers the transition to the Home Screen in your App.js logic
    onFinish({ 
      username: username.trim(), 
      goals: ['productivity'] // Default goal to initialize home screen data
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          
          {/* Top Design Decoration */}
          <View style={styles.topDecoration} />

          <View style={styles.inner}>
            
            {/* BRAND HEADER */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
              <View style={styles.brandRow}>
                <Image source={require('../assets/flovain-intro.png')} style={styles.brandImg} />
                <Text style={styles.brandTxt}>FLOVAIN</Text>
              </View>
              <Text style={styles.title}>Your Name</Text>
              <Text style={styles.subtitle}>
                Consistency starts with identity. Tell us how to address you.
              </Text>
            </Animated.View>

            {/* RESPONSIVE INPUT FIELD */}
            <Animated.View 
              style={[
                styles.inputSection, 
                { opacity: fadeAnim, transform: [{ scale: inputScale }] }
              ]}
            >
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <Pressable 
                onPress={() => inputRef.current?.focus()}
                style={({ pressed }) => [
                  styles.inputWrapper, 
                  isFocused && styles.inputFocused,
                  pressed && { opacity: 0.98 }
                ]}
              >
                <View style={[styles.iconBox, isFocused && { backgroundColor: '#000' }]}>
                  <Ionicons 
                    name="person-sharp" 
                    size={scale(18)} 
                    color={isFocused ? "#FFF" : "#A1A1AA"} 
                  />
                </View>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#CCC"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={18}
                  returnKeyType="done"
                  onSubmitEditing={handleFinish} // Allows keyboard "Done" to finish if valid
                  autoCorrect={false}
                  autoCapitalize="words"
                />
              </Pressable>
            </Animated.View>

            {/* Spacer to push button to bottom */}
            <View style={{ flex: 1 }} />

            {/* FOOTER ACTION */}
            <Animated.View 
              style={[
                styles.footer, 
                { opacity: fadeAnim },
                { marginBottom: Math.max(insets.bottom, 20) }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!canContinue}
                onPress={handleFinish}
                style={[
                  styles.primaryBtn, 
                  !canContinue && styles.btnDisabled
                ]}
              >
                <Text style={[styles.btnTxt, !canContinue && { color: '#A1A1AA' }]}>
                  Begin Experience
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={scale(20)} 
                  color={canContinue ? "#FFF" : "#A1A1AA"} 
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
              <Text style={styles.hintText}>Tap continue to save your profile and start.</Text>
            </Animated.View>

          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topDecoration: { 
    position: 'absolute', top: -vs(50), right: -scale(30), 
    width: scale(200), height: scale(200), borderRadius: 100, 
    backgroundColor: '#FAFAFA', zIndex: -1 
  },
  inner: { flex: 1, paddingHorizontal: scale(32), paddingTop: vs(20) },
  header: { marginTop: vs(10) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: vs(15) },
  brandImg: { width: 22, height: 22, resizeMode: 'contain' },
  brandTxt: { fontWeight: '900', fontSize: fs(12), letterSpacing: 2, color: '#000' , right: '7' },
  title: { fontSize: fs(42), fontWeight: '900', color: '#111', letterSpacing: -1.5 },
  subtitle: { fontSize: fs(15), color: '#666', fontWeight: '500', marginTop: vs(8), lineHeight: 22 },
  inputSection: { marginTop: vs(60) },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#BBB', letterSpacing: 1.5, marginBottom: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 10,
    height: vs(72),
    borderWidth: 1.5,
    borderColor: '#F1F1F1',
    gap: 15,
  },
  inputFocused: { 
    borderColor: '#000', 
    backgroundColor: '#FFF',
    elevation: 6, // Crisp Android Shadow
    shadowColor: '#000',
    shadowOpacity: 0.08, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 10 }
  },
  iconBox: { 
    width: 40, height: 40, borderRadius: 14, 
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' 
  },
  textInput: { 
    flex: 1, 
    fontSize: fs(17), 
    fontWeight: '700', 
    color: '#000', 
    height: '100%',
    paddingRight: 10
  },
  footer: { marginTop: 20 },
  primaryBtn: {
    backgroundColor: '#000',
    height: vs(70),
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 10 }
  },
  btnDisabled: { backgroundColor: '#F3F4F6', elevation: 0 },
  btnTxt: { color: '#FFF', fontSize: fs(17), fontWeight: '800' },
  hintText: { textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#DDD', marginTop: 18 }
});