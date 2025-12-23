import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { setRole, user } = useAuth();

  const userName = user?.user_metadata?.name || "User";

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
            <Feather name="globe" size={40} color="#fff" />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Welcome, {userName}!
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            How would you like to use GeoLingua?
          </ThemedText>
        </View>

        {/* Role Options */}
        <View style={styles.options}>
          {/* Client Option */}
          <Pressable
            onPress={() => setRole("client")}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: pressed
                  ? theme.backgroundSecondary
                  : theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="user" size={32} color={theme.primary} />
            </View>
            <ThemedText type="h4" style={styles.optionTitle}>
              I need a translator
            </ThemedText>
            <ThemedText
              style={[styles.optionDescription, { color: theme.textSecondary }]}
            >
              Connect with professional translators for real-time video calls
            </ThemedText>
            <View style={styles.optionFeatures}>
              <Feature icon="video" text="Video calls" theme={theme} />
              <Feature icon="globe" text="Multiple languages" theme={theme} />
              <Feature icon="clock" text="24/7 availability" theme={theme} />
            </View>
            <View
              style={[styles.selectButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.selectButtonText}>
                Continue as Client
              </ThemedText>
              <Feather name="arrow-right" size={18} color="#fff" />
            </View>
          </Pressable>

          {/* Translator Option */}
          <Pressable
            onPress={() => setRole("translator")}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: pressed
                  ? theme.backgroundSecondary
                  : theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: theme.secondary + "20" },
              ]}
            >
              <Feather name="headphones" size={32} color={theme.secondary} />
            </View>
            <ThemedText type="h4" style={styles.optionTitle}>
              I am a translator
            </ThemedText>
            <ThemedText
              style={[styles.optionDescription, { color: theme.textSecondary }]}
            >
              Earn money by providing translation services to clients worldwide
            </ThemedText>
            <View style={styles.optionFeatures}>
              <Feature icon="dollar-sign" text="Earn money" theme={theme} />
              <Feature icon="calendar" text="Flexible hours" theme={theme} />
              <Feature icon="trending-up" text="Grow your career" theme={theme} />
            </View>
            <View
              style={[styles.selectButton, { backgroundColor: theme.secondary }]}
            >
              <ThemedText style={styles.selectButtonText}>
                Continue as Translator
              </ThemedText>
              <Feather name="arrow-right" size={18} color="#fff" />
            </View>
          </Pressable>
        </View>

        <ThemedText style={[styles.switchNote, { color: theme.textTertiary }]}>
          You can switch roles anytime from the app settings
        </ThemedText>
      </View>
    </ThemedView>
  );
}

interface FeatureProps {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  theme: any;
}

function Feature({ icon, text, theme }: FeatureProps) {
  return (
    <View style={styles.feature}>
      <Feather name={icon} size={14} color={theme.textSecondary} />
      <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
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
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  options: {
    flex: 1,
    gap: Spacing.lg,
  },
  optionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  optionTitle: {
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    ...Typography.small,
    marginBottom: Spacing.md,
  },
  optionFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    ...Typography.small,
    marginLeft: Spacing.xs,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  selectButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  switchNote: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
