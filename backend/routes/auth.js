const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { data, save, nextId } = require('../database');
const { JWT_SECRET, authMiddleware } = require('../middleware');

const router = Router();

router.post('/login', (req, res) => {
  const { login, password, captchaToken } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'empty_fields' });
  const user = data.users.find(u => u.username === login || u.email === login);
  if (!user) return res.status(400).json({ error: 'user_not_found' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'wrong_password' });
  if (user.role === 'BANNED') return res.status(403).json({ error: 'banned' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role }, userId: user.id });
});

router.post('/register', (req, res) => {
  const { username, email, password, captchaToken } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'empty_fields' });
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
