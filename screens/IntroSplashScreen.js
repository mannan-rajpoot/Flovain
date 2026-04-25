import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

const IntroSplashScreen = ({ onFinish }) => {
  const iconScale     = useRef(new Animated.Value(0.4)).current;
  const iconOpacity   = useRef(new Animated.Value(0)).current;
  const iconTranslateX = useRef(new Animated.Value(0)).current;

  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textScale     = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Icon pops in from centre
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1.3,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // 2. Hold for a beat
      Animated.delay(800),

      // 3. Icon slides left, text slides in from right — simultaneously
      Animated.parallel([
        Animated.timing(iconTranslateX, {
          toValue: -65,
          duration: 1000,
          easing: Easing.bezier(0.19, 1, 0.22, 1),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.bezier(0.19, 1, 0.22, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 50,
          duration: 1000,
          easing: Easing.bezier(0.19, 1, 0.22, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),

      // 4. Hold before handing off
      Animated.delay(1500),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>

        {/* Logo icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: iconOpacity,
              transform: [
                { scale: iconScale },
                { translateX: iconTranslateX },
              ],
            },
          ]}
        >
          <Animated.Image
            source={require('../assets/flovain-intro.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Animated.View
          style={[
            styles.textWrapper,
            {
              opacity: textOpacity,
              transform: [
                { translateX: textTranslateX },
                { scale: textScale },
              ],
            },
          ]}
        >
          <Text style={styles.appName}>Flovain</Text>
        </Animated.View>

      </View>

      {/* Footer indicator fades in alongside the text */}
      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <View style={styles.indicator} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    position: 'absolute',
    justifyContent: 'center',
  },
  appName: {
    color: '#000000',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
    fontFamily: 'System',
    right: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  indicator: {
    width: 32,
    height: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    opacity: 0.1,
  },
});

export default IntroSplashScreen;