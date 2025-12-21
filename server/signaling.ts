import { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";

interface CallRoom {
  id: string;
  userId: string;
  translatorId: string;
  userSocketId: string | null;
  translatorSocketId: string | null;
  status: "waiting" | "connecting" | "active" | "ended";
  createdAt: Date;
  category: string;
  fromLang: string;
  toLang: string;
  pricePerMinute: number;
}

interface TranslatorPresence {
  socketId: string;
  translatorId: string;
  isAvailable: boolean;
  languages: { from: string; to: string }[];
  categories: string[];
}

interface MatchRequest {
  userId: string;
  fromLang: string;
  toLang: string;
  category: string;
  type: "instant" | "scheduled";
}

// Store active rooms and translator presence
const activeRooms = new Map<string, CallRoom>();
const translatorPresence = new Map<string, TranslatorPresence>();
const userSockets = new Map<string, string>(); // odId -> socketId

export function initializeSignaling(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // User or Translator registration
    socket.on(
      "register",
      async (data: { type: "user" | "translator"; id: string }) => {
        if (data.type === "user") {
          userSockets.set(data.id, socket.id);
          socket.join(`user:${data.id}`);
          console.log(`User registered: ${data.id}`);
        } else if (data.type === "translator") {
          const translator = await storage.getTranslator(data.id);
          if (translator) {
            translatorPresence.set(socket.id, {
              socketId: socket.id,
              translatorId: data.id,
              isAvailable: true,
              languages: translator.languages as { from: string; to: string }[],
              categories: translator.categories as string[],
            });
            socket.join(`translator:${data.id}`);
            socket.join("translators:online");

            // Update translator online status in DB
            await storage.updateTranslatorOnline(data.id, true);

            // Broadcast updated online count
            const onlineTranslators = await storage.getOnlineTranslators();
            io.emit("online-count", { count: onlineTranslators.length });

            console.log(`Translator registered: ${data.id}`);
          }
        }
      },
    );

    // Translator availability toggle
    socket.on("set-availability", async (data: { available: boolean }) => {
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        presence.isAvailable = data.available;
        translatorPresence.set(socket.id, presence);

        await storage.updateTranslatorOnline(
          presence.translatorId,
          data.available,
        );

        const onlineTranslators = await storage.getOnlineTranslators();
        io.emit("online-count", { count: onlineTranslators.length });
      }
    });

    // User requests a translator
    socket.on("request-translator", async (data: MatchRequest) => {
      console.log(`Match request from user ${data.userId}:`, data);

      // Find available translators matching criteria
      const availableTranslators: TranslatorPresence[] = [];

      translatorPresence.forEach((presence) => {
        if (!presence.isAvailable) return;

        // Check language match
        const languageMatch = presence.languages.some(
          (lang) => lang.from === data.fromLang && lang.to === data.toLang,
        );

        // Check category match
        const categoryMatch = presence.categories.includes(data.category);

        if (languageMatch && categoryMatch) {
          availableTranslators.push(presence);
        }
      });

      if (availableTranslators.length === 0) {
        socket.emit("no-translator-available", {
          message: "No translators available for your request",
        });
        return;
      }

      // Create a room for this request
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const room: CallRoom = {
        id: roomId,
        userId: data.userId,
        translatorId: "",
        userSocketId: socket.id,
        translatorSocketId: null,
        status: "waiting",
        createdAt: new Date(),
        category: data.category,
        fromLang: data.fromLang,
        toLang: data.toLang,
        pricePerMinute: 2, // Default, should be fetched from category
      };

      activeRooms.set(roomId, room);
      socket.join(roomId);

      // Notify user that we're searching
      socket.emit("searching", {
        roomId,
        availableCount: availableTranslators.length,
      });

      // Broadcast to matching translators
      availableTranslators.forEach((translator) => {
        io.to(translator.socketId).emit("incoming-request", {
          roomId,
          userId: data.userId,
          fromLang: data.fromLang,
          toLang: data.toLang,
          category: data.category,
        });
      });

      // Set timeout for no response
      setTimeout(() => {
        const currentRoom = activeRooms.get(roomId);
        if (currentRoom && currentRoom.status === "waiting") {
          socket.emit("request-timeout", { roomId });
          activeRooms.delete(roomId);
        }
      }, 60000); // 60 second timeout
    });

    // Translator accepts request
    socket.on("accept-request", async (data: { roomId: string }) => {
      const room = activeRooms.get(data.roomId);
      const presence = translatorPresence.get(socket.id);

      if (!room || !presence) {
        socket.emit("error", { message: "Room or translator not found" });
        return;
      }

      if (room.status !== "waiting") {
        socket.emit("error", { message: "Request already accepted" });
        return;
      }

      // Update room
      room.translatorId = presence.translatorId;
      room.translatorSocketId = socket.id;
      room.status = "connecting";
      activeRooms.set(data.roomId, room);

      // Mark translator as busy
      presence.isAvailable = false;
      translatorPresence.set(socket.id, presence);

      // Join the room
      socket.join(data.roomId);

      // Get translator info
      const translator = await storage.getTranslator(presence.translatorId);

      // Notify user
      if (room.userSocketId) {
        io.to(room.userSocketId).emit("translator-found", {
          roomId: data.roomId,
          translator: {
            id: translator?.id,
            name: translator?.name,
            rating: translator?.rating,
          },
        });
      }

      // Tell both parties to start WebRTC connection
      io.to(data.roomId).emit("start-call", {
        roomId: data.roomId,
        initiator: room.userSocketId,
      });

      console.log(
        `Translator ${presence.translatorId} accepted request for room ${data.roomId}`,
      );
    });

    // Translator rejects request
    socket.on("reject-request", (data: { roomId: string }) => {
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        console.log(
          `Translator ${presence.translatorId} rejected request for room ${data.roomId}`,
        );
      }
      // Request will timeout naturally if no one accepts
    });

    // WebRTC Signaling: Offer
    socket.on(
      "offer",
      (data: { roomId: string; offer: RTCSessionDescriptionInit }) => {
        socket.to(data.roomId).emit("offer", {
          offer: data.offer,
          from: socket.id,
        });
      },
    );

    // WebRTC Signaling: Answer
    socket.on(
      "answer",
      (data: { roomId: string; answer: RTCSessionDescriptionInit }) => {
        socket.to(data.roomId).emit("answer", {
          answer: data.answer,
          from: socket.id,
        });
      },
    );

    // WebRTC Signaling: ICE Candidate
    socket.on(
      "ice-candidate",
      (data: { roomId: string; candidate: RTCIceCandidateInit }) => {
        socket.to(data.roomId).emit("ice-candidate", {
          candidate: data.candidate,
          from: socket.id,
        });
      },
    );

    // Call connected
    socket.on("call-connected", async (data: { roomId: string }) => {
      const room = activeRooms.get(data.roomId);
      if (room) {
        room.status = "active";
        activeRooms.set(data.roomId, room);

        // Create call record in database
        const categoryData = await storage.getCategory(room.category);
        await storage.createCall({
          userId: room.userId,
          translatorId: room.translatorId,
          fromLang: room.fromLang,
          toLang: room.toLang,
          category: room.category,
          status: "active",
          pricePerMinute: categoryData?.pricePerMinute || 2,
        });

        io.to(data.roomId).emit("call-started", { roomId: data.roomId });
        console.log(`Call started in room ${data.roomId}`);
      }
    });

    // End call
    socket.on(
      "end-call",
      async (data: { roomId: string; duration: number }) => {
        const room = activeRooms.get(data.roomId);
        if (room) {
          room.status = "ended";

          // Calculate price
          const minutes = Math.ceil(data.duration / 60);
          const totalPrice = minutes * room.pricePerMinute;

          // Update call in database
          await storage.updateCall(data.roomId, {
            status: "completed",
            duration: data.duration,
            totalPrice,
            endedAt: new Date(),
          });

          // Notify both parties
          io.to(data.roomId).emit("call-ended", {
            roomId: data.roomId,
            duration: data.duration,
            totalPrice,
          });

          // Make translator available again
          if (room.translatorSocketId) {
            const presence = translatorPresence.get(room.translatorSocketId);
            if (presence) {
              presence.isAvailable = true;
              translatorPresence.set(room.translatorSocketId, presence);
            }
          }

          // Cleanup
          activeRooms.delete(data.roomId);
          console.log(
            `Call ended in room ${data.roomId}, duration: ${data.duration}s, price: ${totalPrice}₾`,
          );
        }
      },
    );

    // Cancel request
    socket.on("cancel-request", (data: { roomId: string }) => {
      const room = activeRooms.get(data.roomId);
      if (room && room.status === "waiting") {
        io.to(data.roomId).emit("request-cancelled", { roomId: data.roomId });
        activeRooms.delete(data.roomId);
        console.log(`Request cancelled for room ${data.roomId}`);
      }
    });

    // Disconnect handling
    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Handle translator disconnect
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        await storage.updateTranslatorOnline(presence.translatorId, false);
        translatorPresence.delete(socket.id);

        const onlineTranslators = await storage.getOnlineTranslators();
        io.emit("online-count", { count: onlineTranslators.length });

        // End any active calls
        activeRooms.forEach((room, roomId) => {
          if (
            room.translatorSocketId === socket.id &&
            room.status === "active"
          ) {
            io.to(roomId).emit("peer-disconnected", {
              reason: "Translator disconnected",
            });
          }
        });
      }

      // Handle user disconnect
      userSockets.forEach((socketId, odId) => {
        if (socketId === socket.id) {
          userSockets.delete(odId);

          // End any active calls
          activeRooms.forEach((room, roomId) => {
            if (room.userSocketId === socket.id && room.status === "active") {
              io.to(roomId).emit("peer-disconnected", {
                reason: "User disconnected",
              });
            }
          });
        }
      });
    });
  });

  console.log("Signaling server initialized");
  return io;
}

// Helper to get online translator count
export function getOnlineTranslatorCount(): number {
  let count = 0;
  translatorPresence.forEach((presence) => {
    if (presence.isAvailable) count++;
  });
  return count;
}

// Helper to get active calls count
export function getActiveCallsCount(): number {
  let count = 0;
  activeRooms.forEach((room) => {
    if (room.status === "active") count++;
  });
  return count;
}
