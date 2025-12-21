import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { usePayment } from "@/contexts/PaymentContext";
import { formatCardBrand, formatCurrency } from "@/lib/stripe";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    paymentMethods,
    defaultPaymentMethodId,
    walletBalance,
    isLoading,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refreshAll,
  } = usePayment();

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const handleAddCard = () => {
    navigation.navigate("AddCard" as never);
  };

  const handleRemoveCard = (paymentMethodId: string, last4: string) => {
    Alert.alert(
      "Remove Card",
      `Are you sure you want to remove the card ending in ${last4}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setProcessingId(paymentMethodId);
            const { error } = await removePaymentMethod(paymentMethodId);
            setProcessingId(null);
            if (error) {
              Alert.alert("Error", error);
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (paymentMethodId === defaultPaymentMethodId) return;

    setProcessingId(paymentMethodId);
    const { error } = await setDefaultPaymentMethod(paymentMethodId);
    setProcessingId(null);

    if (error) {
      Alert.alert("Error", error);
    }
  };

  const handleTopUp = () => {
    navigation.navigate("TopUpWallet" as never);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Wallet Balance Card */}
        <Card elevation={2} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View
              style={[
                styles.walletIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="credit-card" size={24} color={theme.primary} />
            </View>
            <View style={styles.walletInfo}>
              <ThemedText
                style={[styles.walletLabel, { color: theme.textSecondary }]}
              >
                Wallet Balance
              </ThemedText>
              <ThemedText type="h2" style={styles.walletAmount}>
                {formatCurrency(walletBalance?.amount || 0)}
              </ThemedText>
            </View>
          </View>
          <Button onPress={handleTopUp} style={styles.topUpButton}>
            <Feather
              name="plus"
              size={18}
              color="#fff"
              style={{ marginRight: Spacing.sm }}
            />
            Top Up Wallet
          </Button>
        </Card>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Payment Methods</ThemedText>
            <Pressable
              style={[styles.addButton, { borderColor: theme.primary }]}
              onPress={handleAddCard}
            >
              <Feather name="plus" size={18} color={theme.primary} />
              <ThemedText
                style={[styles.addButtonText, { color: theme.primary }]}
              >
                Add Card
              </ThemedText>
            </Pressable>
          </View>

          {isLoading && paymentMethods.length === 0 ? (
            <Card elevation={1} style={styles.loadingCard}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading payment methods...
              </ThemedText>
            </Card>
          ) : paymentMethods.length === 0 ? (
            <Card elevation={1} style={styles.emptyCard}>
              <Feather
                name="credit-card"
                size={48}
                color={theme.textSecondary}
              />
              <ThemedText
                style={[styles.emptyTitle, { color: theme.textSecondary }]}
              >
                No payment methods
              </ThemedText>
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                Add a card to start making payments
              </ThemedText>
              <Button onPress={handleAddCard} style={styles.emptyButton}>
                Add Your First Card
              </Button>
            </Card>
          ) : (
            <View style={styles.cardsList}>
              {paymentMethods.map((method) => (
                <Card key={method.id} elevation={1} style={styles.cardItem}>
                  <Pressable
                    style={styles.cardContent}
                    onPress={() => handleSetDefault(method.id)}
                    disabled={processingId === method.id}
                  >
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.cardBrandIcon,
                          { backgroundColor: theme.backgroundSecondary },
                        ]}
                      >
                        <Feather
                          name="credit-card"
                          size={20}
                          color={theme.text}
                        />
                      </View>
                      <View style={styles.cardDetails}>
                        <ThemedText style={styles.cardBrand}>
                          {formatCardBrand(method.card.brand)} ••••{" "}
                          {method.card.last4}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.cardExpiry,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Expires {method.card.expMonth}/{method.card.expYear}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      {processingId === method.id ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <>
                          {method.id === defaultPaymentMethodId && (
                            <View
                              style={[
                                styles.defaultBadge,
                                { backgroundColor: theme.primary + "20" },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.defaultText,
                                  { color: theme.primary },
                                ]}
                              >
                                Default
                              </ThemedText>
                            </View>
                          )}
                          <Pressable
                            style={styles.removeButton}
                            onPress={() =>
                              handleRemoveCard(method.id, method.card.last4)
                            }
                            hitSlop={10}
                          >
                            <Feather
                              name="trash-2"
                              size={18}
                              color={theme.error}
                            />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <Card elevation={1} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color={theme.primary} />
            <ThemedText
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              Your payment information is securely processed by Stripe
            </ThemedText>
          </View>
        </Card>
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
  walletCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  walletInfo: {
    marginLeft: Spacing.lg,
  },
  walletLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  walletAmount: {
    letterSpacing: -1,
  },
  topUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  addButtonText: {
    ...Typography.small,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  loadingCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
  },
  cardsList: {
    gap: Spacing.md,
  },
  cardItem: {
    padding: 0,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  cardBrand: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  cardExpiry: {
    ...Typography.small,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  defaultText: {
    ...Typography.small,
    fontWeight: "600",
  },
  removeButton: {
    padding: Spacing.sm,
  },
  infoCard: {
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
});
