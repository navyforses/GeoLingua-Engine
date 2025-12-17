import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    const { error: resetError } = await resetPassword(email);
    setIsLoading(false);

    if (resetError) {
      Alert.alert(
        "Error",
        resetError.message || "Failed to send reset email. Please try again.",
      );
    } else {
      setEmailSent(true);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  if (emailSent) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + Spacing["3xl"],
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.successContainer}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="mail" size={48} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={styles.successTitle}>
              Check Your Email
            </ThemedText>
            <ThemedText
              style={[styles.successText, { color: theme.textSecondary }]}
            >
              {"We've sent a password reset link to"}
              {"\n"}
              <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
                {email}
              </ThemedText>
            </ThemedText>
            <ThemedText
              style={[styles.successHint, { color: theme.textSecondary }]}
            >
              {"Didn't receive the email? Check your spam folder or try again."}
            </ThemedText>
            <Button onPress={handleBackToLogin} style={styles.backButton}>
              Back to Sign In
            </Button>
            <Pressable
              onPress={() => setEmailSent(false)}
              style={styles.tryAgainButton}
            >
              <ThemedText style={{ color: theme.primary }}>
                Try another email
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            style={[
              styles.headerBackButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h2" style={styles.title}>
            Forgot Password?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {
              "No worries! Enter your email address and we'll send you a link to reset your password."
            }
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Email
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: error ? theme.error : "transparent",
                },
              ]}
            >
              <Feather
                name="mail"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {error && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {error}
              </ThemedText>
            )}
          </View>

          <Button
            onPress={handleResetPassword}
            disabled={isLoading}
            style={styles.resetButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.textSecondary }}>
            Remember your password?{" "}
          </ThemedText>
          <Pressable onPress={handleBackToLogin}>
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing["3xl"],
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: "100%",
  },
  errorText: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  resetButton: {
    height: 52,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  successTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  successHint: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  backButton: {
    width: "100%",
    height: 52,
    marginBottom: Spacing.lg,
  },
  tryAgainButton: {
    padding: Spacing.sm,
  },
});
