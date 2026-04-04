const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res
      .status(400)
      .json({ error: 'password must be at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email.toLowerCase().trim(), passwordHash],
    );

    const user = rows[0];

    // Create companion user_stats row
    await db.query(
      `INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.id],
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(201).json({ token, userId: user.id, email: user.email });
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error('POST /api/auth/register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.json({ token, userId: user.id, email: user.email });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
