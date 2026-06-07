const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { data, save, nextId } = require('../database');
const { JWT_SECRET, authMiddleware } = require('../middleware');
const { TURNSTILE_SECRET } = require('../config');

const router = Router();

// Проверка токена Cloudflare Turnstile на сервере.
// Если секрет не задан (.env пустой) — пропускаем, чтобы не блокировать вход.
async function verifyCaptcha(token, ip) {
  if (!TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
    if (ip) body.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const result = await r.json();
    return !!result.success;
  } catch (e) {
    return false;
  }
}

router.post('/login', async (req, res) => {
  const { login, password, captchaToken } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'empty_fields' });
  if (!(await verifyCaptcha(captchaToken, req.ip))) return res.status(400).json({ error: 'captcha_failed' });
  const user = data.users.find(u => u.username === login || u.email === login);
  if (!user) return res.status(400).json({ error: 'user_not_found' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'wrong_password' });
  if (user.role === 'BANNED') return res.status(403).json({ error: 'banned' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role }, userId: user.id });
});

router.post('/register', async (req, res) => {
  const { username, email, password, captchaToken } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'empty_fields' });
  if (!(await verifyCaptcha(captchaToken, req.ip))) return res.status(400).json({ error: 'captcha_failed' });
  if (data.users.find(u => u.username === username)) return res.status(400).json({ error: 'username_exists' });
  if (data.users.find(u => u.email === email)) return res.status(400).json({ error: 'email_exists' });
  const hashed = bcrypt.hashSync(password, 10);
  const user = {
    id: nextId('users'),
    username,
    email,
    password: hashed,
    role: 'DEFAULT',
    hwid: null,
    subscription_until: null,
    premium_until: null,
    ram: 2048,
    created_at: new Date().toISOString(),
  };
  data.users.push(user);
  data.stats.users = data.users.length;
  save();
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role }, userId: user.id });
});

router.get('/profile/:id', authMiddleware, (req, res) => {
  const user = data.users.find(u => u.id === parseInt(req.params.id) || u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  const now = new Date();
  const sub = user.subscription_until ? new Date(user.subscription_until) > now : false;
  const prem = user.premium_until ? new Date(user.premium_until) > now : false;
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hwid: user.hwid,
      subscription_until: user.subscription_until,
      premium_until: user.premium_until,
      ram: user.ram || 2048,
      created_at: user.created_at,
    },
    subscriptionActive: sub || ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(user.role),
    premiumActive: prem || ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(user.role),
  });
});

module.exports = router;
