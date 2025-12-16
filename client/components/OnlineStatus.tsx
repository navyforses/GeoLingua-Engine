import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

interface OnlineStatusProps {
  count: number;
}

export function OnlineStatus({ count }: OnlineStatusProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: theme.online }]} />
      <ThemedText style={[styles.text, { color: theme.textSecondary }]}>
        {count} translator{count !== 1 ? "s" : ""} online
      </ThemedText>
      <Feather name="wifi" size={14} color={theme.online} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  text: {
    ...Typography.small,
  },
  icon: {
    marginLeft: Spacing.xs,
  },
});
