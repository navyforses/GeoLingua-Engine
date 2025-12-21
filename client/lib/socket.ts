import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

// Get the API URL from environment or use default
const getSocketUrl = (): string => {
  // In development, use the local server
  if (__DEV__) {
    // For Expo, we need to use the correct host
    const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
    if (debuggerHost) {
      return `http://${debuggerHost}:5000`;
    }
    return "http://localhost:5000";
  }

  // In production, use the production server URL
  return process.env.EXPO_PUBLIC_API_URL || "https://your-production-url.com";
};

class SocketService {
  private socket: Socket | null = null;

  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const url = getSocketUrl();
    console.log("Connecting to socket server:", url);

    this.socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Register as user
  registerAsUser(userId: string): void {
    this.socket?.emit("register", { type: "user", id: userId });
  }

  // Register as translator
  registerAsTranslator(translatorId: string): void {
    this.socket?.emit("register", { type: "translator", id: translatorId });
  }

  // Set translator availability
  setAvailability(available: boolean): void {
    this.socket?.emit("set-availability", { available });
  }

  // Request a translator
  requestTranslator(data: {
    userId: string;
    fromLang: string;
    toLang: string;
    category: string;
    type: "instant" | "scheduled";
  }): void {
    this.socket?.emit("request-translator", data);
  }

  // Accept a request (for translators)
  acceptRequest(roomId: string): void {
    this.socket?.emit("accept-request", { roomId });
  }

  // Reject a request (for translators)
  rejectRequest(roomId: string): void {
    this.socket?.emit("reject-request", { roomId });
  }

  // Cancel a request (for users)
  cancelRequest(roomId: string): void {
    this.socket?.emit("cancel-request", { roomId });
  }

  // WebRTC Signaling
  sendOffer(roomId: string, offer: RTCSessionDescriptionInit): void {
    this.socket?.emit("offer", { roomId, offer });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit): void {
    this.socket?.emit("answer", { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit("ice-candidate", { roomId, candidate });
  }

  // Call connected
  notifyCallConnected(roomId: string): void {
    this.socket?.emit("call-connected", { roomId });
  }

  // End call
  endCall(roomId: string, duration: number): void {
    this.socket?.emit("end-call", { roomId, duration });
  }

  // Event listeners

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);

    // Track listeners for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
      this.listeners.get(event)?.delete(callback);
    } else {
      this.socket?.off(event);
      this.listeners.delete(event);
    }
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.off(event, callback);
      });
    });
    this.listeners.clear();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
