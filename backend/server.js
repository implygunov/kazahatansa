const express = require('express');
const cors = require('cors');
const path = require('path');

const { init } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/profile'));
app.use('/api', require('./routes/keys'));
app.use('/api', require('./routes/promocodes'));
app.use('/api', require('./routes/tickets'));
app.use('/api', require('./routes/stats'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/payments'));
app.use('/api', require('./routes/download'));

app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') res.set('Content-Type', 'text/html; charset=utf-8');
    else if (ext === '.css') res.set('Content-Type', 'text/css; charset=utf-8');
    else if (ext === '.js') res.set('Content-Type', 'application/javascript; charset=utf-8');
    else if (ext === '.svg') res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  }
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Kazahstan Client Server running at http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Не удалось подключиться к MySQL:', e.message);
    process.exit(1);
  });
