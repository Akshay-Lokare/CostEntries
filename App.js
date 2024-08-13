import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from './screens/Home';
import CalculatorScreen from './screens/Calculator';

const Tab = createBottomTabNavigator();

// Main App component with Tab.Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Calculator') {
              iconName = 'calculate';
            } 

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#8E24AA',
          tabBarInactiveTintColor: '#3D0A4A',
          headerShown: false
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calculator" component={CalculatorScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}