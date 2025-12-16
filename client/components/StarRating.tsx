import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRatingChange, size = 32, readonly = false }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Pressable
          key={i}
          onPress={() => !readonly && onRatingChange?.(i + 1)}
          disabled={readonly}
          hitSlop={8}
          style={styles.star}
        >
          <Feather
            name="star"
            size={size}
            color={i < rating ? "#F59E0B" : "#E5E7EB"}
            style={{ opacity: i < rating ? 1 : 0.5 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    marginHorizontal: Spacing.xs,
  },
});
