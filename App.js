import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import IntroSplashScreen from './screens/IntroSplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  // Two independent opacity anims — cross-fade without unmounting
  const introOpacity = useRef(new Animated.Value(1)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;

  const handleFinishIntro = () => {
    // Mount WelcomeScreen first (already mounted but invisible),
    // then cross-fade so Android never sees a blank frame
    setShowWelcome(true);

    Animated.sequence([
      // Small delay to let WelcomeScreen finish its first paint
      Animated.delay(50),
      Animated.parallel([
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <SafeAreaProvider>
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* WelcomeScreen sits below — rendered early so no paint lag */}
      {showWelcome && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: welcomeOpacity }]}>
          <WelcomeScreen />
        </Animated.View>
      )}

      {/* IntroSplashScreen fades out on top */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: introOpacity }]}>
        <IntroSplashScreen onFinish={handleFinishIntro} />
      </Animated.View>
    </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});