// Injects Vercel environment variables into environment.prod.ts at build time.
// Required Vercel env vars: NG_APP_GOOGLE_CLIENT_ID, NG_APP_API_URL (optional)
const { writeFileSync } = require('fs');
const { join } = require('path');

const googleClientId = process.env['NG_APP_GOOGLE_CLIENT_ID'] || '';
const apiUrl = process.env['NG_APP_API_URL'] || 'https://cmms-backend-8y7h.onrender.com';

if (!googleClientId) {
  console.warn('[set-env] WARNING: NG_APP_GOOGLE_CLIENT_ID is not set. Google login will be disabled.');
}

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  googleClientId: '${googleClientId}'
};
`;

const targetPath = join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
writeFileSync(targetPath, content, 'utf8');
console.log('[set-env] environment.prod.ts generated (googleClientId set:', !!googleClientId, ')');
