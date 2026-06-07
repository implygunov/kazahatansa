const { Router } = require('express');
const fs = require('fs');
const crypto = require('crypto');
const { authMiddleware, logAction } = require('../middleware');
const config = require('../config');

const router = Router();

function getKey() {
  const hex = config.JAR_ENC_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return Buffer.from(hex, 'hex');
}

// Шифрованная загрузка JAR.
// Файл шифруется на лету AES-256-GCM. Формат потока:
//   MAGIC(4) | VER(1) | IV(12) | CIPHERTEXT(...) | TAG(16)
// Лаунчер расшифровывает тем же ключом из config.JAR_ENC_KEY.
router.get('/download/client', authMiddleware, (req, res) => {
  const key = getKey();
  if (!key) return res.status(500).json({ error: 'enc_key_not_configured' });

  const src = config.JAR_SOURCE_PATH;
  if (!fs.existsSync(src)) return res.status(404).json({ error: 'jar_not_found' });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="client.enc.jar"');
  res.setHeader('X-Encryption', 'AES-256-GCM');

  // Заголовок потока: MAGIC "KZC1" + версия 1 + IV.
  res.write(Buffer.concat([Buffer.from('KZC1'), Buffer.from([1]), iv]));

  const input = fs.createReadStream(src);
  input.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });

  input.pipe(cipher);
  cipher.on('data', (chunk) => res.write(chunk));
  cipher.on('end', () => {
    res.end(cipher.getAuthTag()); // 16-байтный GCM-тег в конце
    logAction('jar_download', `uid:${req.user.id}`, 'aes-256-gcm', req.user);
  });
  cipher.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });
});

module.exports = router;
