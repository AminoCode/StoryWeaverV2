'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

const { apiClients, initApis } = require('./src/services/api');
const { initDb, dbQuery, dbRun } = require('./src/services/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  await initDb();
  initApis();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ── AI ────────────────────────────────────────────────────────────────────────

ipcMain.handle('ai:claude', async (event, { messages, systemPrompt, maxTokens = 1024 }) => {
  const response = await apiClients.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });
  return response.content[0].text;
});

// ── Story: Analyze text for entities (uses Haiku for low token cost) ──────────
ipcMain.handle('story:analyze', async (event, { text, existingCharacters = [], existingLocations = [] }) => {
  if (!apiClients.anthropic) throw new Error('Anthropic API not initialized');
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
  const existing = `Existing characters: ${existingCharacters.join(', ') || 'none'}. Existing locations: ${existingLocations.join(', ') || 'none'}.`;
  const response = await apiClients.anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system: 'You are a story element extractor. Return ONLY valid JSON with no commentary or markdown. Extract ONLY elements explicitly present in the text. Max 4 items per category. Be concise in descriptions (under 20 words each).',
    messages: [{
      role: 'user',
      content: `${existing}\n\nText:\n${plainText}\n\nReturn JSON:\n{"characters":[{"name":"","role":"protagonist|antagonist|supporting|ally|minor","description":""}],"locations":[{"name":"","type":"city|building|dungeon|district|alley|other","description":"","atmosphere":""}],"events":[{"title":"","description":"","importance":"major|minor|background"}],"items":[{"name":"","type":"weapon|reward|object|artifact|other","description":""}]}`
    }],
  });
  return response.content[0].text;
});

// ── Story: Reformat text in different writing styles ──────────────────────────
ipcMain.handle('story:format', async (event, { content, format }) => {
  if (!apiClients.anthropic) throw new Error('Anthropic API not initialized');
  const SYSTEM_PROMPTS = {
    novel:      'You are a professional novel formatter. Reformat the text as standard literary prose with paragraph breaks, dialogue in quotation marks, and immersive descriptive narrative. Preserve all story content.',
    screenplay: 'You are a professional screenplay formatter. Reformat as a Hollywood screenplay: INT./EXT. scene headings in CAPS, action lines in present tense, CHARACTER NAMES centered above dialogue, (parentheticals) where needed. Preserve all story content.',
    stage_play: 'You are a professional playwright. Reformat as a stage play script: CHARACTER NAME in CAPS followed by colon and dialogue, stage directions in [brackets], ACT/SCENE headers. Preserve all story content.',
    tv_script:  'You are a professional TV writer. Reformat as a TV script with TEASER/ACT structure, scene headings, character names centered, dialogue and parentheticals. Preserve all story content.',
    magazine:   'You are a professional magazine editor. Reformat as a compelling magazine article with a strong headline, subheadings, pull quotes in italics, and journalistic prose. Preserve all story content.',
  };
  const plainText = content.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const response = await apiClients.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPTS[format] || SYSTEM_PROMPTS.novel,
    messages: [{ role: 'user', content: `Reformat this text:\n\n${plainText}` }],
  });
  return response.content[0].text;
});

// ── Story: AI assistant chat with project context ─────────────────────────────
ipcMain.handle('story:chat', async (event, { messages, projectContext }) => {
  if (!apiClients.anthropic) throw new Error('Anthropic API not initialized');
  const response = await apiClients.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a smart, creative writing partner for a story called "${projectContext.name}". You know the story deeply.\n\nCharacters: ${projectContext.characters}\nLocations: ${projectContext.locations}\nRecent events: ${projectContext.events}\n\nBe concise, insightful, and creatively helpful. Answer questions, suggest ideas, flag inconsistencies.`,
    messages,
  });
  return response.content[0].text;
});

ipcMain.handle('ai:openai', async (event, { messages, model = 'gpt-4o', maxTokens = 1024 }) => {
  const response = await apiClients.openai.chat.completions.create({ model, max_tokens: maxTokens, messages });
  return response.choices[0].message.content;
});

ipcMain.handle('ai:gemini', async (event, { prompt, model = 'gemini-pro' }) => {
  const geminiModel = apiClients.gemini.getGenerativeModel({ model });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
});

// ── Finance ───────────────────────────────────────────────────────────────────

ipcMain.handle('finance:coingecko-price', async (event, { ids, vsCurrencies = 'usd' }) => {
  const headers = process.env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } : {};
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`, { headers });
  return res.json();
});

ipcMain.handle('finance:coingecko-market', async (event, { vsCurrency = 'usd', perPage = 20 }) => {
  const headers = process.env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } : {};
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=1`, { headers });
  return res.json();
});

ipcMain.handle('finance:massive-quote', async (event, { ticker }) => {
  return apiClients.massive.stocks.previousClose(ticker, { adjusted: true });
});

ipcMain.handle('finance:massive-aggs', async (event, { ticker, multiplier = 1, timespan = 'day', from, to }) => {
  return apiClients.massive.stocks.aggregates(ticker, multiplier, timespan, from, to, { adjusted: true });
});

ipcMain.handle('finance:massive-news', async (event, { ticker, limit = 10 }) => {
  return apiClients.massive.reference.tickerNews({ ticker, limit });
});

// ── News ──────────────────────────────────────────────────────────────────────

ipcMain.handle('news:headlines', async (event, { country = 'us', category, q } = {}) => {
  return apiClients.newsapi.v2.topHeadlines({ country, category, q });
});

ipcMain.handle('news:everything', async (event, { q, sortBy = 'publishedAt', pageSize = 20 }) => {
  return apiClients.newsapi.v2.everything({ q, sortBy, pageSize });
});

// ── Weather ───────────────────────────────────────────────────────────────────

ipcMain.handle('weather:current', async (event, { city, lat, lon, units = 'imperial' }) => {
  const base = 'https://api.openweathermap.org/data/2.5/weather';
  const loc = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city)}`;
  const res = await fetch(`${base}?${loc}&units=${units}&appid=${process.env.OPENWEATHER_API_KEY}`);
  return res.json();
});

ipcMain.handle('weather:forecast', async (event, { city, lat, lon, units = 'imperial', cnt = 40 }) => {
  const base = 'https://api.openweathermap.org/data/2.5/forecast';
  const loc = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city)}`;
  const res = await fetch(`${base}?${loc}&units=${units}&cnt=${cnt}&appid=${process.env.OPENWEATHER_API_KEY}`);
  return res.json();
});

// ── Google Drive ──────────────────────────────────────────────────────────────

ipcMain.handle('drive:list-files', async (event, { pageSize = 20, query = '' } = {}) => {
  const res = await apiClients.googleDrive.files.list({
    pageSize,
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
  });
  return res.data.files;
});

ipcMain.handle('drive:download-file', async (event, { fileId }) => {
  const res = await apiClients.googleDrive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data).toString('base64');
});

// ── Supabase config (for renderer to init Supabase client) ───────────────────
ipcMain.handle('supabase:config', () => ({
  url:     process.env.SUPABASE_URL      || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
}));

// ── Database ──────────────────────────────────────────────────────────────────

ipcMain.handle('db:query', async (event, { sql, params = [] }) => dbQuery(sql, params));
ipcMain.handle('db:run',   async (event, { sql, params = [] }) => dbRun(sql, params));
