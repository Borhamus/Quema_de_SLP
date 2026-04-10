import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native'; 

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#935f17' }}>
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0A7EA4',
          tabBarInactiveTintColor: '#888',
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: '#121212', 
            borderTopWidth: 1,
            borderTopColor: '#333',
          },
        }}
      >
        
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
        <Tabs.Screen name="milestone" options={{ title: 'Milestone', tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
        <Tabs.Screen name="swap" options={{ title: 'Swap', tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal" size={size} color={color} /> }} />
        <Tabs.Screen name="special" options={{ title: 'Especial', tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} /> }} />

      </Tabs>

    </View> 
  );
}