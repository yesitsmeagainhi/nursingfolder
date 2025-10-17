// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExplorerScreen from './src/screens/ExplorerScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import CourseDetailsScreen from './src/screens/CourseDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />

        {/* Main */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Explorer" component={ExplorerScreen} options={({ route }) => ({ title: route.params?.title || 'Explorer' })} />
        <Stack.Screen name="Viewer" component={ViewerScreen} options={({ route }) => ({ title: route.params?.title || 'Viewer' })} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
