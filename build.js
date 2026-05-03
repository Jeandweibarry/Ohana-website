const fs = require('fs');
const path = require('path');

try {
    // Optional local development support (.env, .env.local, etc.)
    // eslint-disable-next-line global-require
    require('dotenv').config();
} catch (_error) {
    // dotenv is optional; Vercel provides env vars directly.
}

function firstDefinedEnv(keys) {
    for (const key of keys) {
        const value = process.env[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return '';
}

// Canonical names first, then common aliases from Vercel/Supabase exports.
const supabaseUrl = firstDefinedEnv([
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
]);

const supabaseAnonKey = firstDefinedEnv([
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
]);

const configFilePath = path.join(__dirname, 'supabase_config.js');

if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
        !supabaseUrl ? 'SUPABASE_URL' : null,
        !supabaseAnonKey ? 'SUPABASE_ANON_KEY' : null,
    ].filter(Boolean).join(', ');

    const fallbackConfig = 'window.LOCAL_ENV = window.LOCAL_ENV || {};\nwindow.RUNTIME_ENV = window.RUNTIME_ENV || {};\n';
    fs.writeFileSync(configFilePath, fallbackConfig, 'utf8');
    console.log(`Missing ${missing}. Generated empty supabase_config.js; set env vars for local/dev/prod.`);
    process.exit(0);
}

const configContent = `window.LOCAL_ENV = window.LOCAL_ENV || {};
window.RUNTIME_ENV = {
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
};
`;

fs.writeFileSync(configFilePath, configContent, 'utf8');
console.log('Successfully generated supabase_config.js from environment variables.');
