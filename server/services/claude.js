require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL_FAST = 'claude-haiku-4-5-20251001';  // hints — low latency
const MODEL_FULL = 'claude-sonnet-4-6';           // full feedback + word gen

/** Strip markdown fences and extract the first valid JSON object or array. */
function stripFences(raw) {
  // Remove code fences
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // Extract first JSON array or object if there's surrounding text
  const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  const objectMatch = cleaned.match(/(\{[\s\S]*\})/);

  if (arrayMatch) return arrayMatch[1];
  if (objectMatch) return objectMatch[1];
  return cleaned;
}

/** Call Claude and return the response text. */
async function callClaude(systemPrompt, userMessage, maxTokens = 1024, model = MODEL_FULL) {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
}

/**
 * Analyse a single attempt.
 * @param {Object} word         - full word row from DB (word, ipa, phonemic, syllabic, accentual, intonational)
 * @param {string} transcript   - what the learner was heard to say
 * @param {number} attemptNumber - 1 or 2
 * Returns: { phonemes_hit, primary_error, hint, tongue, lips, score }
 */
async function analyseAttempt(word, transcript, attemptNumber) {
  try {
    const system =
      'You are a warm, encouraging ESL pronunciation coach. ' +
      'You analyse what a learner said versus what they should have said, ' +
      'and give one short, specific, actionable hint to help them improve ' +
      'on their next attempt. Never be discouraging. Always be precise ' +
      'about the mouth position, tongue placement, or breath technique ' +
      'needed. Respond only in valid JSON — no markdown, no preamble.';

    const user =
      `A learner is practising this word:\n\n` +
      `Word: "${word.word}"\n` +
      `IPA: "${word.ipa}"\n\n` +
      `Phonemic detail: ${word.phonemic?.detail || ''}\n` +
      `Syllabic detail: ${word.syllabic?.detail || ''}\n` +
      `Accentual detail: ${word.accentual?.detail || ''}\n` +
      `Intonational detail: ${word.intonational?.detail || ''}\n\n` +
      `This is attempt ${attemptNumber} of 3.\n` +
      `The learner was heard to say: "${transcript}"\n\n` +
      `Your job:\n` +
      `1. Compare what they said to the target word\n` +
      `2. Identify the single most important error\n` +
      `3. Give one hint that will most improve their next attempt\n\n` +
      `Rules for the hint:\n` +
      `- Maximum 20 words\n` +
      `- Warm and encouraging tone\n` +
      `- Name the specific sound or pattern to fix\n` +
      `- Never say "try again" or "good effort" — be specific and useful\n\n` +
      `Return only this JSON:\n` +
      `{\n` +
      `  "phonemes_hit": { "/ð/": false, "/ɛ/": true },\n` +
      `  "primary_error": "/ð/",\n` +
      `  "hint": "Your hint here — one sentence, max 20 words.",\n` +
      `  "tongue": "One sentence on tongue position for the primary error.",\n` +
      `  "lips": "One sentence on lip shape for the primary error.",\n` +
      `  "score": 0.65\n` +
      `}\n\n` +
      `Score guide:\n` +
      `0.0–0.3  = significantly different from target\n` +
      `0.4–0.6  = partially correct, key sounds missing\n` +
      `0.7–0.85 = mostly correct, minor issues\n` +
      `0.86–1.0 = very close or perfect\n\n` +
      `Only include phonemes that actually appear in this word's IPA.\n` +
      `phonemes_hit keys must use the IPA symbol wrapped in forward slashes.`;

    const raw = await callClaude(system, user, 512, MODEL_FAST);
    const parsed = JSON.parse(stripFences(raw));

    if (
      typeof parsed.score !== 'number' ||
      typeof parsed.phonemes_hit !== 'object'
    ) {
      throw new Error('Claude returned malformed analyseAttempt JSON.');
    }

    return parsed;
  } catch (err) {
    throw new Error(`analyseAttempt failed: ${err.message}`);
  }
}

/**
 * Get full feedback after all three attempts.
 * Returns: { phonemes_hit, score, phonemeBreakdown, advice, drill }
 */
