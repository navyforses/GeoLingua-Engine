import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { Category } from "@/constants/mockData";

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({
  category,
  isSelected,
  onPress,
}: CategoryChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
          borderColor: isSelected ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Feather
        name={category.icon as any}
        size={16}
        color={isSelected ? "#fff" : theme.text}
        style={styles.icon}
      />
      <ThemedText
        style={[styles.text, { color: isSelected ? "#fff" : theme.text }]}
      >
        {category.nameEn}
      </ThemedText>
      <ThemedText
        style={[
          styles.price,
          { color: isSelected ? "rgba(255,255,255,0.8)" : theme.textSecondary },
        ]}
      >
        {category.pricePerMinute}₾/min
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.small,
    fontWeight: "500",
  },
  price: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
});
