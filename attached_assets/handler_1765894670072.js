/**
 * Socket.io Handler
 * Manages real-time communication for translator requests
 */

// Store online translators
const onlineTranslators = new Map(); // socketId -> translatorData
const onlineUsers = new Map(); // socketId -> userData
const activeRequests = new Map(); // requestId -> requestData

module.exports = (io, socket) => {
  
  /**
   * Translator comes online
   */
  socket.on('translator:online', (data) => {
    const { translatorId, languages, categories, location } = data;
    
    onlineTranslators.set(socket.id, {
      translatorId,
      socketId: socket.id,
      languages, // [{from: 'ka', to: 'en'}, {from: 'en', to: 'ka'}]
      categories, // ['general', 'medical', 'legal']
      location,
      status: 'available',
      onlineSince: new Date()
    });
    
    socket.join('translators');
    console.log(`🟢 Translator online: ${translatorId} (${languages.length} languages)`);
    
    // Emit updated online count
    io.emit('stats:online', { 
      translators: onlineTranslators.size,
      users: onlineUsers.size
    });
  });

  /**
   * Translator goes offline
   */
  socket.on('translator:offline', () => {
    const translator = onlineTranslators.get(socket.id);
    if (translator) {
      console.log(`🔴 Translator offline: ${translator.translatorId}`);
      onlineTranslators.delete(socket.id);
      socket.leave('translators');
    }
  });

  /**
   * User comes online
   */
  socket.on('user:online', (data) => {
    const { userId } = data;
    
    onlineUsers.set(socket.id, {
      userId,
      socketId: socket.id,
      onlineSince: new Date()
    });
    
    socket.join('users');
    console.log(`🟢 User online: ${userId}`);
  });

  /**
   * NEW TRANSLATION REQUEST (Broadcast to matching translators)
   * This is the Bolt-style broadcast logic
   */
  socket.on('request:new', (data) => {
    const { 
      requestId, 
      userId, 
      fromLang, 
      toLang, 
      category, 
      type, // 'instant' or 'scheduled'
      scheduledTime,
      context 
    } = data;

    console.log(`📢 New request: ${fromLang} → ${toLang} (${category}) [${type}]`);

    // Store request
    const request = {
      requestId,
      userId,
      userSocketId: socket.id,
      fromLang,
      toLang,
      category,
      type,
      scheduledTime,
      context,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (type === 'instant' ? 60000 : 7200000)) // 60s or 2h
    };
    activeRequests.set(requestId, request);

    // Find matching translators
    const matchingTranslators = [];
    
    onlineTranslators.forEach((translator, socketId) => {
      // Check if translator supports this language pair
      const supportsLanguage = translator.languages.some(
        lang => lang.from === fromLang && lang.to === toLang
      );
      
      // Check if translator supports this category
      const supportsCategory = translator.categories.includes(category) || 
                               translator.categories.includes('general');
      
      // Check if translator is available
      const isAvailable = translator.status === 'available';
      
      if (supportsLanguage && supportsCategory && isAvailable) {
        matchingTranslators.push({ socketId, translator });
      }
    });

    console.log(`📨 Broadcasting to ${matchingTranslators.length} translators`);

    // Broadcast to matching translators
    matchingTranslators.forEach(({ socketId }) => {
      io.to(socketId).emit('request:incoming', {
        requestId,
        fromLang,
        toLang,
        category,
        type,
        scheduledTime,
        context,
        expiresIn: type === 'instant' ? 45 : 7200, // seconds
        pricePerMinute: getPricePerMinute(category)
      });
    });

    // Notify user how many translators received the request
    socket.emit('request:sent', {
      requestId,
      broadcastedTo: matchingTranslators.length
    });

    // Set timeout for instant requests
    if (type === 'instant') {
      setTimeout(() => {
        const req = activeRequests.get(requestId);
        if (req && req.status === 'pending') {
          req.status = 'expired';
          socket.emit('request:expired', { requestId });
          console.log(`⏰ Request expired: ${requestId}`);
        }
      }, 60000); // 60 seconds
    }
  });

  /**
   * TRANSLATOR ACCEPTS REQUEST (First come, first served)
   */
  socket.on('request:accept', (data) => {
    const { requestId, translatorId } = data;
    const request = activeRequests.get(requestId);
    
    if (!request) {
      socket.emit('request:error', { message: 'მოთხოვნა ვერ მოიძებნა' });
      return;
    }

    if (request.status !== 'pending') {
      socket.emit('request:taken', { 
        requestId, 
        message: 'შეკვეთა უკვე აიღეს' 
      });
      return;
    }

    // Mark request as accepted
    request.status = 'accepted';
    request.translatorId = translatorId;
    request.translatorSocketId = socket.id;
    request.acceptedAt = new Date();

    // Update translator status
    const translator = onlineTranslators.get(socket.id);
    if (translator) {
      translator.status = 'busy';
    }

    console.log(`✅ Request accepted: ${requestId} by ${translatorId}`);

    // Notify translator
    socket.emit('request:confirmed', {
      requestId,
      userId: request.userId,
      message: 'შეკვეთა მიიღე!'
    });

    // Notify user
    io.to(request.userSocketId).emit('request:matched', {
      requestId,
      translatorId,
      message: 'თარჯიმანი მოიძებნა!'
    });

    // Notify other translators that request is taken
    onlineTranslators.forEach((t, socketId) => {
      if (socketId !== socket.id) {
        io.to(socketId).emit('request:taken', { requestId });
      }
    });
  });

  /**
   * CANCEL REQUEST
   */
  socket.on('request:cancel', (data) => {
    const { requestId } = data;
    const request = activeRequests.get(requestId);
    
    if (request && request.status === 'pending') {
      request.status = 'cancelled';
      console.log(`❌ Request cancelled: ${requestId}`);
      
      // Notify all translators
      io.to('translators').emit('request:cancelled', { requestId });
    }
  });

  /**
   * START CALL
   */
  socket.on('call:start', (data) => {
    const { requestId, roomName } = data;
    const request = activeRequests.get(requestId);
    
    if (request) {
      request.status = 'in_call';
      request.callStartedAt = new Date();
      request.roomName = roomName;
      
      // Notify both parties
      io.to(request.userSocketId).emit('call:started', { roomName });
      io.to(request.translatorSocketId).emit('call:started', { roomName });
      
      console.log(`📞 Call started: ${requestId}`);
    }
  });

  /**
   * END CALL
   */
  socket.on('call:end', (data) => {
    const { requestId, duration } = data;
    const request = activeRequests.get(requestId);
    
    if (request) {
      request.status = 'completed';
      request.callEndedAt = new Date();
      request.duration = duration;
      
      // Calculate price
      const pricePerMinute = getPricePerMinute(request.category);
      const totalPrice = Math.ceil(duration / 60) * pricePerMinute;
      
      // Notify both parties
      io.to(request.userSocketId).emit('call:ended', { 
        requestId, 
        duration, 
        totalPrice 
      });
      io.to(request.translatorSocketId).emit('call:ended', { 
        requestId, 
        duration, 
        earnings: totalPrice * 0.7 // 70% to translator
      });
      
      // Update translator status
      const translator = onlineTranslators.get(request.translatorSocketId);
      if (translator) {
        translator.status = 'available';
      }
      
      console.log(`📴 Call ended: ${requestId} (${duration}s, ${totalPrice}₾)`);
    }
  });

  /**
   * DISCONNECT
   */
  socket.on('disconnect', () => {
    // Check if translator
    if (onlineTranslators.has(socket.id)) {
      const translator = onlineTranslators.get(socket.id);
      console.log(`🔴 Translator disconnected: ${translator.translatorId}`);
      onlineTranslators.delete(socket.id);
    }
    
    // Check if user
    if (onlineUsers.has(socket.id)) {
      const user = onlineUsers.get(socket.id);
      console.log(`🔴 User disconnected: ${user.userId}`);
      onlineUsers.delete(socket.id);
    }
    
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
};

/**
 * Get price per minute based on category
 */
function getPricePerMinute(category) {
  const prices = {
    general: 2,
    administrative: 2.5,
    business: 3,
    medical: 4,
    legal: 4,
    ai: 0.5
  };
  return prices[category] || 2;
}

/**
 * Export helpers for use in routes
 */
module.exports.getOnlineTranslators = () => onlineTranslators;
module.exports.getActiveRequests = () => activeRequests;
