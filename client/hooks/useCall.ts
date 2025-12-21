import { useState, useEffect, useCallback, useRef } from "react";
import { socketService } from "@/lib/socket";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Audio } from "expo-av";

export type CallStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";

interface CallState {
  status: CallStatus;
  roomId: string | null;
  duration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  error: string | null;
}

interface CallParams {
  roomId: string;
  translatorName: string;
  translatorId: string;
  category: string;
  pricePerMinute: number;
}

export function useCall() {
  const [state, setState] = useState<CallState>({
    status: "idle",
    roomId: null,
    duration: 0,
    isMuted: false,
    isCameraOff: false,
    isSpeakerOn: true,
    error: null,
  });

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    const cameraResult = await requestCameraPermission();
    const micResult = await requestMicPermission();

    // Set audio mode for call
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return cameraResult.granted && micResult.granted;
  }, [requestCameraPermission, requestMicPermission]);

  // Start duration timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, duration: elapsed }));
      }
    }, 1000);
  }, []);

  // Stop duration timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleCallStarted = (data: { roomId: string }) => {
      setState((prev) => ({
        ...prev,
        status: "connected",
        roomId: data.roomId,
      }));
      startTimer();
    };

    const handleCallEnded = (data: {
      roomId: string;
      duration: number;
      totalPrice: number;
    }) => {
      stopTimer();
      setState((prev) => ({
        ...prev,
        status: "ended",
        duration: data.duration,
      }));
    };

    const handlePeerDisconnected = (data: { reason: string }) => {
      stopTimer();
      setState((prev) => ({
        ...prev,
        status: "ended",
        error: data.reason,
      }));
    };

    socketService.on("call-started", handleCallStarted);
    socketService.on("call-ended", handleCallEnded);
    socketService.on("peer-disconnected", handlePeerDisconnected);

    return () => {
      socketService.off("call-started", handleCallStarted);
      socketService.off("call-ended", handleCallEnded);
      socketService.off("peer-disconnected", handlePeerDisconnected);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  // Start call
  const startCall = useCallback(
    async (params: CallParams) => {
      const hasPermissions = await requestPermissions();

      if (!hasPermissions) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: "Camera and microphone permissions are required",
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        status: "connecting",
        roomId: params.roomId,
      }));

      // Notify server that we're connected
      socketService.notifyCallConnected(params.roomId);

      return true;
    },
    [requestPermissions],
  );

  // End call
  const endCall = useCallback(() => {
    stopTimer();

    if (state.roomId) {
      socketService.endCall(state.roomId, state.duration);
    }

    setState((prev) => ({
      ...prev,
      status: "ended",
    }));

    return state.duration;
  }, [state.roomId, state.duration, stopTimer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setState((prev) => ({ ...prev, isCameraOff: !prev.isCameraOff }));
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(async () => {
    const newSpeakerState = !state.isSpeakerOn;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: !newSpeakerState,
    });

    setState((prev) => ({ ...prev, isSpeakerOn: newSpeakerState }));
  }, [state.isSpeakerOn]);

  // Reset call state
  const reset = useCallback(() => {
    stopTimer();
    setState({
      status: "idle",
      roomId: null,
      duration: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: true,
      error: null,
    });
  }, [stopTimer]);

  return {
    ...state,
    hasPermissions: cameraPermission?.granted && micPermission?.granted,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    reset,
    isConnecting: state.status === "connecting",
    isConnected: state.status === "connected",
    isEnded: state.status === "ended",
  };
}

export default useCall;
