'use strict';

require('dotenv').config();
const path = require('path');
const { app } = require('electron');

const DB_TYPE = 'supabase';

let sqliteDb = null;
let supabaseClient = null;

async function initDb() {
  if (DB_TYPE === 'sqlite' || DB_TYPE === 'both') await initSQLite();
  if (DB_TYPE === 'supabase' || DB_TYPE === 'both') await initSupabase();
}

async function initSQLite() {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const dbPath = path.join(app.getPath('userData'), 'StoryWeaver.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) sqliteDb.exec(fs.readFileSync(schemaPath, 'utf8'));
    console.log('[DB] SQLite initialized at', dbPath);
  } catch (err) {
    console.error('[DB] SQLite init failed:', err.message);
  }
}

async function initSupabase() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('[DB] SUPABASE_URL or SUPABASE_ANON_KEY not set');
      return;
    }
    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('[DB] Supabase initialized');
  } catch (err) {
    console.error('[DB] Supabase init failed:', err.message);
  }
}

function dbQuery(sql, params = []) {
  if (!sqliteDb) throw new Error('SQLite not initialized');
  return sqliteDb.prepare(sql).all(...params);
}

function dbRun(sql, params = []) {
  if (!sqliteDb) throw new Error('SQLite not initialized');
  return sqliteDb.prepare(sql).run(...params);
}

function getSupabase() {
  if (!supabaseClient) throw new Error('Supabase not initialized');
  return supabaseClient;
}

module.exports = { initDb, dbQuery, dbRun, getSupabase };
