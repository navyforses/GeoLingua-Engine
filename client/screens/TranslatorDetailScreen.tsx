import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StarRating } from "@/components/StarRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { mockTranslators, getLanguageName, getCategoryById } from "@/constants/mockData";
import { SearchStackParamList } from "@/navigation/SearchStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<SearchStackParamList, "TranslatorDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TranslatorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  
  const translator = mockTranslators.find((t) => t.id === route.params.translatorId);

  if (!translator) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Translator not found</ThemedText>
      </ThemedView>
    );
  }

  const handleRequestCall = () => {
    const firstLanguage = translator.languages[0];
    const firstCategory = getCategoryById(translator.categories[0]);
    
    navigation.navigate("Call", {
      translatorName: translator.name,
      translatorId: translator.id,
      category: translator.categories[0],
      pricePerMinute: firstCategory?.pricePerMinute || 2,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={40} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.name}>
            {translator.name}
          </ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: translator.isOnline ? theme.online : theme.offline },
              ]}
            />
            <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
              {translator.isOnline ? "Online" : "Offline"}
            </ThemedText>
          </View>
          <View style={styles.ratingContainer}>
            <StarRating rating={Math.round(translator.rating)} readonly size={24} />
            <ThemedText style={styles.ratingText}>
              {translator.rating.toFixed(1)} ({translator.totalCalls} calls)
            </ThemedText>
          </View>
        </View>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            About
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            {translator.bio}
          </ThemedText>
        </Card>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Languages
          </ThemedText>
          {translator.languages.map((lang, index) => (
            <View key={index} style={styles.languageRow}>
              <Feather name="globe" size={16} color={theme.primary} />
              <ThemedText style={styles.languageText}>
                {getLanguageName(lang.from)} - {getLanguageName(lang.to)}
              </ThemedText>
            </View>
          ))}
        </Card>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Specializations
          </ThemedText>
          <View style={styles.categoriesRow}>
            {translator.categories.map((catId) => {
              const cat = getCategoryById(catId);
              return cat ? (
                <View
                  key={catId}
                  style={[styles.categoryBadge, { backgroundColor: theme.primary + "15" }]}
                >
                  <Feather name={cat.icon as any} size={14} color={theme.primary} />
                  <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                    {cat.nameEn} - {cat.pricePerMinute}₾/min
                  </ThemedText>
                </View>
              ) : null;
            })}
          </View>
        </Card>

        <Button
          onPress={handleRequestCall}
          disabled={!translator.isOnline}
          style={styles.requestButton}
        >
          {translator.isOnline ? "Start Call" : "Translator Offline"}
        </Button>
      </ScrollView>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.small,
  },
  ratingContainer: {
    alignItems: "center",
  },
  ratingText: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  languageText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.small,
    fontWeight: "500",
    marginLeft: Spacing.xs,
  },
  requestButton: {
    marginTop: Spacing.lg,
  },
});
