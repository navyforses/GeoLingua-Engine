import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useStripe } from "@stripe/stripe-react-native";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { usePayment } from "@/contexts/PaymentContext";
import { formatCurrency } from "@/lib/stripe";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const PRESET_AMOUNTS = [10, 20, 50, 100];

export default function TopUpWalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { confirmPayment } = useStripe();
  const {
    walletBalance,
    paymentMethods,
    defaultPaymentMethodId,
    topUpWallet,
    fetchWalletBalance,
  } = usePayment();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [isLoading, setIsLoading] = useState(false);

  const defaultCard = paymentMethods.find(
    (m) => m.id === defaultPaymentMethodId,
  );

  const handleTopUp = async () => {
    if (!selectedAmount) {
      Alert.alert("Select Amount", "Please select an amount to top up");
      return;
    }

    if (!defaultCard) {
      Alert.alert("No Payment Method", "Please add a payment method first", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Card",
          onPress: () => navigation.navigate("AddCard" as never),
        },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      // Create payment intent
      const { clientSecret, error: intentError } =
        await topUpWallet(selectedAmount);

      if (intentError || !clientSecret) {
        Alert.alert("Error", intentError || "Failed to create payment");
        setIsLoading(false);
        return;
      }

      // Confirm payment
      const { error: paymentError } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          paymentMethodId: defaultPaymentMethodId!,
        },
      });

      if (paymentError) {
        Alert.alert("Payment Failed", paymentError.message);
      } else {
        await fetchWalletBalance();
        Alert.alert(
          "Success",
          `${formatCurrency(selectedAmount)} has been added to your wallet`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      }
    } catch (error) {
      console.error("Top up error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
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

        {/* Amount Selection */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Select Amount
          </ThemedText>
          <View style={styles.amountGrid}>
            {PRESET_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={[
                  styles.amountButton,
                  {
                    backgroundColor:
                      selectedAmount === amount
                        ? theme.primary
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedAmount === amount ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedAmount(amount)}
              >
                <ThemedText
                  style={[
                    styles.amountText,
                    {
                      color: selectedAmount === amount ? "#fff" : theme.text,
                    },
                  ]}
                >
                  {formatCurrency(amount)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Payment Method
          </ThemedText>
          {defaultCard ? (
            <Card elevation={1} style={styles.cardPreview}>
              <View style={styles.cardInfo}>
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name="credit-card" size={20} color={theme.text} />
                </View>
                <View style={styles.cardDetails}>
                  <ThemedText style={styles.cardBrand}>
                    •••• {defaultCard.card.last4}
                  </ThemedText>
                  <ThemedText
                    style={[styles.cardExpiry, { color: theme.textSecondary }]}
                  >
                    Expires {defaultCard.card.expMonth}/
                    {defaultCard.card.expYear}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                style={styles.changeButton}
                onPress={() => navigation.navigate("PaymentMethods" as never)}
              >
                <ThemedText style={{ color: theme.primary }}>Change</ThemedText>
              </Pressable>
            </Card>
          ) : (
            <Card elevation={1} style={styles.noCardContainer}>
              <Feather
                name="credit-card"
                size={32}
                color={theme.textSecondary}
              />
              <ThemedText
                style={[styles.noCardText, { color: theme.textSecondary }]}
              >
                No payment method added
              </ThemedText>
              <Button
                onPress={() => navigation.navigate("AddCard" as never)}
                style={styles.addCardButton}
              >
                Add Card
              </Button>
            </Card>
          )}
        </View>

        {/* Summary */}
        {selectedAmount && defaultCard && (
          <Card elevation={1} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Top Up Amount
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(selectedAmount)}
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryRow}>
              <ThemedText style={styles.totalLabel}>New Balance</ThemedText>
              <ThemedText type="h4" style={{ color: theme.primary }}>
                {formatCurrency((walletBalance?.amount || 0) + selectedAmount)}
              </ThemedText>
            </View>
          </Card>
        )}

        <Button
          onPress={handleTopUp}
          disabled={isLoading || !selectedAmount || !defaultCard}
          style={styles.topUpButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            `Top Up ${selectedAmount ? formatCurrency(selectedAmount) : ""}`
          )}
        </Button>
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
    paddingTop: Spacing.lg,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  amountButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  amountText: {
    ...Typography.h4,
  },
  cardPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    marginLeft: Spacing.md,
  },
  cardBrand: {
    ...Typography.bodyMedium,
  },
  cardExpiry: {
    ...Typography.small,
  },
  changeButton: {
    padding: Spacing.sm,
  },
  noCardContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  noCardText: {
    ...Typography.body,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addCardButton: {
    paddingHorizontal: Spacing.xl,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryValue: {
    ...Typography.bodyMedium,
  },
  totalLabel: {
    ...Typography.bodyMedium,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  topUpButton: {
    height: 52,
  },
});
