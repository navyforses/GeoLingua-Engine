import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  getLanguageName,
  getCategoryById,
  mockTranslators,
} from "@/constants/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "Matching">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MatchingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const { fromLang, toLang, category, type } = route.params;
  const categoryData = getCategoryById(category);

  const [timeRemaining, setTimeRemaining] = useState(60);
  const [broadcastCount] = useState(
    mockTranslators.filter((t) => t.isOnline).length,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulseScale, pulseOpacity]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const matchTimeout = setTimeout(() => {
      if (navigation.canGoBack()) {
        const translator = mockTranslators.find((t) => t.isOnline);
        if (translator) {
          navigation.replace("Call", {
            translatorName: translator.name,
            translatorId: translator.id,
            category,
            pricePerMinute: categoryData?.pricePerMinute || 2,
          });
        }
      }
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(matchTimeout);
    };
  }, [category, categoryData?.pricePerMinute, navigation]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.matchingSection}>
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                { borderColor: theme.primary },
                pulseStyle,
              ]}
            />
            <View
              style={[styles.centerCircle, { backgroundColor: theme.primary }]}
            >
              <Feather name="search" size={32} color="#fff" />
            </View>
          </View>

          <ThemedText type="h3" style={styles.statusText}>
            Finding Translator...
          </ThemedText>

          <ThemedText
            style={[styles.broadcastText, { color: theme.textSecondary }]}
          >
            Broadcasted to {broadcastCount} translator
            {broadcastCount !== 1 ? "s" : ""}
          </ThemedText>

          <View
            style={[
              styles.timerContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather
              name="clock"
              size={18}
              color={timeRemaining < 15 ? theme.error : theme.text}
            />
            <ThemedText
              style={[
                styles.timerText,
                { color: timeRemaining < 15 ? theme.error : theme.text },
              ]}
            >
              {timeRemaining}s remaining
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.detailRow}>
            <Feather name="globe" size={18} color={theme.textSecondary} />
            <ThemedText style={styles.detailText}>
              {getLanguageName(fromLang)} - {getLanguageName(toLang)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name={(categoryData?.icon as any) || "message-circle"}
              size={18}
              color={theme.textSecondary}
            />
            <ThemedText style={styles.detailText}>
              {categoryData?.nameEn || "General"} -{" "}
              {categoryData?.pricePerMinute || 2}₾/min
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name={type === "instant" ? "zap" : "calendar"}
              size={18}
              color={theme.textSecondary}
            />
            <ThemedText style={styles.detailText}>
              {type === "instant" ? "Instant Request" : "Scheduled Request"}
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            { borderColor: theme.error, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleCancel}
        >
          <ThemedText style={[styles.cancelText, { color: theme.error }]}>
            Cancel Request
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["3xl"],
    justifyContent: "space-between",
  },
  matchingSection: {
    alignItems: "center",
    paddingTop: Spacing["4xl"],
  },
  pulseContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  centerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  broadcastText: {
    ...Typography.body,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    ...Typography.bodyMedium,
    marginLeft: Spacing.sm,
  },
  detailsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  detailText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  cancelText: {
    ...Typography.bodyMedium,
  },
});
