/**
 * services/ipc.js
 * ---------------
 * Typed wrappers around window.ipc.invoke().
 * Always import from here — never call window.ipc directly in components.
 */

const invoke = (channel, payload) => window.ipc.invoke(channel, payload);

export const ai = {
  claude:  (payload) => invoke('ai:claude', payload),   // { messages, systemPrompt?, maxTokens? }
  openai:  (payload) => invoke('ai:openai', payload),   // { messages, model?, maxTokens? }
  gemini:  (payload) => invoke('ai:gemini', payload),   // { prompt, model? }
};

export const finance = {
  coingeckoPrice:  (payload) => invoke('finance:coingecko-price', payload),   // { ids, vsCurrencies? }
  coingeckoMarket: (payload) => invoke('finance:coingecko-market', payload),  // { vsCurrency?, perPage? }
  massiveQuote:    (payload) => invoke('finance:massive-quote', payload),      // { ticker }
  massiveAggs:     (payload) => invoke('finance:massive-aggs', payload),       // { ticker, from, to, multiplier?, timespan? }
  massiveNews:     (payload) => invoke('finance:massive-news', payload),       // { ticker, limit? }
};

export const news = {
  headlines:  (payload) => invoke('news:headlines', payload),   // { country?, category?, q? }
  everything: (payload) => invoke('news:everything', payload),  // { q, sortBy?, pageSize? }
};

export const weather = {
  current:  (payload) => invoke('weather:current', payload),   // { city } or { lat, lon } + { units? }
  forecast: (payload) => invoke('weather:forecast', payload),  // { city } or { lat, lon } + { units?, cnt? }
};

export const drive = {
  listFiles:    (payload) => invoke('drive:list-files', payload),     // { pageSize?, query? }
  downloadFile: (payload) => invoke('drive:download-file', payload),  // { fileId }
};

export const db = {
  query: (sql, params) => invoke('db:query', { sql, params }),
  run:   (sql, params) => invoke('db:run',   { sql, params }),
};

export const story = {
  analyze: (payload) => invoke('story:analyze', payload),  // { text, existingCharacters?, existingLocations? }
  format:  (payload) => invoke('story:format',  payload),  // { content, format }
  chat:    (payload) => invoke('story:chat',     payload),  // { messages, projectContext }
};
