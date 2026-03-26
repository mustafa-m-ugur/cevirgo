import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CategoriesScreen from '@/app';
import WheelScreen from '@/app/wheel';
import CreateWheelScreen from '@/app/create-wheel';

export type RootStackParamList = {
  Categories: undefined;
  Wheel: {
    name?: string;
    items?: string;
  };
  CreateWheel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Wheel" component={WheelScreen} />
      <Stack.Screen name="CreateWheel" component={CreateWheelScreen} />
    </Stack.Navigator>
  );
}

