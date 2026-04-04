// ── Input validation & sanitisation helpers ───────────────────────────────────

const MAX_TEXT_LENGTH   = 300;   // TTS / general text fields
const MAX_EMAIL_LENGTH  = 254;   // RFC 5321
const MAX_WORD_LENGTH   = 100;   // single word or short phrase

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Reject requests with oversized or malformed text fields. */
function validateTTSInput(req, res, next) {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text must be a non-empty string.' });
  }
  if (text.trim().length === 0) {
    return res.status(400).json({ error: 'text must not be blank.' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
    });
  }
  next();
}

/** Validate attempt route inputs. */
function validateAttemptInput(req, res, next) {
  const { phraseId, userId, attemptNumber, transcript } = req.body;

  if (!phraseId || !isUUID(phraseId)) {
    return res.status(400).json({ error: 'phraseId must be a valid UUID.' });
  }
  if (!userId || !isUUID(userId)) {
    return res.status(400).json({ error: 'userId must be a valid UUID.' });
  }
  const attempt = parseInt(attemptNumber, 10);
  if (isNaN(attempt) || attempt < 1 || attempt > 3) {
    return res.status(400).json({ error: 'attemptNumber must be 1, 2, or 3.' });
  }
  if (transcript !== undefined) {
    if (typeof transcript !== 'string' || transcript.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: `transcript must be a string of ${MAX_TEXT_LENGTH} chars or fewer.`,
      });
    }
  }
  next();
}

/** Validate auth inputs. */
function validateAuthInput(req, res, next) {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || email.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 8–128 characters.' });
  }
  next();
}

/** Validate generate-words inputs. */
function validateGenerateInput(req, res, next) {
  const { userId, level } = req.body;
  if (!userId || !isUUID(userId)) {
    return res.status(400).json({ error: 'userId must be a valid UUID.' });
  }
  const validLevels = ['easy', 'medium', 'hard'];
  if (level && !validLevels.includes(level)) {
    return res.status(400).json({ error: 'level must be easy, medium, or hard.' });
  }
  next();
}

module.exports = {
  validateTTSInput,
  validateAttemptInput,
  validateAuthInput,
  validateGenerateInput,
};
