import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

// Get the socket URL - uses the same domain as API
const getSocketUrl = (): string => {
  // Try to get from Expo Constants extra (set in app.config.js)
  const extra = Constants.expoConfig?.extra;

  // Log for debugging
  console.log("Socket URL Debug:", {
    extra,
    EXPO_PUBLIC_DOMAIN: process.env.EXPO_PUBLIC_DOMAIN,
    hostUri: Constants.expoConfig?.hostUri,
  });

  // Priority 1: Check app.config.js extra
  if (extra?.apiDomain) {
    const url = `https://${extra.apiDomain}`;
    console.log("Using socket URL from app.config.js:", url);
    return url;
  }

  // Priority 2: Check environment variable directly
  let host = process.env.EXPO_PUBLIC_DOMAIN || extra?.EXPO_PUBLIC_DOMAIN;
  if (host) {
    // Remove port suffix if present (Replit proxies port 5000 through main domain)
    host = host.replace(/:5000$/, "");
    const url = `https://${host}`;
    console.log("Using socket URL from env:", url);
    return url;
  }

  // Priority 3: For development with Metro bundler on same network
  // The debugger host tells us the IP of the dev machine
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // Extract just the IP/hostname (remove port)
    const devHost = debuggerHost.split(":")[0];
    const url = `http://${devHost}:5000`;
    console.log("Using socket URL from debugger host:", url);
    return url;
  }

  // Last resort fallback (only works on emulator/simulator)
  console.warn("No valid socket URL found, using localhost fallback");
  return "http://localhost:5000";
};
import { getSocketUrl } from "./query-client";

class SocketService {
  private socket: Socket | null = null;

  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) {
      console.log("Socket already connected:", this.socket.id);
      return this.socket;
    }

    const url = getSocketUrl();
    console.log("=== SOCKET CONNECTION ATTEMPT ===");
    console.log("Target URL:", url);
    let url: string;
    try {
      url = getSocketUrl();
    } catch {
      url = "http://localhost:5000";
    }
    console.log("Connecting to socket server:", url);

    this.socket = io(url, {
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on("connect", () => {
      console.log("=== SOCKET CONNECTED ===");
      console.log("Socket ID:", this.socket?.id);
      console.log("Transport:", this.socket?.io.engine.transport.name);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("=== SOCKET DISCONNECTED ===");
      console.log("Reason:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("=== SOCKET CONNECTION ERROR ===");
      console.error("URL attempted:", url);
      console.error("Error:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket reconnecting... attempt ${attemptNumber}`);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error.message);
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
