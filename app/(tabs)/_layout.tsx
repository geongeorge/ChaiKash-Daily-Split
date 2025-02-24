import { Tabs } from "expo-router";
import { useRouter } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { IconButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background
            paddingTop: 8,
            height: 88, // Ensure consistent height
          },
          default: {
            height: 64, // Standard height for Android
          },
        }),
        sceneStyle: {
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Split",
          headerRight: () => (
            <IconButton
              icon="cog"
              onPress={() => router.push("/settings")}
              style={{ marginRight: 8 }}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu Items",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
