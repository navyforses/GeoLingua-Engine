/**
 * Call Routes
 * Handle video calls using Twilio
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const twilio = require('twilio');

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

/**
 * Create video room and get access token
 * POST /api/calls/token
 */
router.post('/token', async (req, res) => {
  try {
    const { identity, roomName, requestId } = req.body;

    if (!identity || !roomName) {
      return res.status(400).json({ 
        error: 'identity და roomName სავალდებულოა' 
      });
    }

    // Create access token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity }
    );

    // Grant access to video room
    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    // Update request with room info
    if (requestId) {
      await supabase
        .from('requests')
        .update({ 
          room_name: roomName,
          status: 'connecting'
        })
        .eq('id', requestId);
    }

    res.json({
      token: token.toJwt(),
      roomName,
      identity
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'ტოკენის გენერაციის შეცდომა' });
  }
});

/**
 * Start call (update database)
 * POST /api/calls/start
 */
router.post('/start', async (req, res) => {
  try {
    const { requestId, translatorId } = req.body;

    const { data, error } = await supabase
      .from('calls')
      .insert({
        request_id: requestId,
        translator_id: translatorId,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update request status
    await supabase
      .from('requests')
      .update({ status: 'in_call' })
      .eq('id', requestId);

    res.json({
      message: 'ზარი დაიწყო',
      call: data
    });

  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({ error: 'ზარის დაწყების შეცდომა' });
  }
});

/**
 * End call
 * POST /api/calls/end
 */
router.post('/end', async (req, res) => {
  try {
    const { callId, duration } = req.body;

    // Get call details
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*, request:request_id(*)')
      .eq('id', callId)
      .single();

    if (callError) throw callError;

    // Calculate price
    const pricePerMinute = call.request.price_per_minute;
    const minutes = Math.ceil(duration / 60);
    const totalPrice = minutes * pricePerMinute;
    const translatorEarnings = totalPrice * 0.7;
    const platformFee = totalPrice * 0.3;

    // Update call
    const { data, error } = await supabase
      .from('calls')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration,
        total_price: totalPrice,
        translator_earnings: translatorEarnings,
        platform_fee: platformFee
      })
      .eq('id', callId)
      .select()
      .single();

    if (error) throw error;

    // Update request status
    await supabase
      .from('requests')
      .update({ status: 'completed' })
      .eq('id', call.request_id);

    res.json({
      message: 'ზარი დასრულდა',
      call: data,
      billing: {
        duration,
        minutes,
        pricePerMinute,
        totalPrice,
        translatorEarnings,
        platformFee
      }
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'ზარის დასრულების შეცდომა' });
  }
});

/**
 * Rate call
 * POST /api/calls/:id/rate
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, ratedBy } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'შეფასება უნდა იყოს 1-დან 5-მდე' 
      });
    }

    const updateField = ratedBy === 'user' 
      ? { user_rating: rating, user_comment: comment }
      : { translator_rating: rating, translator_comment: comment };

    const { data, error } = await supabase
      .from('calls')
      .update(updateField)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'შეფასება მიღებულია',
      call: data
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'შეფასების შეცდომა' });
  }
});

module.exports = router;
