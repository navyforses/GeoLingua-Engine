import { useState, useEffect, useCallback, useRef } from "react";
import { socketService } from "@/lib/socket";
import { webRTCService } from "@/lib/webrtc";
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
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "new";
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
    remoteStream: null,
    connectionState: "new",
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
      webRTCService.cleanup();
      setState((prev) => ({
        ...prev,
        status: "ended",
        duration: data.duration,
        remoteStream: null,
      }));
    };

    const handlePeerDisconnected = (data: { reason: string }) => {
      stopTimer();
      webRTCService.cleanup();
      setState((prev) => ({
        ...prev,
        status: "ended",
        error: data.reason,
        remoteStream: null,
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
      webRTCService.cleanup();
    };
  }, [startTimer, stopTimer]);

  // Start call with WebRTC
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

      try {
        // Initialize WebRTC service
        await webRTCService.initialize(params.roomId, {
          onRemoteStream: (stream) => {
            console.log("[useCall] Remote stream received");
            setState((prev) => ({ ...prev, remoteStream: stream }));
          },
          onConnectionStateChange: (connectionState) => {
            console.log("[useCall] Connection state:", connectionState);
            setState((prev) => ({ ...prev, connectionState }));

            if (connectionState === "connected") {
              setState((prev) => ({ ...prev, status: "connected" }));
            } else if (connectionState === "failed" || connectionState === "disconnected") {
              setState((prev) => ({
                ...prev,
                status: "failed",
                error: "Connection lost",
              }));
            }
          },
          onError: (error) => {
            console.error("[useCall] WebRTC error:", error);
            setState((prev) => ({
              ...prev,
              status: "failed",
              error: error.message,
            }));
          },
        });

        // Get local media stream for WebRTC
        await webRTCService.getLocalStream(true, true);

        // Create peer connection
        await webRTCService.createPeerConnection();

        // Notify server that we're connected
        socketService.notifyCallConnected(params.roomId);

        return true;
      } catch (error) {
        console.error("[useCall] Error starting call:", error);
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: "Failed to establish connection",
        }));
        return false;
      }
    },
    [requestPermissions],
  );

  // End call
  const endCall = useCallback(() => {
    stopTimer();
    webRTCService.cleanup();

    if (state.roomId) {
      socketService.endCall(state.roomId, state.duration);
    }

    setState((prev) => ({
      ...prev,
      status: "ended",
      remoteStream: null,
    }));

    return state.duration;
  }, [state.roomId, state.duration, stopTimer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    webRTCService.toggleAudio(!newMuted);
    setState((prev) => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const newCameraOff = !state.isCameraOff;
    webRTCService.toggleVideo(!newCameraOff);
    setState((prev) => ({ ...prev, isCameraOff: newCameraOff }));
  }, [state.isCameraOff]);

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

  // Switch camera
  const switchCamera = useCallback(async () => {
    await webRTCService.switchCamera();
  }, []);

  // Reset call state
  const reset = useCallback(() => {
    stopTimer();
    webRTCService.cleanup();
    setState({
      status: "idle",
      roomId: null,
      duration: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: true,
      error: null,
      remoteStream: null,
      connectionState: "new",
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
    switchCamera,
    reset,
    isConnecting: state.status === "connecting",
    isConnected: state.status === "connected",
    isEnded: state.status === "ended",
  };
}

export default useCall;
