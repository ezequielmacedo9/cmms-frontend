// Injects Vercel environment variables into environment.prod.ts at build time.
// Optional Vercel env vars: NG_APP_GOOGLE_CLIENT_ID, NG_APP_API_URL, NG_APP_SENTRY_DSN
const { writeFileSync } = require('fs');
const { join } = require('path');

const googleClientId = process.env['NG_APP_GOOGLE_CLIENT_ID'] || '';
const apiUrl = process.env['NG_APP_API_URL'] || 'https://cmms-backend-8y7h.onrender.com';
const sentryDsn = process.env['NG_APP_SENTRY_DSN'] || '';

if (!googleClientId) {
  console.warn('[set-env] WARNING: NG_APP_GOOGLE_CLIENT_ID is not set. Google login will be disabled.');
}

// IMPORTANTE: este objeto deve conter TODAS as chaves usadas em environment.ts,
// senao o build de producao quebra com TS2339 (ex.: main.ts le environment.sentryDsn).
const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  googleClientId: '${googleClientId}',
  sentryDsn: '${sentryDsn}'
};
`;

const targetPath = join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
writeFileSync(targetPath, content, 'utf8');
console.log('[set-env] environment.prod.ts generated (googleClientId:', !!googleClientId, '| sentryDsn:', !!sentryDsn, ')');
