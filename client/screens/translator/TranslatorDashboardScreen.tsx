import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  FlatList,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/lib/socket";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getLanguageName, getCategoryById } from "@/constants/mockData";

interface IncomingRequest {
  requestId: string;
  clientName: string;
  clientAvatar?: string;
  fromLanguage: string;
  toLanguage: string;
  category: string;
  pricePerMinute: number;
  expiresAt: number;
}

type NavigationProp = NativeStackNavigationProp<any>;

export default function TranslatorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [todayStats, setTodayStats] = useState({
    calls: 0,
    minutes: 0,
    earnings: 0,
  });

  const pulseOpacity = useSharedValue(1);

  // Pulse animation when online
  useEffect(() => {
    if (isOnline) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isOnline]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Socket connection and events
  useEffect(() => {
    if (isOnline && user?.id) {
      const socket = socketService.connect();

      // Register as translator
      socketService.registerAsTranslator(user.id);
      socketService.setAvailability(true);

      // Listen for incoming requests
      socketService.on("incoming-request", (data: {
        roomId: string;
        userId: string;
        fromLang: string;
        toLang: string;
        category: string;
      }) => {
        Vibration.vibrate([0, 500, 200, 500]);
        const request: IncomingRequest = {
          requestId: data.roomId,
          clientName: `Client ${data.userId.slice(0, 6)}`,
          fromLanguage: data.fromLang,
          toLanguage: data.toLang,
          category: data.category,
          pricePerMinute: 2, // Default, will be updated from server
          expiresAt: Date.now() + 15000,
        };
        setIncomingRequests((prev) => [...prev, request]);
      });

      // Request was cancelled by client
      socketService.on("request-cancelled", ({ roomId }: { roomId: string }) => {
        setIncomingRequests((prev) =>
          prev.filter((r) => r.requestId !== roomId)
        );
      });

      // Request timeout
      socketService.on("request-timeout", ({ roomId }: { roomId: string }) => {
        setIncomingRequests((prev) =>
          prev.filter((r) => r.requestId !== roomId)
        );
      });
    } else if (!isOnline && user?.id) {
      socketService.setAvailability(false);
    }

    return () => {
      socketService.off("incoming-request");
      socketService.off("request-cancelled");
      socketService.off("request-timeout");
    };
  }, [isOnline, user?.id]);

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
  };

  const handleAcceptRequest = async (request: IncomingRequest) => {
    // Accept the request via socket
    socketService.acceptRequest(request.requestId);

    // Remove from list
    setIncomingRequests((prev) =>
      prev.filter((r) => r.requestId !== request.requestId)
    );

    // Navigate to call screen
    navigation.navigate("TranslatorCall", {
      requestId: request.requestId,
      clientName: request.clientName,
      fromLanguage: request.fromLanguage,
      toLanguage: request.toLanguage,
      category: request.category,
      pricePerMinute: request.pricePerMinute,
      roomId: request.requestId,
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    // Reject the request via socket
    socketService.rejectRequest(requestId);
    setIncomingRequests((prev) =>
      prev.filter((r) => r.requestId !== requestId)
    );
  };

  const renderRequestCard = ({ item }: { item: IncomingRequest }) => {
    const categoryData = getCategoryById(item.category);

    return (
      <IncomingRequestCard
        request={item}
        categoryData={categoryData}
        onAccept={() => handleAcceptRequest(item)}
        onDecline={() => handleDeclineRequest(item.requestId)}
        theme={theme}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText type="h2">Dashboard</ThemedText>
        <View style={styles.onlineToggle}>
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline ? theme.secondary : theme.textTertiary,
              },
              isOnline && pulseStyle,
            ]}
          />
          <ThemedText
            style={[
              styles.statusText,
              { color: isOnline ? theme.secondary : theme.textSecondary },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </ThemedText>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: theme.border, true: theme.secondary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Feather name="phone-call" size={24} color={theme.primary} />
          <ThemedText type="h3" style={styles.statValue}>
            {todayStats.calls}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Calls Today
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <Feather name="clock" size={24} color={theme.secondary} />
          <ThemedText type="h3" style={styles.statValue}>
            {todayStats.minutes}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Minutes
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <Feather name="dollar-sign" size={24} color={theme.warning} />
          <ThemedText type="h3" style={styles.statValue}>
            {todayStats.earnings}₾
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Earned
          </ThemedText>
        </Card>
      </View>

      {/* Incoming Requests */}
      <View style={styles.requestsSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          {isOnline ? "Incoming Requests" : "Go online to receive requests"}
        </ThemedText>

        {isOnline && incomingRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={theme.textTertiary} />
            <ThemedText
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Waiting for requests...
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtext, { color: theme.textTertiary }]}
            >
              You'll be notified when a client needs translation
            </ThemedText>
          </View>
        )}

        {!isOnline && (
          <View style={styles.emptyState}>
            <Feather name="wifi-off" size={48} color={theme.textTertiary} />
            <ThemedText
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              You're offline
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtext, { color: theme.textTertiary }]}
            >
              Toggle the switch above to start receiving requests
            </ThemedText>
          </View>
        )}

        <FlatList
          data={incomingRequests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item.requestId}
          contentContainerStyle={styles.requestsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ThemedView>
  );
}

