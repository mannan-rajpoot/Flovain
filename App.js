import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  Platform,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import IntroSplashScreen from './screens/IntroSplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const DURATION = 350;

const SCREEN_ORDER = ['intro', 'welcome', 'setup', 'home'];

export default function App() {
  const [screenStack, setScreenStack] = useState(['intro']);
  const [userData, setUserData] = useState(null);
  const isAnimating = useRef(false);

  // We keep ALL visited screens mounted but only show current + next
  // translateX for each screen — keyed by name
  const positions = useRef({
    intro:   new Animated.Value(0),
    welcome: new Animated.Value(SCREEN_W),
    setup:   new Animated.Value(SCREEN_W),
    home:    new Animated.Value(SCREEN_W),
  }).current;

  const navigate = (toScreen, data) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    if (data) setUserData(data);

    const fromScreen = screenStack[screenStack.length - 1];

    // Make sure destination is already at SCREEN_W (offscreen right)
    positions[toScreen].setValue(SCREEN_W);

    // Add to stack so it renders
    setScreenStack(prev => [...prev, toScreen]);

    // Wait 2 frames for Android to render the new screen before animating
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

  const screens = {
    intro:   <IntroSplashScreen onFinish={() => navigate('welcome')} />,
    welcome: <WelcomeScreen onGetStarted={() => navigate('setup')} />,
    setup:   <SetupScreen onFinish={(d) => navigate('home', d)} />,
    home:    <HomeScreen userData={userData} />,
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        {SCREEN_ORDER.map((name) => {
          const inStack = screenStack.includes(name);
          if (!inStack) return null;
          return (
            <Animated.View
              key={name}
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: positions[name] }] },
              ]}
            >
              {screens[name]}
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
});