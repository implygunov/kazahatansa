// Конфигурация Kazahstan Client — впиши реальные значения перед продакшеном.
// Можно переопределить через переменные окружения (process.env).

module.exports = {
  // --- База данных: MySQL (хостинг Sprinthost) ---
  // Реквизиты берутся в панели Sprinthost -> Базы данных MySQL.
  // Для подключения с Render нужно разрешить удалённый доступ (см. RENDER.md).
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || '',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || '',
  // SSL для внешнего подключения (Sprinthost обычно без SSL — оставь false).
  MYSQL_SSL: process.env.MYSQL_SSL === 'true',

  // --- Оплата: CryptoBot (Crypto Pay API, @CryptoBot / @CryptoTestnetBot) ---
  // Токен берётся в @CryptoBot -> Crypto Pay -> Create App.
  CRYPTOBOT_TOKEN: process.env.CRYPTOBOT_TOKEN || '',
  CRYPTOBOT_API: process.env.CRYPTOBOT_API || 'https://pay.crypt.bot/api',
  // Валюта инвойса по умолчанию (USDT/TON/BTC и т.д.)
  CRYPTOBOT_ASSET: process.env.CRYPTOBOT_ASSET || 'USDT',

  // --- Оплата: СБП (Система быстрых платежей) ---
  // Перевод по номеру телефона на твой счёт. Это ручное подтверждение,
  // без эквайринга и без проверки возраста.
  SBP_PHONE: process.env.SBP_PHONE || '',          // напр. +7XXXXXXXXXX
  SBP_BANK: process.env.SBP_BANK || '',            // напр. Сбербанк / Т-Банк
  SBP_RECEIVER: process.env.SBP_RECEIVER || '',    // ФИО получателя (как в банке)

  // Курс рубля к активу CryptoBot для пересчёта суммы инвойса (1 USDT ~ N руб).
  RUB_PER_ASSET: Number(process.env.RUB_PER_ASSET || 100),

  // --- Шифрование JAR при загрузке ---
  // 32-байтный ключ (hex, 64 символа). Сгенерируй: openssl rand -hex 32
  JAR_ENC_KEY: process.env.JAR_ENC_KEY || '0000000000000000000000000000000000000000000000000000000000000000',
  // Путь к исходному (незашифрованному) jar лаунчера.
  JAR_SOURCE_PATH: process.env.JAR_SOURCE_PATH || require('path').join(__dirname, 'files', 'client.jar'),
};
