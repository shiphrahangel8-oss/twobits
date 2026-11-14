import crypto from 'crypto';
import { env } from '../config/env.js';

let bcryptLib = null;
let jwtLib = null;

try {
  const bModule = await import('bcryptjs');
  bcryptLib = bModule.default || bModule;
} catch {
  bcryptLib = null;
}

try {
  const jModule = await import('jsonwebtoken');
  jwtLib = jModule.default || jModule;
} catch {
  jwtLib = null;
}

export async function hashPassword(plainPassword) {
  if (bcryptLib) {
    return bcryptLib.hash(plainPassword, 10);
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('scrypt$')) {
    const [, salt, key] = storedHash.split('$');
    const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
  }
  if (bcryptLib && (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$'))) {
    return bcryptLib.compare(plainPassword, storedHash);
  }
  return plainPassword === storedHash;
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signToken(payload) {
  if (jwtLib) {
    return jwtLib.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 24 * 60 * 60;
  const fullPayload = { ...payload, iat: now, exp };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(fullPayload))}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${unsigned}.${signature}`;
}

export function verifyToken(token) {
  if (jwtLib) {
    return jwtLib.verify(token, env.JWT_SECRET);
  }
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token structure');
  const [headerB64, payloadB64, signature] = parts;
  const unsigned = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signature !== expectedSig) throw new Error('Invalid token signature');
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}
