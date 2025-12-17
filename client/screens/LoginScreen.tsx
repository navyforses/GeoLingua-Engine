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

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { signIn, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert(
        "Login Failed",
        error.message || "An error occurred during login",
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("Register");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View
            style={[styles.logoContainer, { backgroundColor: theme.primary }]}
          >
            <Feather name="globe" size={40} color="#fff" />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Welcome Back
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to continue to GeoLingua
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
                placeholder="Enter your password"
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

          <Pressable
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <ThemedText
              style={[styles.forgotPasswordText, { color: theme.primary }]}
            >
              Forgot Password?
            </ThemedText>
          </Pressable>

          <Button
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Sign In"
            )}
          </Button>
        </View>

        <View style={styles.divider}>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.border }]}
          />
          <ThemedText
            style={[styles.dividerText, { color: theme.textSecondary }]}
          >
            or continue with
          </ThemedText>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.border }]}
          />
        </View>

        <View style={styles.socialButtons}>
          <Pressable
            style={[
              styles.socialButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            disabled={isLoading}
          >
            <Feather name="github" size={24} color={theme.text} />
          </Pressable>
          <Pressable
            style={[
              styles.socialButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            disabled={isLoading}
          >
            <ThemedText style={styles.googleIcon}>G</ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.socialButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            disabled={isLoading}
          >
            <Feather name="smartphone" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.textSecondary }}>
            {"Don't have an account? "}
          </ThemedText>
          <Pressable onPress={handleSignUp}>
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
              Sign Up
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
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    ...Typography.small,
    fontWeight: "600",
  },
  loginButton: {
    height: 52,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.small,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
