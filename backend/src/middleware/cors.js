const cors = require("cors");

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

// Allow any *.vercel.app deployment (covers preview + production URLs)
const ALLOWED_PATTERNS = [
  /^https:\/\/.*\.vercel\.app$/,
];

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (ALLOWED_PATTERNS.some(re => re.test(origin))) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
});

module.exports = corsMiddleware;
