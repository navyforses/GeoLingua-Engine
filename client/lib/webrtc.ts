/**
 * WebRTC Service for GeoLingua
 * Handles peer-to-peer video/audio connections
 *
 * NOTE: This requires react-native-webrtc which needs a development build.
 * It will NOT work in Expo Go.
 */

import { socketService } from "./socket";

// WebRTC configuration with STUN/TURN servers
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Add TURN server for better connectivity (you can use a service like Twilio or Xirsys)
    // {
    //   urls: "turn:your-turn-server.com:3478",
    //   username: "user",
    //   credential: "password",
    // },
  ],
  iceCandidatePoolSize: 10,
};

export type WebRTCState = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "new";
  isConnected: boolean;
};

type WebRTCCallbacks = {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
};

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private callbacks: WebRTCCallbacks = {};
  private isInitiator: boolean = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  /**
   * Initialize WebRTC service and set up socket listeners
   */
  async initialize(roomId: string, callbacks: WebRTCCallbacks = {}): Promise<void> {
    this.roomId = roomId;
    this.callbacks = callbacks;

    // Set up socket event listeners
    this.setupSocketListeners();

    console.log("[WebRTC] Initialized for room:", roomId);
  }

  /**
   * Set up socket event listeners for WebRTC signaling
   */
  private setupSocketListeners(): void {
    // Receive offer from remote peer
    socketService.on("offer", async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[WebRTC] Received offer from:", data.from);
      await this.handleOffer(data.offer);
    });

    // Receive answer from remote peer
    socketService.on("answer", async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[WebRTC] Received answer from:", data.from);
      await this.handleAnswer(data.answer);
    });

    // Receive ICE candidate from remote peer
    socketService.on("ice-candidate", async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log("[WebRTC] Received ICE candidate");
      await this.handleIceCandidate(data.candidate);
    });

    // Call started - initiate WebRTC connection
    socketService.on("start-call", async (data: { roomId: string; initiator: string }) => {
      console.log("[WebRTC] Start call, initiator:", data.initiator);
      const socket = socketService.getSocket();
      this.isInitiator = socket?.id === data.initiator;

      if (this.isInitiator) {
        await this.createOffer();
      }
    });
  }

  /**
   * Get local media stream (camera and microphone)
   */
  async getLocalStream(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream | null> {
    try {
      // Check if we're in a browser environment or React Native
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          } : false,
          audio: audioEnabled ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } : false,
        });

        this.localStream = stream;
        console.log("[WebRTC] Got local stream");
        return stream;
      } else {
        console.warn("[WebRTC] MediaDevices not available - use expo-camera for local preview");
        return null;
      }
    } catch (error) {
      console.error("[WebRTC] Error getting local stream:", error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Create peer connection and add local tracks
   */
  async createPeerConnection(): Promise<RTCPeerConnection> {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    this.peerConnection = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks from remote peer
    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind);

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      this.remoteStream.addTrack(event.track);
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        console.log("[WebRTC] Sending ICE candidate");
        socketService.sendIceCandidate(this.roomId, event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || "new";
      console.log("[WebRTC] Connection state:", state);
      this.callbacks.onConnectionStateChange?.(state);
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", this.peerConnection?.iceConnectionState);
    };

    // Handle negotiation needed
    this.peerConnection.onnegotiationneeded = async () => {
      console.log("[WebRTC] Negotiation needed");
      if (this.isInitiator) {
        await this.createOffer();
      }
    };

    console.log("[WebRTC] Peer connection created");
    return this.peerConnection;
  }

  /**
   * Create and send offer (called by initiator)
   */
  async createOffer(): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }

      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection!.setLocalDescription(offer);

      if (this.roomId) {
        socketService.sendOffer(this.roomId, offer);
        console.log("[WebRTC] Offer sent");
      }
    } catch (error) {
      console.error("[WebRTC] Error creating offer:", error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle received offer and send answer
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any pending ICE candidates
      await this.processPendingCandidates();

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      if (this.roomId) {
        socketService.sendAnswer(this.roomId, answer);
        console.log("[WebRTC] Answer sent");
      }
    } catch (error) {
      console.error("[WebRTC] Error handling offer:", error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle received answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.warn("[WebRTC] No peer connection for answer");
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Process any pending ICE candidates
      await this.processPendingCandidates();

      console.log("[WebRTC] Answer processed");
    } catch (error) {
      console.error("[WebRTC] Error handling answer:", error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle received ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection || !this.peerConnection.remoteDescription) {
        // Queue candidate if remote description not set yet
        this.pendingCandidates.push(candidate);
        console.log("[WebRTC] Queued ICE candidate");
        return;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("[WebRTC] ICE candidate added");
    } catch (error) {
      console.error("[WebRTC] Error adding ICE candidate:", error);
    }
  }

  /**
   * Process pending ICE candidates after remote description is set
   */
  private async processPendingCandidates(): Promise<void> {
    if (!this.peerConnection || this.pendingCandidates.length === 0) return;

    console.log("[WebRTC] Processing", this.pendingCandidates.length, "pending candidates");

    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("[WebRTC] Error adding pending candidate:", error);
      }
    }

    this.pendingCandidates = [];
  }

  /**
   * Toggle local audio track
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("[WebRTC] Audio", enabled ? "enabled" : "disabled");
    }
  }

  /**
   * Toggle local video track
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("[WebRTC] Video", enabled ? "enabled" : "disabled");
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack && typeof (videoTrack as any)._switchCamera === "function") {
      // react-native-webrtc specific
      (videoTrack as any)._switchCamera();
      console.log("[WebRTC] Camera switched");
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RTCPeerConnectionState | "new" {
    return this.peerConnection?.connectionState || "new";
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    const state = this.peerConnection?.connectionState;
    return state === "connected";
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Clean up and close connection
   */
  cleanup(): void {
    console.log("[WebRTC] Cleaning up...");

    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Remove socket listeners
    socketService.off("offer");
    socketService.off("answer");
    socketService.off("ice-candidate");
    socketService.off("start-call");

    // Clear pending candidates
    this.pendingCandidates = [];

    this.roomId = null;
    this.callbacks = {};
    this.isInitiator = false;

    console.log("[WebRTC] Cleanup complete");
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
