import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, Shadows } from "@/constants/theme";
import {
  Translator,
  getLanguageName,
  getCategoryById,
} from "@/constants/mockData";

interface TranslatorCardProps {
  translator: Translator;
  onPress: () => void;
}

export function TranslatorCard({ translator, onPress }: TranslatorCardProps) {
  const { theme } = useTheme();

  const languagePairs = translator.languages
    .slice(0, 2)
    .map((l) => `${getLanguageName(l.from)} - ${getLanguageName(l.to)}`)
    .join(", ");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: pressed ? 0.9 : 1,
        },
        Shadows.card,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="user" size={24} color={theme.textSecondary} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name}>{translator.name}</ThemedText>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: translator.isOnline
                    ? theme.online
                    : theme.offline,
                },
              ]}
            />
          </View>
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color="#F59E0B" />
            <ThemedText style={styles.rating}>
              {translator.rating.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.calls, { color: theme.textSecondary }]}>
              ({translator.totalCalls} calls)
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.languages}>
        <Feather
          name="globe"
          size={14}
          color={theme.textSecondary}
          style={styles.langIcon}
        />
        <ThemedText
          style={[styles.langText, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {languagePairs}
        </ThemedText>
      </View>

      <View style={styles.categories}>
        {translator.categories.slice(0, 3).map((catId) => {
          const cat = getCategoryById(catId);
          return cat ? (
            <View
              key={catId}
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText
                style={[styles.categoryText, { color: theme.textSecondary }]}
              >
                {cat.nameEn}
              </ThemedText>
            </View>
          ) : null;
        })}
      </View>
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    ...Typography.bodyMedium,
    marginRight: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  rating: {
    ...Typography.small,
    marginLeft: Spacing.xs,
    fontWeight: "600",
  },
  calls: {
    ...Typography.small,
    marginLeft: Spacing.xs,
  },
  languages: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  langIcon: {
    marginRight: Spacing.sm,
  },
  langText: {
    ...Typography.small,
    flex: 1,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  categoryText: {
    ...Typography.caption,
  },
});
