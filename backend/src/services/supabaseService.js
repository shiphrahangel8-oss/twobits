import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isSupabaseConfigured } from '../config/env.js';
import { generateSeedData } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.resolve(__dirname, '../../database/localStore.json');

let supabaseClient = null;
let localStore = null;
let remoteCircuitOpenUntil = 0;

function isRemoteTemporarilyUnavailable() {
  return Date.now() < remoteCircuitOpenUntil;
}

function markRemoteUnavailable() {
  // Back off for 30 seconds if DNS/network or remote table is unreachable
  remoteCircuitOpenUntil = Date.now() + 30000;
}

/**
 * Built-in zero-dependency Supabase PostgREST client fallback when @supabase/supabase-js
 * is not present in node_modules. Supports both `await client.from(t).select('*')` and
 * `await client.from(t).select('*').eq(k, v).single()`.
 */
function createRestSupabaseClient(supabaseUrl, apiKey) {
  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  return {
    _isNativeRestClient: true,
    from(table) {
      return {
        select(columns = '*') {
          const executeSelectAll = async () => {
            if (isRemoteTemporarilyUnavailable()) {
              return { data: null, error: new Error('Remote circuit open') };
            }
            try {
              const res = await fetch(
                `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(columns)}`,
                {
                  method: 'GET',
                  headers,
                  signal: AbortSignal.timeout(1200),
                }
              );
              if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
              const data = await res.json();
              return { data, error: null };
            } catch (err) {
              markRemoteUnavailable();
              return { data: null, error: err };
            }
          };

          return {
            then(onFulfilled, onRejected) {
              return executeSelectAll().then(onFulfilled, onRejected);
            },
            eq(field, value) {
              return {
                async single() {
                  if (isRemoteTemporarilyUnavailable()) {
                    return { data: null, error: new Error('Remote circuit open') };
                  }
                  try {
                    const res = await fetch(
                      `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(
                        columns
                      )}&${encodeURIComponent(field)}=eq.${encodeURIComponent(value)}&limit=1`,
                      {
                        method: 'GET',
                        headers,
                        signal: AbortSignal.timeout(1200),
                      }
                    );
                    if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
                    const rows = await res.json();
                    return { data: Array.isArray(rows) ? rows[0] || null : null, error: null };
                  } catch (err) {
                    markRemoteUnavailable();
                    return { data: null, error: err };
                  }
                },
              };
            },
          };
        },
        insert(records) {
          return {
            select() {
              return {
                async single() {
                  if (isRemoteTemporarilyUnavailable()) {
                    return { data: null, error: new Error('Remote circuit open') };
                  }
                  try {
                    const res = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(records),
                      signal: AbortSignal.timeout(1200),
                    });
                    if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
                    const rows = await res.json();
                    return { data: Array.isArray(rows) ? rows[0] || null : rows, error: null };
                  } catch (err) {
                    markRemoteUnavailable();
                    return { data: null, error: err };
                  }
                },
              };
            },
          };
        },
        update(patched) {
          return {
            eq(field, value) {
              return {
                select() {
                  return {
                    async single() {
                      if (isRemoteTemporarilyUnavailable()) {
                        return { data: null, error: new Error('Remote circuit open') };
                      }
                      try {
                        const res = await fetch(
                          `${baseUrl}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(
                            field
                          )}=eq.${encodeURIComponent(value)}`,
                          {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify(patched),
                            signal: AbortSignal.timeout(1200),
                          }
                        );
                        if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
                        const rows = await res.json();
                        return { data: Array.isArray(rows) ? rows[0] || null : rows, error: null };
                      } catch (err) {
                        markRemoteUnavailable();
                        return { data: null, error: err };
                      }
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            async eq(field, value) {
              if (isRemoteTemporarilyUnavailable()) {
                return { error: new Error('Remote circuit open') };
              }
              try {
                const res = await fetch(
                  `${baseUrl}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(
                    field
                  )}=eq.${encodeURIComponent(value)}`,
                  {
                    method: 'DELETE',
                    headers,
                    signal: AbortSignal.timeout(1200),
                  }
                );
                return { error: res.ok ? null : new Error(`HTTP ${res.status}`) };
              } catch (err) {
                markRemoteUnavailable();
                return { error: err };
              }
            },
          };
        },
      };
    },
  };
}

async function initSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (supabaseClient) return supabaseClient;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(env.SUPABASE_URL, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  } catch {
    supabaseClient = createRestSupabaseClient(env.SUPABASE_URL, key);
    return supabaseClient;
  }
}

async function ensureLocalStore() {
  if (localStore) return localStore;
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      localStore = JSON.parse(raw);
      return localStore;
    } catch {
      // recreate if corrupted
    }
  }
  localStore = await generateSeedData();
  saveLocalStore();
  return localStore;
}

