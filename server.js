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
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});
