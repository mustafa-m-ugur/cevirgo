import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppNavigator } from '@/navigation/AppNavigator';

export default function App() {
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppNavigator />
    </NavigationContainer>
  );
}

