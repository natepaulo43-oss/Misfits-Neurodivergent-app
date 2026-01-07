const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * Central configuration with sensible OWASP-aligned defaults.
 * Use environment variables to tune these without changing code.
 */
const {
  PORT = 4000,
  RATE_LIMIT_WINDOW_MINUTES = '15',
  RATE_LIMIT_IP_MAX = '100',
  RATE_LIMIT_USER_MAX = '200',
  RATE_LIMIT_KEY_HEADER = 'x-user-id',
  CORS_ORIGIN = '*',
  TRUST_PROXY = 'true',
} = process.env;

const app = express();
const windowMs = Number(RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000;

if (TRUST_PROXY === 'true') {
  // Required for Express to see the real IP when behind reverse proxies (Expo tunnels, CloudFront, etc.).
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN.split(',').map(origin => origin.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

const build429Response = (detail) => ({
  error: 'rate_limit_exceeded',
  message: detail,
  retryAfterMs: windowMs,
});

const ipLimiter = rateLimit({
  windowMs,
  max: Number(RATE_LIMIT_IP_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(build429Response('Too many requests from this IP address. Please retry later.'));
  },
});

const userLimiter = rateLimit({
  windowMs,
  max: Number(RATE_LIMIT_USER_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => !req.header(RATE_LIMIT_KEY_HEADER),
  keyGenerator: req => req.header(RATE_LIMIT_KEY_HEADER) || req.ip,
  handler: (req, res) => {
    res.status(429).json(build429Response('Too many requests from this user account. Please retry later.'));
  },
});

app.use(ipLimiter);
app.use(userLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Endpoint not found.' });
});

const server = app.listen(PORT, () => {
  console.log(`Security gateway listening on port ${PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
