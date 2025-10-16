// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ExplorerScreen from './src/screens/ExplorerScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import CourseDetailsScreen from './src/screens/CourseDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* --- THIS IS THE FIXED LINE --- */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }} // ← HIDE THE DEFAULT HEADER
        />
        
        <Stack.Screen
          name="Explorer"
          component={ExplorerScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="CourseDetails"
          component={CourseDetailsScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="Viewer"
          component={ViewerScreen}
          options={({ route }) => ({ title: route?.params?.title || 'Viewer' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}