async function getFullFeedback(word, transcripts) {
  try {
    const system =
      'You are a warm, encouraging ESL pronunciation coach. ' +
      'You will receive a target word and up to three transcripts of a learner attempting it. ' +
      'Analyse their progress across attempts and return ONLY a valid JSON object — ' +
      'no markdown fences, no preamble, no trailing text.';

    const attemptList = transcripts
      .map((t, i) => `Attempt ${i + 1}: "${t}"`)
      .join('\n');

    const user =
      `Target word: "${typeof word === 'object' ? word.word : word}"\n` +
      (typeof word === 'object' && word.ipa ? `IPA: "${word.ipa}"\n` : '') +
      `\nLearner transcripts:\n${attemptList}\n\n` +
      `Return ONLY this JSON object (no extra text before or after):\n` +
      `{\n` +
      `  "phonemes_hit": { "/ð/": false, "/ɛ/": true },\n` +
      `  "score": 0.65,\n` +
      `  "phonemeBreakdown": [\n` +
      `    { "phoneme": "/ð/", "status": "missed", "note": "brief note" }\n` +
      `  ],\n` +
      `  "advice": "2 to 3 encouraging sentences about overall performance.",\n` +
      `  "drill": "One specific physical exercise to practise the main error."\n` +
      `}\n\n` +
      `Rules:\n` +
      `- phonemes_hit keys must use IPA wrapped in forward slashes\n` +
      `- status must be exactly "hit", "missed", or "partial"\n` +
      `- score: 0.0–0.3 very different, 0.4–0.6 partial, 0.7–0.85 mostly correct, 0.86–1.0 excellent\n` +
      `- Only include phonemes that actually appear in the target word's IPA\n` +
      `- Do NOT wrap the response in markdown code fences`;

    const raw = await callClaude(system, user, 1024, MODEL_FULL);
    console.log('[getFullFeedback] raw Claude response:', raw.slice(0, 300));

    const parsed = JSON.parse(stripFences(raw));

    if (typeof parsed.score !== 'number') {
      throw new Error(`missing or non-numeric score field`);
    }
    if (!Array.isArray(parsed.phonemeBreakdown)) {
      parsed.phonemeBreakdown = [];
    }
    if (!parsed.phonemes_hit || typeof parsed.phonemes_hit !== 'object') {
      parsed.phonemes_hit = {};
    }

    return parsed;
  } catch (err) {
    throw new Error(`getFullFeedback failed: ${err.message}`);
  }
}

/**
 * Generate 8 new words targeting the learner's weak phonemes.
 * Returns an array of word objects validated for required fields.
 */
async function generateWords(level, weakPhonemes, seenWords = []) {
  try {
    const system =
      'You are a linguist and ESL curriculum designer. ' +
      'Respond with ONLY a valid JSON array — no markdown, no explanation.';

    const phonemeList =
      weakPhonemes.length > 0
        ? weakPhonemes.join(', ')
        : 'general English phonemes';

    const seenList =
      seenWords.length > 0
        ? `\nAvoid these already-seen words: ${seenWords.join(', ')}`
        : '';

    const user =
      `Generate 8 English words at "${level}" difficulty that practise these phonemes: ${phonemeList}.${seenList}\n\n` +
      'Return a JSON array where every object has exactly these fields:\n' +
      '[\n' +
      '  {\n' +
      '    "word": "<string>",\n' +
      '    "ipa": "<IPA string>",\n' +
      '    "level": "<easy|medium|hard>",\n' +
      '    "targets": ["<phoneme>", ...],\n' +
      '    "phonemic":     { "tag": "<string>", "detail": "<string>" },\n' +
      '    "syllabic":     { "tag": "<string>", "detail": "<string>" },\n' +
      '    "accentual":    { "tag": "<string>", "detail": "<string>" },\n' +
      '    "intonational": { "tag": "<string>", "detail": "<string>" }\n' +
      '  }\n' +
      ']';

    const raw = await callClaude(system, user, 4096);
    const parsed = JSON.parse(stripFences(raw));

    if (!Array.isArray(parsed)) {
      throw new Error('Claude generateWords did not return an array.');
    }

    const requiredKeys = [
      'word', 'ipa', 'level', 'targets',
      'phonemic', 'syllabic', 'accentual', 'intonational',
    ];

    const validated = parsed.filter((item) => {
      if (typeof item !== 'object' || item === null) return false;
      return requiredKeys.every((k) => Object.prototype.hasOwnProperty.call(item, k));
    });

    if (validated.length === 0) {
      throw new Error('Claude generateWords: no valid word objects in response.');
    }

    return validated;
  } catch (err) {
    throw new Error(`generateWords failed: ${err.message}`);
  }
}

module.exports = { analyseAttempt, getFullFeedback, generateWords };
