import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, Shadows } from "@/constants/theme";
import { CallHistory, getLanguageName, getCategoryById, formatDuration, formatPrice } from "@/constants/mockData";

interface HistoryCardProps {
  call: CallHistory;
  onPress?: () => void;
}

export function HistoryCard({ call, onPress }: HistoryCardProps) {
  const { theme } = useTheme();
  const category = getCategoryById(call.category);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const statusColors = {
    completed: theme.online,
    cancelled: theme.error,
    missed: theme.offline,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
        Shadows.card,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.name}>{call.translatorName}</ThemedText>
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(call.date)}
          </ThemedText>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColors[call.status] + "20" }]}
        >
          <ThemedText style={[styles.statusText, { color: statusColors[call.status] }]}>
            {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="globe" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {getLanguageName(call.fromLang)} - {getLanguageName(call.toLang)}
          </ThemedText>
        </View>
        {category ? (
          <View style={styles.detailItem}>
            <Feather name={category.icon as any} size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {category.nameEn}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {call.status === "completed" ? (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Feather name="clock" size={14} color={theme.text} />
            <ThemedText style={styles.footerValue}>{formatDuration(call.duration)}</ThemedText>
          </View>
          <View style={styles.footerItem}>
            <ThemedText style={[styles.footerValue, { color: theme.primary }]}>
              {formatPrice(call.totalPrice)}
            </ThemedText>
          </View>
          {call.rating ? (
            <View style={styles.footerItem}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Feather
                  key={i}
                  name="star"
                  size={14}
                  color={i < call.rating! ? "#F59E0B" : theme.border}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
  },
  date: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  detailText: {
    ...Typography.small,
    marginLeft: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerValue: {
    ...Typography.bodyMedium,
    marginLeft: Spacing.xs,
  },
});
