import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { usePayment } from "@/contexts/PaymentContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function AddCardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { createPaymentMethod } = useStripe();
  const { addPaymentMethod } = usePayment();

  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert("Incomplete", "Please fill in all card details");
      return;
    }

    setIsLoading(true);

    try {
      // Create payment method using Stripe
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: "Card",
      });

      if (error) {
        Alert.alert("Error", error.message);
        setIsLoading(false);
        return;
      }

      if (paymentMethod) {
        // Add payment method to user's account
        const result = await addPaymentMethod(paymentMethod.id);

        if (result.error) {
          Alert.alert("Error", result.error);
        } else {
          Alert.alert("Success", "Card added successfully", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (error) {
      console.error("Error adding card:", error);
      Alert.alert("Error", "Failed to add card. Please try again.");
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
        keyboardShouldPersistTaps="handled"
      >
        <Card elevation={1} style={styles.cardInputContainer}>
          <ThemedText type="h4" style={styles.cardTitle}>
            Card Details
          </ThemedText>
          <ThemedText
            style={[styles.cardSubtitle, { color: theme.textSecondary }]}
          >
            Enter your card information below
          </ThemedText>

          <View style={styles.cardFieldWrapper}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: "4242 4242 4242 4242",
              }}
              cardStyle={{
                backgroundColor: theme.backgroundSecondary,
                textColor: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: BorderRadius.md,
                fontSize: 16,
                placeholderColor: theme.textSecondary,
              }}
              style={styles.cardField}
              onCardChange={(details) => {
                setCardComplete(details.complete);
              }}
            />
          </View>
        </Card>

        <Card elevation={1} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="lock" size={18} color={theme.primary} />
            <ThemedText
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              Your card information is encrypted and securely processed
            </ThemedText>
          </View>
          <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
            <Feather name="shield" size={18} color={theme.primary} />
            <ThemedText
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              We never store your full card number
            </ThemedText>
          </View>
        </Card>

        {/* Supported Cards */}
        <View style={styles.supportedCards}>
          <ThemedText
            style={[styles.supportedTitle, { color: theme.textSecondary }]}
          >
            Supported Cards
          </ThemedText>
          <View style={styles.cardLogos}>
            <View
              style={[
                styles.cardLogo,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={styles.cardLogoText}>VISA</ThemedText>
            </View>
            <View
              style={[
                styles.cardLogo,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={styles.cardLogoText}>MC</ThemedText>
            </View>
            <View
              style={[
                styles.cardLogo,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={styles.cardLogoText}>AMEX</ThemedText>
            </View>
          </View>
        </View>

        <Button
          onPress={handleAddCard}
          disabled={isLoading || !cardComplete}
          style={styles.addButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            "Add Card"
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
  cardInputContainer: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.small,
    marginBottom: Spacing.xl,
  },
  cardFieldWrapper: {
    marginBottom: Spacing.sm,
  },
  cardField: {
    width: "100%",
    height: 50,
  },
  infoCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    ...Typography.small,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  supportedCards: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  supportedTitle: {
    ...Typography.small,
    marginBottom: Spacing.md,
  },
  cardLogos: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cardLogo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  cardLogoText: {
    ...Typography.small,
    fontWeight: "700",
  },
  addButton: {
    height: 52,
  },
});
