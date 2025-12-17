/**
 * Request Routes
 * Handle translation requests (instant and scheduled)
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

/**
 * Create new translation request
 * POST /api/requests
 */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      fromLang,
      toLang,
      category,
      type, // 'instant' or 'scheduled'
      scheduledTime,
      estimatedDuration,
      context,
      useAI, // true for AI translator
    } = req.body;

    // Validate
    if (!userId || !fromLang || !toLang || !category || !type) {
      return res.status(400).json({
        error: "გთხოვთ შეავსოთ ყველა სავალდებულო ველი",
      });
    }

    const requestId = uuidv4();
    const pricePerMinute = useAI ? 0.5 : getPriceForCategory(category);

    // Save to database
    const { data: request, error } = await supabase
      .from("requests")
      .insert({
        id: requestId,
        user_id: userId,
        from_lang: fromLang,
        to_lang: toLang,
        category,
        type,
        scheduled_time: scheduledTime,
        estimated_duration: estimatedDuration,
        context,
        use_ai: useAI || false,
        price_per_minute: pricePerMinute,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // If AI translator, no need to broadcast
    if (useAI) {
      return res.json({
        message: "AI თარჯიმანი მზადაა",
        request: {
          ...request,
          aiReady: true,
        },
      });
    }

    // For human translator, return request ID for socket broadcast
    res.status(201).json({
      message: "მოთხოვნა შეიქმნა",
      request,
      // Client should now emit 'request:new' via socket
      broadcastRequired: true,
    });
  } catch (error) {
    console.error("Request creation error:", error);
    res.status(500).json({ error: "მოთხოვნის შექმნის შეცდომა" });
  }
});

/**
 * Get user's requests history
 * GET /api/requests/user/:userId
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20 } = req.query;

    let query = supabase
      .from("requests")
      .select(
        `
        *,
        translator:translator_id (
          id,
          full_name,
          avatar_url
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    res.json({ requests });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ error: "მოთხოვნების მიღების შეცდომა" });
  }
});

/**
 * Get translator's received requests
 * GET /api/requests/translator/:translatorId
 */
router.get("/translator/:translatorId", async (req, res) => {
  try {
    const { translatorId } = req.params;
    const { status, limit = 20 } = req.query;

    let query = supabase
      .from("requests")
      .select(
        `
        *,
        user:user_id (
          id,
          full_name
        )
      `,
      )
      .eq("translator_id", translatorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    res.json({ requests });
  } catch (error) {
    console.error("Get translator requests error:", error);
    res.status(500).json({ error: "მოთხოვნების მიღების შეცდომა" });
  }
});

/**
 * Cancel request
 * POST /api/requests/:id/cancel
 */
router.post("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(400).json({
        error: "მოთხოვნა ვერ გაუქმდა",
      });
    }

    res.json({
      message: "მოთხოვნა გაუქმდა",
      request: data,
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({ error: "გაუქმების შეცდომა" });
  }
});

function getPriceForCategory(category) {
  const prices = {
    general: 2,
    administrative: 2.5,
    business: 3,
    medical: 4,
    legal: 4,
  };
  return prices[category] || 2;
}

module.exports = router;
