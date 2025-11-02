import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Слишком много попыток входа. Пожалуйста, попробуйте через несколько минут.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Слишком много попыток входа',
      message: 'Вы превысили лимит попыток входа. Пожалуйста, подождите 15 минут и попробуйте снова.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

