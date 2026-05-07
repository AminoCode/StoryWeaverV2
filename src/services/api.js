'use strict';

require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { restClient: MassiveClient } = require('@polygon.io/client-js');
const NewsAPI = require('newsapi');
const { google } = require('googleapis');

const apiClients = {};

function initApis() {
  if (process.env.ANTHROPIC_API_KEY) {
    apiClients.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('[API] Anthropic Claude initialized');
  } else { console.warn('[API] ANTHROPIC_API_KEY not set'); }

  if (process.env.OPENAI_API_KEY) {
    apiClients.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[API] OpenAI initialized');
  } else { console.warn('[API] OPENAI_API_KEY not set'); }

  if (process.env.GEMINI_API_KEY) {
    apiClients.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('[API] Gemini initialized');
  } else { console.warn('[API] GEMINI_API_KEY not set'); }

  if (process.env.MASSIVE_API_KEY) {
    apiClients.massive = MassiveClient(process.env.MASSIVE_API_KEY);
    console.log('[API] MASSIVE (Polygon.io) initialized');
  } else { console.warn('[API] MASSIVE_API_KEY not set'); }

  if (process.env.NEWSAPI_KEY) {
    apiClients.newsapi = new NewsAPI(process.env.NEWSAPI_KEY);
    console.log('[API] NewsAPI initialized');
  } else { console.warn('[API] NEWSAPI_KEY not set'); }

  if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_ACCESS_TOKEN) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );
    auth.setCredentials({
      access_token: process.env.GOOGLE_DRIVE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });
    apiClients.googleDrive = google.drive({ version: 'v3', auth });
    console.log('[API] Google Drive initialized');
  } else { console.warn('[API] Google Drive credentials incomplete — see ARCHITECTURE.md'); }

  // CoinGecko and OpenWeatherMap are REST-only via fetch — no client needed
  if (process.env.OPENWEATHER_API_KEY) {
    console.log('[API] OpenWeatherMap ready');
  } else { console.warn('[API] OPENWEATHER_API_KEY not set'); }

  console.log('[API] CoinGecko ready (key optional)');

  // Finnhub — optional, uncomment to enable:
  // const finnhub = require('finnhub');
  // if (process.env.FINNHUB_API_KEY) {
  //   const key = finnhub.ApiClient.instance.authentications['api_key'];
  //   key.apiKey = process.env.FINNHUB_API_KEY;
  //   apiClients.finnhub = new finnhub.DefaultApi();
  // }
}

module.exports = { apiClients, initApis };
