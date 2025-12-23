import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type TimePeriod = "today" | "week" | "month" | "all";

interface Transaction {
  id: string;
  type: "earning" | "withdrawal";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending";
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "earning",
    amount: 24,
    description: "Call with Giorgi M. (12 min)",
    date: "2024-01-15T14:30:00",
    status: "completed",
  },
  {
    id: "2",
    type: "earning",
    amount: 15,
    description: "Call with Anna K. (5 min)",
    date: "2024-01-15T11:20:00",
    status: "completed",
  },
  {
    id: "3",
    type: "withdrawal",
    amount: -100,
    description: "Withdrawal to bank account",
    date: "2024-01-14T16:00:00",
    status: "completed",
  },
  {
    id: "4",
    type: "earning",
    amount: 36,
    description: "Call with David S. (18 min)",
    date: "2024-01-14T09:45:00",
    status: "completed",
  },
];

export default function TranslatorEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const [balance, setBalance] = useState(175.5);
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const periodStats = {
    today: { earnings: 39, calls: 2, minutes: 17 },
    week: { earnings: 175.5, calls: 12, minutes: 87 },
    month: { earnings: 542, calls: 45, minutes: 312 },
    all: { earnings: 2340, calls: 186, minutes: 1420 },
  };

  const stats = periodStats[selectedPeriod];

  const handleWithdraw = () => {
    if (balance < 50) {
      Alert.alert(
        "Minimum Amount",
        "You need at least 50₾ to withdraw.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Withdraw Funds",
      `Are you sure you want to withdraw ${balance}₾ to your bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          onPress: () => {
            // Handle withdrawal
            Alert.alert("Success", "Withdrawal request submitted!");
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isEarning = item.type === "earning";
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={[
          styles.transactionItem,
          { borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.transactionIcon,
            {
              backgroundColor: isEarning
                ? `${theme.secondary}20`
                : `${theme.error}20`,
            },
          ]}
        >
          <Feather
            name={isEarning ? "arrow-down-left" : "arrow-up-right"}
            size={20}
            color={isEarning ? theme.secondary : theme.error}
          />
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText style={styles.transactionDesc}>
            {item.description}
          </ThemedText>
          <ThemedText
            style={[styles.transactionDate, { color: theme.textSecondary }]}
          >
            {formattedDate} at {formattedTime}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.transactionAmount,
            { color: isEarning ? theme.secondary : theme.error },
          ]}
        >
          {isEarning ? "+" : ""}{item.amount}₾
        </ThemedText>
      </View>
    );
  };

  const PeriodButton = ({
    period,
    label,
  }: {
    period: TimePeriod;
    label: string;
  }) => (
    <Pressable
      style={[
        styles.periodButton,
        {
          backgroundColor:
            selectedPeriod === period ? theme.primary : "transparent",
          borderColor: theme.border,
        },
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <ThemedText
        style={[
          styles.periodButtonText,
          { color: selectedPeriod === period ? "#fff" : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <Card style={styles.balanceCard}>
              <ThemedText
                style={[styles.balanceLabel, { color: theme.textSecondary }]}
              >
                Available Balance
              </ThemedText>
              <ThemedText type="h1" style={styles.balanceAmount}>
                {balance.toFixed(2)}₾
              </ThemedText>
              <Button
                title="Withdraw"
                onPress={handleWithdraw}
                style={styles.withdrawButton}
                icon={<Feather name="download" size={18} color="#fff" />}
              />
            </Card>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              <PeriodButton period="today" label="Today" />
              <PeriodButton period="week" label="Week" />
              <PeriodButton period="month" label="Month" />
              <PeriodButton period="all" label="All Time" />
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Feather name="dollar-sign" size={20} color={theme.secondary} />
                <ThemedText type="h4" style={styles.statValue}>
                  {stats.earnings}₾
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Earned
                </ThemedText>
              </Card>

              <Card style={styles.statCard}>
                <Feather name="phone-call" size={20} color={theme.primary} />
                <ThemedText type="h4" style={styles.statValue}>
                  {stats.calls}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Calls
                </ThemedText>
              </Card>

              <Card style={styles.statCard}>
                <Feather name="clock" size={20} color={theme.warning} />
                <ThemedText type="h4" style={styles.statValue}>
                  {stats.minutes}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Minutes
                </ThemedText>
              </Card>
            </View>

            {/* Transactions Header */}
            <View style={styles.transactionsHeader}>
              <ThemedText type="h4">Transaction History</ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={theme.textTertiary} />
            <ThemedText
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              No transactions yet
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  withdrawButton: {
    paddingHorizontal: Spacing["3xl"],
  },
  periodSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  periodButtonText: {
    ...Typography.small,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statValue: {
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.tiny,
    marginTop: Spacing.xs,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    ...Typography.small,
  },
  transactionAmount: {
    ...Typography.bodyMedium,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
});
