import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/.env (and root .env if present)
function loadEnvFile() {
  const candidatePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (process.env[key] === undefined || process.env[key] === '') {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnvFile();

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'resolveai_super_secret_enterprise_jwt_key_2026_local_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF || 'rdwwbwojqbotvfjbebfb',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

export function isSupabaseConfigured() {
  return Boolean(
    env.SUPABASE_URL &&
      env.SUPABASE_URL.startsWith('http') &&
      (env.SUPABASE_SERVICE_ROLE_KEY ||
        env.SUPABASE_SECRET_KEY ||
        env.SUPABASE_ANON_KEY ||
        env.SUPABASE_PUBLISHABLE_KEY)
  );
}

export function isGeminiConfigured() {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10);
}
