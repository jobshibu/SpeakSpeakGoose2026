require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Transcribe an audio buffer using Gemini 1.5 Flash.
 * Preserves mispronunciations exactly as heard (ESL-aware).
 *
 * @param {Buffer} audioBuffer
 * @param {string} mimeType  - e.g. 'audio/webm', 'audio/wav', 'audio/mp4'
 * @returns {Promise<string>} raw transcript
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const audioPart = {
      inlineData: {
        data: audioBuffer.toString('base64'),
        mimeType,
      },
    };

    const prompt =
      'Transcribe this audio exactly as spoken. ' +
      'The speaker is an ESL learner — preserve mispronunciations exactly as heard. ' +
      'Return only the transcript, nothing else.';

    const result = await model.generateContent([prompt, audioPart]);
    const text = result.response.text().trim();

    if (!text) {
      throw new Error('Gemini returned an empty transcript.');
    }

    return text;
  } catch (err) {
    throw new Error(`Gemini transcription failed: ${err.message}`);
  }
}

module.exports = { transcribeAudio };
