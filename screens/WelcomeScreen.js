import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  PixelRatio,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Scale relative to a 390-pt baseline (iPhone 14 logical width)
const scale = (size) => (SCREEN_W / 390) * size;

// Scale fonts with PixelRatio capping to avoid huge text on tablets
const fs = (size) => {
  const scaled = scale(size);
  const maxScale = 1.25; // cap at 125 % of base size
  return Math.min(scaled, size * maxScale);
};

// Vertical scale relative to a 844-pt baseline (iPhone 14 height)
const vs = (size) => (SCREEN_H / 844) * size;

// Clamp helper
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
// ─────────────────────────────────────────────────────────────────────────────

const BAR_DATA = [40, 70, 45, 90, 65, 80, 95];

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(vs(30))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 22,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Dynamic bar height scaled to available card space
  const barAreaH = clamp(vs(100), 70, 130);
  const barW = Math.floor((SCREEN_W - scale(140)) / BAR_DATA.length);

  // Footer height so ScrollView padding is always correct
  const footerH = clamp(vs(130), 110, 160) + insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* BACKGROUND DECORATION */}
      <View
        style={[
          styles.bgCircle,
          {
            width: scale(300),
            height: scale(300),
            borderRadius: scale(150),
            top: -scale(150),
            right: -scale(100),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footerH + vs(20) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never" // Android: removes grey overscroll glow
      >
        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/flovain-intro.png')}
            style={[styles.headerIcon, { width: scale(26), height: scale(26) }]}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { fontSize: fs(18) }]}>Flovain</Text>
        </Animated.View>

        {/* HERO SECTION */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}
        >
          <Text style={[styles.kicker, { fontSize: fs(11) }]}>
            The Art of Consistency
          </Text>
          <Text style={[styles.title, { fontSize: fs(40), lineHeight: fs(46) }]}>
           Build habits that change your life.
          </Text>
          <Text style={[styles.subtitle, { fontSize: fs(16), lineHeight: fs(25) }]}>
            Small habits create powerful results.
            Track your progress, stay consistent, and grow every day with Flovain.
          </Text>
        </Animated.View>

        {/* PROGRESS VISUAL */}
        <Animated.View style={[styles.visualContainer, { opacity: fadeAnim, marginTop: vs(36) }]}>
          <View style={[styles.visualCard, { padding: scale(20), borderRadius: scale(24) }]}>
            <Text style={[styles.visualLabel, { fontSize: fs(12) }]}>
              Weekly Growth
            </Text>
            <View style={[styles.barContainer, { height: barAreaH }]}>
              {BAR_DATA.map((h, i) => {
                const barH = (h / 100) * barAreaH;
                return (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        width: barW,
                        borderRadius: scale(6),
                        backgroundColor: i === BAR_DATA.length - 1 ? '#8B5CF6' : '#E5E7EB',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* FIXED FOOTER ACTION */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            paddingBottom: insets.bottom > 0 ? insets.bottom : vs(32),
            paddingHorizontal: scale(26),
            paddingTop: vs(14),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.primaryButton,
            { height: clamp(vs(60), 52, 68), borderRadius: scale(18) },
          ]}
          onPress={() => console.log('Get Started')}
        >
          <Text style={[styles.buttonText, { fontSize: fs(17) }]}>
            Get Started
          </Text>
        </TouchableOpacity>
        <Text style={[styles.termsText, { fontSize: fs(12), marginTop: vs(16) }]}>
          Build your best self, one day at a time.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

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
  scrollContent: {
    paddingHorizontal: scale(28),
    paddingTop: vs(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(36),
  },
  headerIcon: {
    marginRight: scale(8),
  },
  brandName: {
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    right: 5
  },
  kicker: {
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: vs(10),
  },
  title: {
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: '#666',
    marginTop: vs(18),
    fontWeight: '400',
  },
  visualContainer: {
    width: '100%',
  },
  visualCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  visualLabel: {
    fontWeight: '700',
    color: '#999',
    marginBottom: vs(14),
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    // width/height/borderRadius/backgroundColor set inline for responsiveness
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  termsText: {
    textAlign: 'center',
    color: '#AAA',
    fontWeight: '500',
  },
});

export default WelcomeScreen;