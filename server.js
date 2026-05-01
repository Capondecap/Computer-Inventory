const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('\n[Server] STARTUP FAILED: .env file not found.');
  console.error('[Server] Fix: run the following command in the project root:');
  console.error('[Server]   cp .env.example .env');
  console.error('[Server] Then update the values in .env before starting.\n');
  process.exit(1);
}

require('dotenv').config();

// Validate required environment variables before loading anything else
const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n[Server] STARTUP FAILED: missing required env vars: ${missing.join(', ')}`);
  console.error('[Server] Copy .env.example to .env and fill in all values.\n');
  process.exit(1);
}
if (!process.env.ALLOWED_ORIGINS) {
  console.warn('[Server] WARNING: ALLOWED_ORIGINS is not set — defaulting to http://localhost:3000');
}
if (!process.env.NODE_ENV) {
  console.warn('[Server] WARNING: NODE_ENV is not set — defaulting to development');
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});
