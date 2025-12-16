import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import MatchingScreen from "@/screens/MatchingScreen";
import CallScreen from "@/screens/CallScreen";
import RatingScreen from "@/screens/RatingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Matching: {
    fromLang: string;
    toLang: string;
    category: string;
    type: "instant" | "scheduled";
  };
  Call: {
    translatorName: string;
    translatorId: string;
    category: string;
    pricePerMinute: number;
  };
  Rating: {
    translatorName: string;
    translatorId: string;
    duration: number;
    totalPrice: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Matching"
        component={MatchingScreen}
        options={{
          presentation: "modal",
          headerTitle: "Finding Translator...",
        }}
      />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          presentation: "modal",
          headerTitle: "Rate Your Experience",
        }}
      />
    </Stack.Navigator>
  );
}