function saveLocalStore() {
  if (!localStore) return;
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), 'utf-8');
}

export const db = {
  async getStatus() {
    const configured = isSupabaseConfigured();
    const client = await initSupabaseClient();
    return {
      mode:
        configured && client
          ? 'LIVE_SUPABASE_POSTGRESQL'
          : 'PERSISTENT_DEMO_POSTGRES_COMPATIBLE',
      supabaseConnected: Boolean(configured && client),
      projectRef: env.SUPABASE_PROJECT_REF || 'rdwwbwojqbotvfjbebfb',
      supabaseUrl: configured
        ? env.SUPABASE_URL
        : 'Local Persistent Store (Ready for SUPABASE_URL in .env)',
      serviceRoleProtected: true,
    };
  },

  async getAll(table) {
    const client = await initSupabaseClient();
    if (client && !isRemoteTemporarilyUnavailable()) {
      try {
        const { data, error } = await client.from(table).select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch {
        markRemoteUnavailable();
      }
    }
    const store = await ensureLocalStore();
    return store[table] ? [...store[table]] : [];
  },

  async getById(table, id, idField = 'id') {
    const client = await initSupabaseClient();
    if (client && !isRemoteTemporarilyUnavailable()) {
      try {
        const { data, error } = await client.from(table).select('*').eq(idField, id).single();
        if (!error && data) return data;
      } catch {
        markRemoteUnavailable();
      }
    }
    const store = await ensureLocalStore();
    const rows = store[table] || [];
    return rows.find((r) => String(r[idField]) === String(id)) || null;
  },

  async findOne(table, predicateFn) {
    const rows = await this.getAll(table);
    return rows.find(predicateFn) || null;
  },

  async findMany(table, predicateFn) {
    const rows = await this.getAll(table);
    return predicateFn ? rows.filter(predicateFn) : rows;
  },

  async insert(table, record) {
    const now = new Date().toISOString();
    const row = {
      created_at: now,
      updated_at: now,
      ...record,
    };

    const client = await initSupabaseClient();
    if (client && !isRemoteTemporarilyUnavailable()) {
      try {
        const { data, error } = await client.from(table).insert([row]).select().single();
        if (!error && data) {
          const store = await ensureLocalStore();
          if (!store[table]) store[table] = [];
          store[table].unshift(data);
          saveLocalStore();
          return data;
        }
      } catch {
        markRemoteUnavailable();
      }
    }

    const store = await ensureLocalStore();
    if (!store[table]) store[table] = [];
    store[table].unshift(row);
    saveLocalStore();
    return row;
  },

  async update(table, id, updates, idField = 'id') {
    const now = new Date().toISOString();
    const patched = { ...updates, updated_at: now };

    const client = await initSupabaseClient();
    if (client && !isRemoteTemporarilyUnavailable()) {
      try {
        const { data, error } = await client
          .from(table)
          .update(patched)
          .eq(idField, id)
          .select()
          .single();
        if (!error && data) {
          const store = await ensureLocalStore();
          const idx = (store[table] || []).findIndex((r) => String(r[idField]) === String(id));
          if (idx !== -1) {
            store[table][idx] = { ...store[table][idx], ...data };
            saveLocalStore();
          }
          return data;
        }
      } catch {
        markRemoteUnavailable();
      }
    }

    const store = await ensureLocalStore();
    if (!store[table]) store[table] = [];
    const idx = store[table].findIndex((r) => String(r[idField]) === String(id));
    if (idx === -1) return null;
    store[table][idx] = { ...store[table][idx], ...patched };
    saveLocalStore();
    return store[table][idx];
  },

  async remove(table, id, idField = 'id') {
    const client = await initSupabaseClient();
    if (client && !isRemoteTemporarilyUnavailable()) {
      try {
        await client.from(table).delete().eq(idField, id);
      } catch {
        markRemoteUnavailable();
      }
    }
    const store = await ensureLocalStore();
    if (!store[table]) return false;
    const initialLen = store[table].length;
    store[table] = store[table].filter((r) => String(r[idField]) !== String(id));
    saveLocalStore();
    return store[table].length < initialLen;
  },

  async resetDemoData() {
    localStore = await generateSeedData();
    saveLocalStore();
    return localStore;
  },
};
