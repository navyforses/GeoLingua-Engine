/**
 * Translator Routes
 * Manage translator profiles and availability
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { getOnlineTranslators } = require("../sockets/handler");

/**
 * Get all available languages
 * GET /api/translators/languages
 */
router.get("/languages", (req, res) => {
  const languages = [
    { code: "ka", name: "ქართული", flag: "🇬🇪" },
    { code: "en", name: "ინგლისური", flag: "🇺🇸" },
    { code: "de", name: "გერმანული", flag: "🇩🇪" },
    { code: "fr", name: "ფრანგული", flag: "🇫🇷" },
    { code: "it", name: "იტალიური", flag: "🇮🇹" },
    { code: "es", name: "ესპანური", flag: "🇪🇸" },
    { code: "ru", name: "რუსული", flag: "🇷🇺" },
    { code: "tr", name: "თურქული", flag: "🇹🇷" },
    { code: "he", name: "ებრაული", flag: "🇮🇱" },
    { code: "ar", name: "არაბული", flag: "🇸🇦" },
    { code: "el", name: "ბერძნული", flag: "🇬🇷" },
    { code: "nl", name: "ჰოლანდიური", flag: "🇳🇱" },
    { code: "pl", name: "პოლონური", flag: "🇵🇱" },
    { code: "uk", name: "უკრაინული", flag: "🇺🇦" },
    { code: "zh", name: "ჩინური", flag: "🇨🇳" },
    { code: "ja", name: "იაპონური", flag: "🇯🇵" },
  ];

  res.json({ languages });
});

/**
 * Get all categories with prices
 * GET /api/translators/categories
 */
router.get("/categories", (req, res) => {
  const categories = [
    { id: "general", name: "ზოგადი", icon: "💬", pricePerMinute: 2 },
    {
      id: "administrative",
      name: "ადმინისტრაციული",
      icon: "📄",
      pricePerMinute: 2.5,
    },
    { id: "business", name: "ბიზნესი", icon: "💼", pricePerMinute: 3 },
    { id: "medical", name: "სამედიცინო", icon: "🏥", pricePerMinute: 4 },
    { id: "legal", name: "იურიდიული", icon: "⚖️", pricePerMinute: 4 },
  ];

  res.json({ categories });
});

/**
 * Create/Update translator profile
 * POST /api/translators/profile
 */
router.post("/profile", async (req, res) => {
  try {
    const {
      userId,
      languages, // [{from: 'ka', to: 'en'}, ...]
      categories,
      bio,
      location,
      priceModifier, // optional: premium translators can charge more
    } = req.body;

    const { data, error } = await supabase
      .from("translator_profiles")
      .upsert({
        user_id: userId,
        languages,
        categories,
        bio,
        location,
        price_modifier: priceModifier || 1.0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "პროფილი განახლდა",
      profile: data,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "პროფილის განახლების შეცდომა" });
  }
});

/**
 * Get online translators count by language
 * GET /api/translators/online
 */
router.get("/online", (req, res) => {
  const online = getOnlineTranslators();

  // Count by language pair
  const byLanguage = {};
  online.forEach((translator) => {
    translator.languages.forEach((lang) => {
      const pair = `${lang.from}-${lang.to}`;
      byLanguage[pair] = (byLanguage[pair] || 0) + 1;
    });
  });

  res.json({
    total: online.size,
    byLanguage,
  });
});

/**
 * Get translator statistics
 * GET /api/translators/:id/stats
 */
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    // Get completed calls
    const { data: calls, error } = await supabase
      .from("calls")
      .select("duration, category, created_at, rating")
      .eq("translator_id", id)
      .eq("status", "completed");

    if (error) throw error;

    // Calculate stats
    const totalCalls = calls.length;
    const totalMinutes = calls.reduce((sum, c) => sum + c.duration / 60, 0);
    const avgRating =
      calls.length > 0
        ? calls.reduce((sum, c) => sum + (c.rating || 0), 0) /
          calls.filter((c) => c.rating).length
        : 0;

    // Earnings (70% of total)
    const totalEarnings = calls.reduce((sum, c) => {
      const price = getPriceForCategory(c.category);
      return sum + Math.ceil(c.duration / 60) * price * 0.7;
    }, 0);

    res.json({
      totalCalls,
      totalMinutes: Math.round(totalMinutes),
      avgRating: avgRating.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "სტატისტიკის მიღების შეცდომა" });
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