// Incoming Request Card Component
interface RequestCardProps {
  request: IncomingRequest;
  categoryData: any;
  onAccept: () => void;
  onDecline: () => void;
  theme: any;
}

function IncomingRequestCard({
  request,
  categoryData,
  onAccept,
  onDecline,
  theme,
}: RequestCardProps) {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card
      style={[
        styles.requestCard,
        { borderLeftColor: theme.primary, borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.clientInfo}>
          <View
            style={[styles.clientAvatar, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.clientInitial}>
              {request.clientName.charAt(0)}
            </ThemedText>
          </View>
          <View>
            <ThemedText type="h4">{request.clientName}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {getLanguageName(request.fromLanguage)} →{" "}
              {getLanguageName(request.toLanguage)}
            </ThemedText>
          </View>
        </View>
        <View
          style={[
            styles.timerBadge,
            {
              backgroundColor:
                timeLeft <= 5 ? theme.error : theme.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.timerText,
              { color: timeLeft <= 5 ? "#fff" : theme.text },
            ]}
          >
            {timeLeft}s
          </ThemedText>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailItem}>
          <Feather
            name={(categoryData?.icon as any) || "message-circle"}
            size={16}
            color={theme.textSecondary}
          />
          <ThemedText style={{ color: theme.textSecondary, marginLeft: 4 }}>
            {categoryData?.nameEn || "General"}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Feather name="dollar-sign" size={16} color={theme.secondary} />
          <ThemedText style={{ color: theme.secondary, fontWeight: "600" }}>
            {request.pricePerMinute}₾/min
          </ThemedText>
        </View>
      </View>

      <View style={styles.requestActions}>
        <Pressable
          style={[styles.declineButton, { borderColor: theme.error }]}
          onPress={onDecline}
        >
          <Feather name="x" size={20} color={theme.error} />
          <ThemedText style={{ color: theme.error, marginLeft: 4 }}>
            Decline
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.acceptButton, { backgroundColor: theme.secondary }]}
          onPress={onAccept}
        >
          <Feather name="check" size={20} color="#fff" />
          <ThemedText style={{ color: "#fff", marginLeft: 4, fontWeight: "600" }}>
            Accept
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  onlineToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.bodyMedium,
    marginRight: Spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statValue: {
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  requestsSection: {
    flex: 1,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Spacing["4xl"],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.small,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  requestsList: {
    paddingBottom: Spacing.xl,
  },
  requestCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  timerBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    ...Typography.bodyMedium,
    fontVariant: ["tabular-nums"],
  },
  requestDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
