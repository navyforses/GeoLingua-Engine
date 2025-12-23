import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TranslatorTabNavigator from "./TranslatorTabNavigator";
import CallScreen from "@/screens/CallScreen";
import RatingScreen from "@/screens/RatingScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useTheme } from "@/hooks/useTheme";

export type TranslatorStackParamList = {
  TranslatorTabs: undefined;
  TranslatorCall: {
    requestId: string;
    clientName: string;
    fromLanguage: string;
    toLanguage: string;
    category: string;
    pricePerMinute: number;
    roomId?: string;
  };
  Rating: {
    translatorName?: string;
    translatorId?: string;
    clientName?: string;
    clientId?: string;
    duration: number;
    totalPrice: number;
  };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<TranslatorStackParamList>();

export default function TranslatorStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.backgroundRoot },
      }}
    >
      <Stack.Screen name="TranslatorTabs" component={TranslatorTabNavigator} />
      <Stack.Screen
        name="TranslatorCall"
        component={CallScreen}
        options={{
          gestureEnabled: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
