const cors = require("cors");

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, server-to-server, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
});

module.exports = corsMiddleware;
