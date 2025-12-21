import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import PaymentMethodsScreen from "@/screens/PaymentMethodsScreen";
import AddCardScreen from "@/screens/AddCardScreen";
import TopUpWalletScreen from "@/screens/TopUpWalletScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
  AddCard: undefined;
  TopUpWallet: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: "Profile" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: "Settings" }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ headerTitle: "Payment Methods" }}
      />
      <Stack.Screen
        name="AddCard"
        component={AddCardScreen}
        options={{ headerTitle: "Add Card" }}
      />
      <Stack.Screen
        name="TopUpWallet"
        component={TopUpWalletScreen}
        options={{ headerTitle: "Top Up Wallet" }}
      />
    </Stack.Navigator>
  );
}
