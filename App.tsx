// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ExplorerScreen from './src/screens/ExplorerScreen';
import ViewerScreen from './src/screens/ViewerScreen'; // ← NEW

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="Explorer" component={ExplorerScreen} options={{ title: 'Explorer' }} />
        <Stack.Screen
          name="Viewer"
          component={ViewerScreen}
          options={({ route }) => ({ title: route?.params?.title || 'Viewer' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
