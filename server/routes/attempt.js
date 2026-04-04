const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { transcribeAudio } = require('../services/gemini');
const { analyseAttempt, getFullFeedback } = require('../services/claude');
const { updatePhonemeScores } = require('../services/phonemes');
const authMiddleware = require('../middleware/auth');
const { validateAttemptInput } = require('../middleware/validate');

// Store audio in memory — max 10 MB per upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/attempt
// FormData: audio? (file), transcript? (string), phraseId, userId, attemptNumber
// Either `audio` (transcribed via Gemini) or `transcript` (pre-computed by client) must be present.
router.post('/', authMiddleware, upload.single('audio'), validateAttemptInput, async (req, res) => {
  const { phraseId, userId, attemptNumber, transcript: clientTranscript } = req.body;

  if (!phraseId || !userId || !attemptNumber) {
    return res
      .status(400)
      .json({ error: 'phraseId, userId, and attemptNumber are required.' });
  }

  if (!req.file && !clientTranscript) {
    return res.status(400).json({ error: 'Either audio file or transcript text is required.' });
  }

  const attempt = parseInt(attemptNumber, 10);
  if (isNaN(attempt) || attempt < 1 || attempt > 3) {
    return res.status(400).json({ error: 'attemptNumber must be 1, 2, or 3.' });
  }

  try {
    // Look up the target word
    const { rows: wordRows } = await db.query(
      'SELECT * FROM words WHERE id = $1',
      [phraseId],
    );
    if (wordRows.length === 0) {
      return res.status(404).json({ error: 'Phrase not found.' });
    }
    const word = wordRows[0];

    // Resolve transcript: use client-provided text, or transcribe via Gemini
    let transcript;
    if (clientTranscript && clientTranscript.trim().length > 0) {
      transcript = clientTranscript.trim();
    } else {
      const mimeType = req.file.mimetype || 'audio/webm';
      transcript = await transcribeAudio(req.file.buffer, mimeType);
    }

    let feedback;
    const isFinal = attempt === 3;

    if (!isFinal) {
      // Attempts 1 & 2: quick hint
      feedback = await analyseAttempt(word, transcript, attempt);
    } else {
      // Attempt 3: collect all previous transcripts then get full feedback
      const { rows: prevRows } = await db.query(
        `SELECT transcript, attempt_num
         FROM   session_attempts
         WHERE  user_id  = $1
           AND  word_id  = $2
         ORDER  BY attempt_num ASC`,
        [userId, phraseId],
      );
      const transcripts = [
        ...prevRows.map((r) => r.transcript),
        transcript,
      ];
      feedback = await getFullFeedback(word, transcripts);
    }

    // Persist the attempt
    await db.query(
      `INSERT INTO session_attempts
         (user_id, word_id, transcript, attempt_num, score, phonemes_hit)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        userId,
        phraseId,
        transcript,
        attempt,
        feedback.score ?? null,
        JSON.stringify(feedback.phonemes_hit ?? {}),
      ],
    );

    // Update phoneme scores
    if (feedback.phonemes_hit && typeof feedback.phonemes_hit === 'object') {
      await updatePhonemeScores(userId, feedback.phonemes_hit, 'phonemic', 'general');
    }

    return res.json({
      attempt,
      transcript,
      ...(isFinal ? { fullFeedback: feedback } : { hint: feedback.hint, tongue: feedback.tongue, lips: feedback.lips }),
      score: feedback.score,
      phonemes_hit: feedback.phonemes_hit,
    });
  } catch (err) {
    console.error('POST /api/attempt error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
