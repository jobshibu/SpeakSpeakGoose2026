require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Default to a well-known free voice if ELEVENLABS_VOICE_ID is not set
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

/**
 * Convert text to speech via ElevenLabs and return a base64-encoded MP3.
 *
 * @param {string} text      - Text to synthesise
 * @param {number} speed     - Speaking rate (0.5–2.0, default 0.85 for ESL clarity)
 * @returns {Promise<string>} base64 MP3 audio
 */
async function textToSpeech(text, speed = 0.85) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set.');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`;

  const payload = {
    text,
    model_id: 'eleven_flash_v2_5',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      speed,
    },
  };

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(`ElevenLabs network error: ${err.message}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return base64;
}

module.exports = { textToSpeech };
