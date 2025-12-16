import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CategoryChip } from "@/components/CategoryChip";
import { RequestTypeToggle } from "@/components/RequestTypeToggle";
import { OnlineStatus } from "@/components/OnlineStatus";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { categories, mockTranslators } from "@/constants/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [fromLang, setFromLang] = useState("ka");
  const [toLang, setToLang] = useState("en");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [requestType, setRequestType] = useState<"instant" | "scheduled">("instant");

  const onlineCount = mockTranslators.filter((t) => t.isOnline).length;
  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
  };

  const handleRequestTranslator = () => {
    navigation.navigate("Matching", {
      fromLang,
      toLang,
      category: selectedCategory,
      type: requestType,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <OnlineStatus count={onlineCount} />

      <Card elevation={1} style={styles.mainCard}>
        <ThemedText type="h4" style={styles.cardTitle}>
          Request Translator
        </ThemedText>

        <View style={styles.languageRow}>
          <LanguageSelector
            label="From"
            selectedCode={fromLang}
            onSelect={setFromLang}
          />
          <Pressable
            style={[styles.swapButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={swapLanguages}
            hitSlop={10}
          >
            <Feather name="repeat" size={18} color={theme.text} />
          </Pressable>
          <LanguageSelector
            label="To"
            selectedCode={toLang}
            onSelect={setToLang}
          />
        </View>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </View>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Request Type
        </ThemedText>
        <RequestTypeToggle value={requestType} onChange={setRequestType} />

        <View style={styles.pricePreview}>
          <View>
            <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Price
            </ThemedText>
            <ThemedText style={styles.priceValue}>
              {selectedCategoryData?.pricePerMinute || 2}₾
              <ThemedText style={[styles.priceUnit, { color: theme.textSecondary }]}>
                {" "}
                / min
              </ThemedText>
            </ThemedText>
          </View>
          <View style={styles.aiOption}>
            <Pressable
              style={[styles.aiButton, { borderColor: theme.accent }]}
            >
              <Feather name="cpu" size={16} color={theme.accent} />
              <ThemedText style={[styles.aiText, { color: theme.accent }]}>
                AI: 0.5₾/min
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Button onPress={handleRequestTranslator} style={styles.requestButton}>
          {requestType === "instant" ? "Request Now" : "Schedule Call"}
        </Button>
      </Card>

      <Card elevation={1} style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Feather name="info" size={18} color={theme.primary} />
          <ThemedText style={[styles.tipTitle, { color: theme.primary }]}>
            How it works
          </ThemedText>
        </View>
        <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
          1. Select your languages and category{"\n"}
          2. Request a translator{"\n"}
          3. Get matched within 60 seconds{"\n"}
          4. Start your translation call
        </ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.xl,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.lg,
  },
  pricePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  priceLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    ...Typography.h3,
  },
  priceUnit: {
    ...Typography.body,
  },
  aiOption: {
    alignItems: "flex-end",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  aiText: {
    ...Typography.small,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  requestButton: {
    marginTop: Spacing.sm,
  },
  tipCard: {
    marginBottom: Spacing.lg,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    ...Typography.bodyMedium,
    marginLeft: Spacing.sm,
  },
  tipText: {
    ...Typography.small,
  },
});
