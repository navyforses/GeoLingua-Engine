import { useEffect, useCallback, useState, useRef } from "react";
import { socketService } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isConnecting.current) return;

    isConnecting.current = true;
    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      isConnecting.current = false;

      // Register as user
      if (user?.id) {
        socketService.registerAsUser(user.id);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      isConnecting.current = false;
    };

    const handleOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("online-count", handleOnlineCount);

    // If already connected
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("online-count", handleOnlineCount);
    };
  }, [isAuthenticated, user?.id]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    onlineCount,
    disconnect,
    socket: socketService,
  };
}

export default useSocket;
