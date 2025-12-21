import { useState, useEffect, useCallback, useRef } from "react";
import { socketService } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

export type MatchingStatus =
  | "idle"
  | "searching"
  | "found"
  | "connecting"
  | "timeout"
  | "no-translators"
  | "cancelled"
  | "error";

interface TranslatorInfo {
  id: string;
  name: string;
  rating: number;
}

interface MatchingState {
  status: MatchingStatus;
  roomId: string | null;
  translator: TranslatorInfo | null;
  availableCount: number;
  error: string | null;
}

interface RequestParams {
  fromLang: string;
  toLang: string;
  category: string;
  type: "instant" | "scheduled";
}

export function useMatching() {
  const { user } = useAuth();
  const [state, setState] = useState<MatchingState>({
    status: "idle",
    roomId: null,
    translator: null,
    availableCount: 0,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleSearching = (data: {
      roomId: string;
      availableCount: number;
    }) => {
      setState((prev) => ({
        ...prev,
        status: "searching",
        roomId: data.roomId,
        availableCount: data.availableCount,
      }));
    };

    const handleTranslatorFound = (data: {
      roomId: string;
      translator: TranslatorInfo;
    }) => {
      setState((prev) => ({
        ...prev,
        status: "found",
        translator: data.translator,
      }));
    };

    const handleStartCall = (data: { roomId: string }) => {
      setState((prev) => ({
        ...prev,
        status: "connecting",
      }));
    };

    const handleNoTranslator = (data: { message: string }) => {
      setState((prev) => ({
        ...prev,
        status: "no-translators",
        error: data.message,
      }));
    };

    const handleTimeout = (data: { roomId: string }) => {
      setState((prev) => ({
        ...prev,
        status: "timeout",
        error: "No translator accepted your request",
      }));
    };

    const handleCancelled = () => {
      setState((prev) => ({
        ...prev,
        status: "cancelled",
      }));
    };

    socketService.on("searching", handleSearching);
    socketService.on("translator-found", handleTranslatorFound);
    socketService.on("start-call", handleStartCall);
    socketService.on("no-translator-available", handleNoTranslator);
    socketService.on("request-timeout", handleTimeout);
    socketService.on("request-cancelled", handleCancelled);

    return () => {
      socketService.off("searching", handleSearching);
      socketService.off("translator-found", handleTranslatorFound);
      socketService.off("start-call", handleStartCall);
      socketService.off("no-translator-available", handleNoTranslator);
      socketService.off("request-timeout", handleTimeout);
      socketService.off("request-cancelled", handleCancelled);
    };
  }, []);

  const requestTranslator = useCallback(
    (params: RequestParams) => {
      if (!user?.id) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "User not authenticated",
        }));
        return;
      }

      // Reset state
      setState({
        status: "searching",
        roomId: null,
        translator: null,
        availableCount: 0,
        error: null,
      });

      // Send request
      socketService.requestTranslator({
        userId: user.id,
        ...params,
      });
    },
    [user?.id],
  );

  const cancelRequest = useCallback(() => {
    if (state.roomId) {
      socketService.cancelRequest(state.roomId);
    }

    setState({
      status: "idle",
      roomId: null,
      translator: null,
      availableCount: 0,
      error: null,
    });
  }, [state.roomId]);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      roomId: null,
      translator: null,
      availableCount: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    requestTranslator,
    cancelRequest,
    reset,
    isSearching: state.status === "searching",
    isFound: state.status === "found",
    isConnecting: state.status === "connecting",
    hasError:
      state.status === "timeout" ||
      state.status === "no-translators" ||
      state.status === "error",
  };
}

export default useMatching;
