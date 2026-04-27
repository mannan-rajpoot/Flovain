import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions, Platform, UIManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import IntroSplashScreen from './screens/IntroSplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const DURATION = 350;
const SCREEN_ORDER = ['intro', 'welcome', 'setup', 'home'];
const STORAGE_KEY = '@user_data';

export default function App() {
  const [screenStack, setScreenStack] = useState(['intro']);
  const [userData, setUserData] = useState(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const isAnimating = useRef(false);

  const positions = useRef({
    intro:   new Animated.Value(0),
    welcome: new Animated.Value(SCREEN_W),
    setup:   new Animated.Value(SCREEN_W),
    home:    new Animated.Value(SCREEN_W),
  }).current;

  // Check storage on boot
  useEffect(() => {
    const checkUser = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setUserData(JSON.parse(savedData));
          setIsFirstLaunch(false);
        }
      } catch (e) {
        console.log("Error loading data", e);
      }
    };
    checkUser();
  }, []);

  const navigate = (toScreen, data) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    if (data) setUserData(data);

    const fromScreen = screenStack[screenStack.length - 1];
    positions[toScreen].setValue(SCREEN_W);
    setScreenStack(prev => [...prev, toScreen]);

    const run = () => {
      Animated.parallel([
        Animated.timing(positions[fromScreen], {
          toValue: -SCREEN_W * 0.3,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(positions[toScreen], {
          toValue: 0,
          duration: DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  };

  const handleSetupFinish = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setUserData(data);
      navigate('home');
    } catch (e) {
      console.log("Error saving data", e);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setUserData(null);
      setIsFirstLaunch(true);
      // Reset animations and stack
      Object.keys(positions).forEach(key => {
        positions[key].setValue(key === 'intro' ? 0 : SCREEN_W);
      });
      setScreenStack(['intro']);
    } catch (e) {
      console.log("Error clearing data", e);
    }
  };

  const screens = {
    intro: <IntroSplashScreen onFinish={() => navigate(isFirstLaunch ? 'welcome' : 'home')} />,
    welcome: <WelcomeScreen onGetStarted={() => navigate('setup')} />,
    setup: <SetupScreen onFinish={handleSetupFinish} />,
    home: <HomeScreen userData={userData} onLogout={clearAllData} />,
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        {SCREEN_ORDER.map((name) => {
          if (!screenStack.includes(name)) return null;
          return (
            <Animated.View key={name} style={[StyleSheet.absoluteFill, { transform: [{ translateX: positions[name] }] }]}>
              {screens[name]}
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff', overflow: 'hidden' },
});