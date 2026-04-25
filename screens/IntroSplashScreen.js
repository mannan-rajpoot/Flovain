import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

const IntroSplashScreen = ({ onFinish }) => {
  // Animation Controller Values
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconTranslateX = useRef(new Animated.Value(0)).current;
  
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(20)).current; 
  const textScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      // PHASE 1: Impact Entry (Icon pops in)
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(700), // Cinematic pause

      // PHASE 2: The "Split" Reveal (Icon moves left, Text appears right)
      Animated.parallel([
        Animated.timing(iconTranslateX, {
          toValue: -80, // Moved slightly more for longer name "Flovain"
          duration: 900,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 45, 
          duration: 900,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        })
      ]),
      
      Animated.delay(1500), // Show the final logo for 1.5s
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Set status bar to light because background is black */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.contentWrapper}>
        {/* ICON */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: iconOpacity,
              transform: [
                { scale: iconScale },
                { translateX: iconTranslateX }
              ],
            },
          ]}
        >
          {/* Ensure you have an image at this path or update the name */}
          <Animated.Image
            source={require('../assets/icon.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* TEXT */}
        <Animated.View
          style={[
            styles.textWrapper,
            {
              opacity: textOpacity,
              transform: [
                { translateX: textTranslateX },
                { scale: textScale }
              ],
            },
          ]}
        >
          <Text style={styles.appName}>Flovain</Text>
        </Animated.View>
      </View>

      {/* FOOTER INDICATOR */}
      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <View style={styles.indicator} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Premium Dark Background
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 200,
    height: 200,
  },
  textWrapper: {
    position: 'absolute',
    justifyContent: 'center',
  },
  appName: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontFamily: 'System', 
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  indicator: {
    width: 35,
    height: 4,
    backgroundColor: '#8B5CF6', // Purple accent
    borderRadius: 10,
  }
});

export default IntroSplashScreen;