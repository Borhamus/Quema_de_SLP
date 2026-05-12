import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

const C = {
  bg: "#000",
  red: "#ff0033",
  redDim: "#5a1a25",
  amber: "#ffb300",
  parchment: "#f6e6c2",
  bar: "#0a0000",
  border: "#1a0008",
};

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: C.red,
          tabBarInactiveTintColor: C.redDim,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.bar,
            borderTopWidth: 2,
            borderTopColor: C.red,
            height: 64,
            paddingTop: 6,
            paddingBottom: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1.2,
            fontWeight: "700",
            textTransform: "uppercase",
            marginTop: 2,
          },
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "HOME",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="game-controller" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="milestone"
          options={{
            title: "GOAL",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flag" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "1P",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="swap"
          options={{
            title: "SWAP",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="special"
          options={{
            title: "BOSS",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="skull" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
