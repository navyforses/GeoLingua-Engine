import React from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import TranslatorDashboardScreen from "@/screens/translator/TranslatorDashboardScreen";
import TranslatorEarningsScreen from "@/screens/translator/TranslatorEarningsScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import TranslatorProfileScreen from "@/screens/translator/TranslatorProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

export type TranslatorTabParamList = {
  Dashboard: undefined;
  Earnings: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TranslatorTabParamList>();

export default function TranslatorTabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom + Spacing.xs,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          ...Typography.tiny,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TranslatorDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={TranslatorEarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="dollar-sign" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={TranslatorProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
