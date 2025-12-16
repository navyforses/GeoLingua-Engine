import React, { useState } from "react";
import { View, StyleSheet, Switch, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

interface SettingItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
}

function SettingItem({ icon, label, description, value, onValueChange, onPress }: SettingItemProps) {
  const { theme } = useTheme();
  const isToggle = value !== undefined && onValueChange !== undefined;

  const content = (
    <View style={styles.settingItem}>
      <Feather name={icon} size={20} color={theme.primary} style={styles.settingIcon} />
      <View style={styles.settingInfo}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        {description ? (
          <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      ) : (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        NOTIFICATIONS
      </ThemedText>
      <Card elevation={1} style={styles.card}>
        <SettingItem
          icon="bell"
          label="Push Notifications"
          description="Receive notifications for new requests"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingItem
          icon="volume-2"
          label="Sound"
          description="Play sound for notifications"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingItem
          icon="smartphone"
          label="Vibration"
          description="Vibrate for notifications"
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
        />
      </Card>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        CALLS
      </ThemedText>
      <Card elevation={1} style={styles.card}>
        <SettingItem
          icon="zap"
          label="Auto-Accept Calls"
          description="Automatically accept incoming calls"
          value={autoAccept}
          onValueChange={setAutoAccept}
        />
      </Card>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        ABOUT
      </ThemedText>
      <Card elevation={1} style={styles.card}>
        <SettingItem
          icon="info"
          label="App Version"
          description="1.0.0"
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingItem
          icon="github"
          label="Open Source Licenses"
          onPress={() => {}}
        />
      </Card>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        DANGER ZONE
      </ThemedText>
      <Card elevation={1} style={styles.card}>
        <SettingItem
          icon="trash-2"
          label="Delete Account"
          onPress={() => {}}
        />
      </Card>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  card: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
  },
  settingDescription: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.xl + 20 + Spacing.md,
  },
});
