const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

if (!secret) {
  console.error('\n[Auth] STARTUP FAILED: JWT_SECRET is not defined.');
  console.error('[Auth] Fix: copy .env.example to .env and set your secrets:');
  console.error('[Auth]   cp .env.example .env');
  console.error('[Auth] Then update JWT_SECRET with a strong random value.\n');
  process.exit(1);
}

module.exports = { secret, expiresIn };
