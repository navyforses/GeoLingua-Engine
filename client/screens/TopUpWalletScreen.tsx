import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { usePayment } from "@/contexts/PaymentContext";
import { formatCurrency } from "@/lib/stripe";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

// Note: Stripe React Native is disabled for Expo Go compatibility
// For production builds, uncomment the Stripe imports and implementation

export default function TopUpWalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { walletBalance } = usePayment();

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* Current Balance */}
        <Card elevation={1} style={styles.balanceCard}>
          <ThemedText
            style={[styles.balanceLabel, { color: theme.textSecondary }]}
          >
            Current Balance
          </ThemedText>
          <ThemedText type="h1" style={styles.balanceAmount}>
            {formatCurrency(walletBalance?.amount || 0)}
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="plus-circle" size={48} color={theme.primary} />
            </View>
          </View>

          <ThemedText style={styles.title}>
            საფულის შევსება
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Top Up Wallet
          </ThemedText>

          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
            ეს ფუნქცია მოითხოვს Stripe-ის ინტეგრაციას და ხელმისაწვდომია მხოლოდ პროდაქშენ ბილდში.
          </ThemedText>
          
          <ThemedText style={[styles.messageEn, { color: theme.textSecondary }]}>
            This feature requires Stripe integration and is available in production builds only.
          </ThemedText>

          {Platform.OS !== "web" && (
            <View style={[styles.badge, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="info" size={16} color={theme.primary} />
              <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                Expo Go Preview Mode
              </ThemedText>
            </View>
          )}
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    letterSpacing: -1,
  },
  card: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.h4,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  message: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  messageEn: {
    ...Typography.small,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  badgeText: {
    ...Typography.small,
  },
});
