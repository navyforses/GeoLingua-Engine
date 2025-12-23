import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { categories, languages } from "@/constants/mockData";

export default function TranslatorProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  const [profile] = useState({
    name: user?.user_metadata?.name || "Translator",
    email: user?.email || "",
    rating: 4.8,
    totalCalls: 186,
    totalMinutes: 1420,
    languages: ["ka", "en", "ru"],
    categories: ["general", "business", "medical"],
    isVerified: true,
  });

  const userInitial = profile.name.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const getLanguageNames = (codes: string[]) => {
    return codes
      .map((code) => languages.find((l) => l.code === code)?.name || code)
      .join(", ");
  };

  const getCategoryNames = (ids: string[]) => {
    return ids
      .map((id) => categories.find((c) => c.id === id)?.nameEn || id)
      .join(", ");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>{userInitial}</ThemedText>
            {profile.isVerified && (
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: theme.secondary },
                ]}
              >
                <Feather name="check" size={12} color="#fff" />
              </View>
            )}
          </View>
          <ThemedText type="h3" style={styles.name}>
            {profile.name}
          </ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {profile.email}
          </ThemedText>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Feather name="star" size={20} color={theme.warning} />
            <ThemedText style={styles.ratingText}>
              {profile.rating.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.ratingCount, { color: theme.textSecondary }]}>
              ({profile.totalCalls} calls)
            </ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <ThemedText type="h3">{profile.totalCalls}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Calls
            </ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <ThemedText type="h3">{profile.totalMinutes}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Minutes
            </ThemedText>
          </Card>
        </View>

        {/* Languages & Categories */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Feather name="globe" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.infoLabelText, { color: theme.textSecondary }]}>
                Languages
              </ThemedText>
            </View>
            <ThemedText style={styles.infoValue}>
              {getLanguageNames(profile.languages)}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Feather name="briefcase" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.infoLabelText, { color: theme.textSecondary }]}>
                Categories
              </ThemedText>
            </View>
            <ThemedText style={styles.infoValue}>
              {getCategoryNames(profile.categories)}
            </ThemedText>
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <MenuItem
            icon="edit-2"
            label="Edit Profile"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="settings"
            label="Settings"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="credit-card"
            label="Bank Account"
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="log-out"
            label="Sign Out"
            onPress={handleSignOut}
            theme={theme}
            textColor={theme.error}
          />
        </Card>

        <ThemedText style={[styles.version, { color: theme.textTertiary }]}>
          GeoLingua Translator v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  theme: any;
  textColor?: string;
}

function MenuItem({ icon, label, onPress, theme, textColor }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
      ]}
      onPress={onPress}
    >
      <Feather name={icon} size={20} color={textColor || theme.text} />
      <ThemedText
        style={[styles.menuLabel, textColor && { color: textColor }]}
      >
        {label}
      </ThemedText>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    ...Typography.h4,
    marginLeft: Spacing.xs,
  },
  ratingCount: {
    ...Typography.body,
    marginLeft: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  infoLabelText: {
    ...Typography.small,
    marginLeft: Spacing.sm,
  },
  infoValue: {
    ...Typography.body,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  menuCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuLabel: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.md,
  },
  version: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
