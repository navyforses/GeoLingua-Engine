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

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { signUp, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const { error, needsConfirmation } = await signUp(
      email,
      password,
      name.trim(),
    );

    if (error) {
      Alert.alert(
        "Registration Failed",
        error.message || "An error occurred during registration",
      );
    } else if (needsConfirmation) {
      Alert.alert(
        "Check Your Email",
        "We've sent you a confirmation email. Please click the link to verify your account.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ],
      );
    }
  };

  const handleSignIn = () => {
    navigation.navigate("Login");
  };

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
              styles.backButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h2" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign up to get started with GeoLingua
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Full Name
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: errors.name ? theme.error : "transparent",
                },
              ]}
            >
              <Feather
                name="user"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {errors.name && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.name}
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Email
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: errors.email ? theme.error : "transparent",
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
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.email}
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Password
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: errors.password ? theme.error : "transparent",
                },
              ]}
            >
              <Feather
                name="lock"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Create a password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            {errors.password && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.password}
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Confirm Password
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: errors.confirmPassword
                    ? theme.error
                    : "transparent",
                },
              ]}
            >
              <Feather
                name="lock"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            {errors.confirmPassword && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.confirmPassword}
              </ThemedText>
            )}
          </View>

          <Pressable
            style={styles.termsContainer}
            onPress={() => {
              setAcceptedTerms(!acceptedTerms);
              setErrors((prev) => ({ ...prev, terms: undefined }));
            }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: acceptedTerms
                    ? theme.primary
                    : theme.backgroundSecondary,
                  borderColor: errors.terms ? theme.error : theme.border,
                },
              ]}
            >
              {acceptedTerms && <Feather name="check" size={14} color="#fff" />}
            </View>
            <ThemedText
              style={[styles.termsText, { color: theme.textSecondary }]}
            >
              I agree to the{" "}
              <ThemedText style={{ color: theme.primary }}>
                Terms of Service
              </ThemedText>{" "}
              and{" "}
              <ThemedText style={{ color: theme.primary }}>
                Privacy Policy
              </ThemedText>
            </ThemedText>
          </Pressable>
          {errors.terms && (
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {errors.terms}
            </ThemedText>
          )}

          <Button
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Create Account"
            )}
          </Button>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.textSecondary }}>
            Already have an account?{" "}
          </ThemedText>
          <Pressable onPress={handleSignIn}>
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
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
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
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  termsText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
  registerButton: {
    height: 52,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
