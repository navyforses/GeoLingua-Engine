import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, TextInput, ActivityIndicator } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TranslatorCard } from "@/components/TranslatorCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { mockTranslators, Translator } from "@/constants/mockData";
import { SearchStackParamList } from "@/navigation/SearchStackNavigator";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

interface ApiTranslator {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  rating: number;
  totalCalls: number;
  totalMinutes: number;
  isOnline: boolean;
  isVerified: boolean;
  languages: { from: string; to: string }[];
  categories: string[];
}

export default function SearchScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: translatorsData, isLoading } = useQuery<{ data: ApiTranslator[] } | ApiTranslator[]>({
    queryKey: ["/api/translators"],
    staleTime: 1000 * 60 * 2,
  });

  const translators: Translator[] = useMemo(() => {
    const rawData = Array.isArray(translatorsData) ? translatorsData : translatorsData?.data;
    if (rawData) {
      return rawData.map((t) => ({
        id: t.id,
        name: t.name,
        avatarUrl: t.avatarUrl || undefined,
        rating: Number(t.rating),
        totalCalls: t.totalCalls,
        languages: t.languages,
        categories: t.categories,
        isOnline: t.isOnline,
        bio: t.bio,
      }));
    }
    return mockTranslators;
  }, [translatorsData]);

  const filteredTranslators = translators.filter((translator) =>
    translator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFirst = [...filteredTranslators].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return b.rating - a.rating;
  });

  const renderItem = ({ item }: { item: Translator }) => (
    <TranslatorCard
      translator={item}
      onPress={() => navigation.navigate("TranslatorDetail", { translatorId: item.id })}
    />
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            Loading translators...
          </ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="search" size={48} color={theme.textSecondary} />
        <ThemedText type="h4" style={styles.emptyTitle}>
          No translators found
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Try adjusting your search query
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search translators..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Feather
              name="x"
              size={20}
              color={theme.textSecondary}
              onPress={() => setSearchQuery("")}
            />
          ) : null}
        </View>
      </View>

      <FlatList
        data={onlineFirst}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
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
