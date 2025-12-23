import React, { useEffect, useState } from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import TranslatorStackNavigator from "@/navigation/TranslatorStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { useTheme } from "@/hooks/useTheme";
import RoleSelectionScreen from "@/screens/RoleSelectionScreen";

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStackNavigator />;
  }

  // User is authenticated but hasn't selected a role yet
  if (!role) {
    return <RoleSelectionScreen />;
  }

  // Show appropriate navigator based on role
  return role === "translator" ? <TranslatorStackNavigator /> : <RootStackNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Feather.font,
  });
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
        setAppIsReady(true);
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded || !appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <AuthProvider>
                <PaymentProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </PaymentProvider>
              </AuthProvider>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
