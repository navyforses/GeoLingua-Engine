import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { formatDuration, formatPrice } from "@/constants/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "Rating">;

export default function RatingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  
  const { translatorName, duration, totalPrice } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.checkCircle, { backgroundColor: theme.online + "20" }]}>
            <Feather name="check" size={32} color={theme.online} />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Call Completed
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            with {translatorName}
          </ThemedText>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Feather name="clock" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Duration
              </ThemedText>
              <ThemedText type="h4">{formatDuration(duration)}</ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Feather name="credit-card" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Total
              </ThemedText>
              <ThemedText type="h4" style={{ color: theme.primary }}>
                {formatPrice(totalPrice)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <ThemedText type="h4" style={styles.ratingTitle}>
            How was your experience?
          </ThemedText>
          <StarRating rating={rating} onRatingChange={setRating} size={40} />
        </View>

        <View style={styles.commentSection}>
          <ThemedText style={[styles.commentLabel, { color: theme.textSecondary }]}>
            Leave a comment (optional)
          </ThemedText>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Share your feedback..."
            placeholderTextColor={theme.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Button
          onPress={handleSubmit}
          disabled={rating === 0}
          style={styles.submitButton}
        >
          Submit Rating
        </Button>

        <Pressable
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleSkip}
        >
          <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing["3xl"],
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    ...Typography.small,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 60,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  ratingTitle: {
    marginBottom: Spacing.lg,
  },
  commentSection: {
    marginBottom: Spacing.xl,
  },
  commentLabel: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    ...Typography.body,
  },
  submitButton: {
    marginBottom: Spacing.md,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  skipText: {
    ...Typography.body,
  },
});
