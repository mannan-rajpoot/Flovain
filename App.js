import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import IntroSplashScreen from './screens/IntroSplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    // This is where you would normally navigate to Home or Login
    // For now, we will keep it simple as requested.
    console.log("Animation Finished");
    // setShowSplash(false); 
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {showSplash ? (
        <IntroSplashScreen onFinish={handleSplashFinish} />
      ) : (
        /* This part is hidden until showSplash is false */
        <View style={styles.mainApp}>
          {/* Main App Content Goes Here */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainApp: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
});