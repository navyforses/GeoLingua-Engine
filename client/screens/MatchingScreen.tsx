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
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getLanguageName, getCategoryById } from "@/constants/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useMatching } from "@/hooks/useMatching";
import { socketService } from "@/lib/socket";

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    status,
    roomId,
    translator,
    availableCount,
    error,
    requestTranslator,
    cancelRequest,
    isSearching,
    isFound,
    hasError,
  } = useMatching();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Start pulse animation
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  // Start matching when screen mounts
  useEffect(() => {
    // Ensure socket is connected
    socketService.connect();

    // Request translator
    requestTranslator({
      fromLang,
      toLang,
      category,
      type,
    });

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fromLang, toLang, category, type, requestTranslator]);

  // Handle translator found - navigate to call
  useEffect(() => {
    if (isFound && translator && roomId) {
      if (timerRef.current) clearInterval(timerRef.current);

      navigation.replace("Call", {
        translatorName: translator.name,
        translatorId: translator.id,
        category,
        pricePerMinute: categoryData?.pricePerMinute || 2,
        roomId,
      });
    }
  }, [
    isFound,
    translator,
    roomId,
    navigation,
    category,
    categoryData?.pricePerMinute,
  ]);

  // Handle errors or timeout
  useEffect(() => {
    if (hasError || timeRemaining === 0) {
      // Could show an error modal or navigate back
    }
  }, [hasError, timeRemaining]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelRequest();
    navigation.goBack();
  };

  const getStatusText = () => {
    if (hasError) return error || "Unable to find translator";
    if (timeRemaining === 0) return "Request timed out";
    return "Finding Translator...";
  };

  const getStatusIcon = () => {
    if (hasError || timeRemaining === 0) return "alert-circle";
    return "search";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.matchingSection}>
          <View style={styles.pulseContainer}>
            {!hasError && timeRemaining > 0 && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { borderColor: theme.primary },
                  pulseStyle,
                ]}
              />
            )}
            <View
              style={[
                styles.centerCircle,
                {
                  backgroundColor:
                    hasError || timeRemaining === 0
                      ? theme.error
                      : theme.primary,
                },
              ]}
            >
              <Feather name={getStatusIcon()} size={32} color="#fff" />
            </View>
          </View>

          <ThemedText type="h3" style={styles.statusText}>
            {getStatusText()}
          </ThemedText>

          <ThemedText
            style={[styles.broadcastText, { color: theme.textSecondary }]}
          >
            {availableCount > 0
              ? `Broadcasted to ${availableCount} translator${availableCount !== 1 ? "s" : ""}`
              : "Searching for available translators..."}
          </ThemedText>

          {timeRemaining > 0 && !hasError && (
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
          )}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.detailRow}>
            <Feather name="globe" size={18} color={theme.textSecondary} />
            <ThemedText style={styles.detailText}>
              {getLanguageName(fromLang)} → {getLanguageName(toLang)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name={
                (categoryData?.icon as keyof typeof Feather.glyphMap) ||
                "message-circle"
              }
              size={18}
              color={theme.textSecondary}
            />
            <ThemedText style={styles.detailText}>
              {categoryData?.nameEn || "General"} - {categoryData?.pricePerMinute || 2}₾/min
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name={type === "instant" ? "zap" : "calendar"} size={18} color={theme.textSecondary} />
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
