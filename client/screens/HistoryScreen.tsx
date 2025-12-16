import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HistoryCard } from "@/components/HistoryCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { mockHistory, CallHistory } from "@/constants/mockData";

export default function HistoryScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={48} color={theme.textSecondary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No calls yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Your translation call history will appear here
      </ThemedText>
    </View>
  );

  const renderItem = ({ item }: { item: CallHistory }) => (
    <HistoryCard call={item} />
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
  },
});
