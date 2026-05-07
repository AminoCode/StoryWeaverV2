'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  channels: [
    'ai:claude', 'ai:openai', 'ai:gemini',
    'finance:coingecko-price', 'finance:coingecko-market',
    'finance:massive-quote', 'finance:massive-aggs', 'finance:massive-news',
    'news:headlines', 'news:everything',
    'weather:current', 'weather:forecast',
    'drive:list-files', 'drive:download-file',
    'db:query', 'db:run',
  ],
});
