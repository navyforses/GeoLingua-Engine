import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { formatDuration, getCategoryById } from "@/constants/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useCall } from "@/hooks/useCall";

type RouteProps = RouteProp<RootStackParamList, "Call">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get("window");

export default function CallScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const { translatorName, translatorId, category, pricePerMinute, roomId } =
    route.params;
  const categoryData = getCategoryById(category);

  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const {
    duration,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    endCall,
    startCall,
    isConnected,
  } = useCall();

  // Start call when screen mounts
  useEffect(() => {
    const initCall = async () => {
      // Request camera permission
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      // Start the call
      if (roomId) {
        await startCall({
          roomId,
          translatorName,
          translatorId,
          category,
          pricePerMinute,
        });
      }
    };

    initCall();
  }, []);

  const handleEndCall = () => {
    const callDuration = endCall();
    const totalPrice =
      Math.ceil((callDuration || duration) / 60) * pricePerMinute;

    navigation.replace("Rating", {
      translatorName,
      translatorId,
      duration: callDuration || duration,
      totalPrice: totalPrice || pricePerMinute,
    });
  };

  const currentPrice = Math.ceil(duration / 60) * pricePerMinute;

  return (
    <View style={styles.container}>
      {/* Remote Video (Translator) - Placeholder for now */}
      <View style={[styles.remoteVideo, { backgroundColor: "#1a1a2e" }]}>
        <View style={styles.placeholderVideo}>
          <Feather name="user" size={64} color="rgba(255,255,255,0.3)" />
          <ThemedText style={styles.placeholderText}>
            {translatorName}
          </ThemedText>
          <ThemedText style={styles.connectingText}>
            {isConnected ? "Connected" : "Connecting..."}
          </ThemedText>
        </View>
      </View>

      {/* Local Video (User Camera) */}
      <View style={[styles.localVideo, { top: insets.top + Spacing.lg }]}>
        {cameraPermission?.granted && !isCameraOff ? (
          <CameraView style={styles.camera} facing="front" />
        ) : (
          <View style={styles.localPlaceholder}>
            <Feather
              name={isCameraOff ? "video-off" : "user"}
              size={24}
              color="rgba(255,255,255,0.5)"
            />
          </View>
        )}
      </View>

      {/* Timer Badge */}
      <View style={[styles.timerContainer, { top: insets.top + Spacing.lg }]}>
        <View style={styles.timerBadge}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: isConnected ? "#22C55E" : "#EF4444" },
            ]}
          />
          <ThemedText style={styles.timerText}>
            {formatDuration(duration)}
          </ThemedText>
        </View>
      </View>

      {/* Info Card */}
      {isInfoExpanded ? (
        <Pressable
          style={[styles.infoCard, { top: insets.top + Spacing.lg + 50 }]}
          onPress={() => setIsInfoExpanded(false)}
        >
          <View style={styles.infoHeader}>
            <ThemedText style={styles.infoName}>{translatorName}</ThemedText>
            <Feather name="chevron-up" size={18} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={styles.infoDetails}>
            <View style={styles.infoItem}>
              <Feather
                name={
                  (categoryData?.icon as keyof typeof Feather.glyphMap) ||
                  "message-circle"
                }
                size={14}
                color="rgba(255,255,255,0.7)"
              />
              <ThemedText style={styles.infoItemText}>
                {categoryData?.nameEn || "General"}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Feather name="dollar-sign" size={14} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.infoItemText}>{currentPrice.toFixed(2)}₾</ThemedText>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.infoCollapsed, { top: insets.top + Spacing.lg + 50 }]}
          onPress={() => setIsInfoExpanded(true)}
        >
          <ThemedText style={styles.infoName}>{translatorName}</ThemedText>
          <Feather name="chevron-down" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      )}

      {/* Call Controls */}
      <View
        style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        {/* Mute Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: isMuted ? "#fff" : "rgba(255,255,255,0.2)", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={toggleMute}
        >
          <Feather name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? "#000" : "#fff"} />
        </Pressable>

        {/* Camera Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: isCameraOff ? "#fff" : "rgba(255,255,255,0.2)", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={toggleCamera}
        >
          <Feather name={isCameraOff ? "video-off" : "video"} size={24} color={isCameraOff ? "#000" : "#fff"} />
        </Pressable>

        {/* End Call Button */}
        <Pressable
          style={({ pressed }) => [
            styles.endCallButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleEndCall}
        >
          <Feather name="phone-off" size={28} color="#fff" />
        </Pressable>

        {/* Switch Camera Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: "rgba(255,255,255,0.2)", opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="repeat" size={24} color="#fff" />
        </Pressable>

        {/* Chat Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: "rgba(255,255,255,0.2)", opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="message-square" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderVideo: {
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: Spacing.md,
    ...Typography.h4,
  },
  connectingText: {
    color: "rgba(255,255,255,0.4)",
    marginTop: Spacing.sm,
    ...Typography.small,
  },
  localVideo: {
    position: "absolute",
    right: Spacing.lg,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: "#2a2a3e",
    ...Shadows.card,
  },
  camera: {
    flex: 1,
  },
  localPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    position: "absolute",
    left: Spacing.lg,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  timerText: {
    color: "#fff",
    ...Typography.bodyMedium,
    fontVariant: ["tabular-nums"],
  },
  infoCard: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg + 100 + Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoCollapsed: {
    position: "absolute",
    left: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  infoName: {
    color: "#fff",
    ...Typography.bodyMedium,
    marginRight: Spacing.sm,
  },
  infoDetails: {
    flexDirection: "row",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  infoItemText: {
    color: "rgba(255,255,255,0.7)",
    ...Typography.small,
    marginLeft: Spacing.xs,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.md,
  },
});
