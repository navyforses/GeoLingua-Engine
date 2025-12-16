import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchScreen from "@/screens/SearchScreen";
import TranslatorDetailScreen from "@/screens/TranslatorDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SearchStackParamList = {
  Search: undefined;
  TranslatorDetail: { translatorId: string };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerTitle: "Find Translators" }}
      />
      <Stack.Screen
        name="TranslatorDetail"
        component={TranslatorDetailScreen}
        options={{ headerTitle: "Translator" }}
      />
    </Stack.Navigator>
  );
}
