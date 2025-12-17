import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface RequestTypeToggleProps {
  value: "instant" | "scheduled";
  onChange: (value: "instant" | "scheduled") => void;
}

export function RequestTypeToggle({ value, onChange }: RequestTypeToggleProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <Pressable
        style={[
          styles.option,
          value === "instant" && { backgroundColor: theme.primary },
        ]}
        onPress={() => onChange("instant")}
      >
        <Feather
          name="zap"
          size={18}
          color={value === "instant" ? "#fff" : theme.text}
          style={styles.icon}
        />
        <ThemedText
          style={[
            styles.text,
            { color: value === "instant" ? "#fff" : theme.text },
          ]}
        >
          Instant
        </ThemedText>
      </Pressable>
      <Pressable
        style={[
          styles.option,
          value === "scheduled" && { backgroundColor: theme.primary },
        ]}
        onPress={() => onChange("scheduled")}
      >
        <Feather
          name="calendar"
          size={18}
          color={value === "scheduled" ? "#fff" : theme.text}
          style={styles.icon}
        />
        <ThemedText
          style={[
            styles.text,
            { color: value === "scheduled" ? "#fff" : theme.text },
          ]}
        >
          Scheduled
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.bodyMedium,
  },
});
