/**
 * AI Translator Service
 * Real-time translation using OpenAI Whisper + GPT
 */

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language codes mapping
const languageNames = {
  ka: "Georgian",
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  ru: "Russian",
  tr: "Turkish",
  he: "Hebrew",
  ar: "Arabic",
  el: "Greek",
  nl: "Dutch",
  pl: "Polish",
  uk: "Ukrainian",
  zh: "Chinese",
  ja: "Japanese",
};

/**
 * Transcribe audio using Whisper
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} language - Source language code
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioBuffer, language) {
  try {
    // Create a file-like object from buffer
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: language,
      response_format: "text",
    });

    return transcription;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("აუდიოს ტრანსკრიფციის შეცდომა");
  }
}

/**
 * Translate text using GPT-4
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language code
 * @param {string} toLang - Target language code
 * @param {string} context - Optional context (medical, legal, etc.)
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, fromLang, toLang, context = "general") {
  try {
    const fromLanguage = languageNames[fromLang] || fromLang;
    const toLanguage = languageNames[toLang] || toLang;

    let systemPrompt = `You are a professional translator. Translate the following text from ${fromLanguage} to ${toLanguage}. 
    Provide only the translation, no explanations or additional text.`;

    // Add context-specific instructions
    if (context === "medical") {
      systemPrompt += ` Use appropriate medical terminology. Be precise with medical terms.`;
    } else if (context === "legal") {
      systemPrompt += ` Use appropriate legal terminology. Be precise with legal terms.`;
    } else if (context === "business") {
      systemPrompt += ` Use professional business language.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("თარგმანის შეცდომა");
  }
}

/**
 * Generate speech from text using TTS
 * @param {string} text - Text to convert to speech
 * @param {string} language - Target language code
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeech(text, language) {
  try {
    // Select appropriate voice based on language
    const voiceMap = {
      ka: "nova", // No Georgian voice, using default
      en: "alloy",
      de: "nova",
      fr: "shimmer",
      it: "nova",
      es: "nova",
      ru: "nova",
      default: "alloy",
    };

    const voice = voiceMap[language] || voiceMap.default;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error("ხმის გენერაციის შეცდომა");
  }
}

/**
 * Full translation pipeline: Audio -> Text -> Translation -> Audio
 * @param {Buffer} audioBuffer - Input audio
 * @param {string} fromLang - Source language
 * @param {string} toLang - Target language
 * @param {string} context - Translation context
 * @returns {Promise<Object>} - Transcription, translation, and audio
 */
async function fullTranslationPipeline(
  audioBuffer,
  fromLang,
  toLang,
  context = "general",
) {
  try {
    // Step 1: Transcribe
    const transcription = await transcribeAudio(audioBuffer, fromLang);
    console.log(`📝 Transcribed: "${transcription}"`);

    // Step 2: Translate
    const translation = await translateText(
      transcription,
      fromLang,
      toLang,
      context,
    );
    console.log(`🌐 Translated: "${translation}"`);

    // Step 3: Generate speech
    const audioOutput = await textToSpeech(translation, toLang);
    console.log(`🔊 Audio generated: ${audioOutput.length} bytes`);

    return {
      originalText: transcription,
      translatedText: translation,
      audioBuffer: audioOutput,
    };
  } catch (error) {
    console.error("Pipeline error:", error);
    throw error;
  }
}

/**
 * Estimate translation cost
 * @param {number} durationSeconds - Estimated duration in seconds
 * @returns {Object} - Cost breakdown
 */
function estimateCost(durationSeconds) {
  // Approximate costs based on OpenAI pricing
  const minuteCount = Math.ceil(durationSeconds / 60);

  // Whisper: ~$0.006 per minute
  const whisperCost = minuteCount * 0.006;

  // GPT-4: ~$0.03 per 1K tokens (estimate 200 tokens per minute)
  const gptCost = minuteCount * 0.03 * 0.2;

  // TTS: ~$0.015 per 1K characters (estimate 500 chars per minute)
  const ttsCost = minuteCount * 0.015 * 0.5;

  const totalCost = whisperCost + gptCost + ttsCost;

  // Convert to GEL (approximate rate)
  const gelRate = 2.7;
  const costInGel = totalCost * gelRate;

  return {
    whisperCost,
    gptCost,
    ttsCost,
    totalUSD: totalCost.toFixed(4),
    totalGEL: costInGel.toFixed(2),
    pricePerMinuteGEL: (costInGel / minuteCount).toFixed(2),
  };
}

module.exports = {
  transcribeAudio,
  translateText,
  textToSpeech,
  fullTranslationPipeline,
  estimateCost,
};
