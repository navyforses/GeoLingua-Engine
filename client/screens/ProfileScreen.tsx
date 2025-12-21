import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
  textColor?: string;
}

function MenuItem({
  icon,
  label,
  onPress,
  showBadge,
  badgeCount = 3,
  textColor,
}: MenuItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
      ]}
      onPress={onPress}
    >
      <Feather name={icon} size={20} color={textColor || theme.text} />
      <ThemedText style={[styles.menuLabel, textColor && { color: textColor }]}>
        {label}
      </ThemedText>
      <View style={styles.menuRight}>
        {showBadge ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.badgeText}>{badgeCount}</ThemedText>
          </View>
        ) : null}
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.name || "User";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + Spacing.xl },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>{userInitial}</ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <ThemedText type="h4">{userName}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {userEmail}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.editButton, { borderColor: theme.border }]}
        >
          <Feather name="edit-2" size={16} color={theme.text} />
        </Pressable>
      </View>

      <Card elevation={1} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h3">0</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Calls
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h3">0</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Minutes
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h3">0₾</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Spent
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card elevation={1} style={styles.menuCard}>
        <MenuItem
          icon="credit-card"
          label="Payment Methods"
          onPress={() => navigation.navigate("PaymentMethods")}
        />
        <MenuItem
          icon="bell"
          label="Notifications"
          onPress={() => {}}
          showBadge
          badgeCount={3}
        />
        <MenuItem
          icon="globe"
          label="Language Preferences"
          onPress={() => {}}
        />
        <MenuItem
          icon="settings"
          label="Settings"
          onPress={() => navigation.navigate("Settings")}
        />
      </Card>

      <Card elevation={1} style={styles.menuCard}>
        <MenuItem
          icon="help-circle"
          label="Help & Support"
          onPress={() => {}}
        />
        <MenuItem
          icon="file-text"
          label="Terms of Service"
          onPress={() => {}}
        />
        <MenuItem
          icon="shield"
          label="Privacy Policy"
          onPress={() => {}}
        />
      </Card>

      <Card elevation={1} style={styles.menuCard}>
        <MenuItem
          icon="log-out"
          label="Sign Out"
          onPress={handleSignOut}
          textColor={theme.error}
        />
      </Card>

      <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
        GeoLingua v1.0.0
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  email: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  menuLabel: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  version: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
