# StoryWeaver — Architecture Reference

> Read this before writing any code. Also read DESIGN.md before writing any UI.

---

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Desktop shell | Electron |
| Local DB | better-sqlite3 (SQLite) |
| Cloud DB | Supabase (PostgreSQL) |
| IPC | Electron ipcMain / contextBridge |

---

## Mental Model

```
React (renderer)
    ↓  window.ipc.invoke('channel:action', payload)
preload.js (bridge)
    ↓  ipcRenderer.invoke
main.js (main process)
    ↓  API client or DB call
External service / SQLite / Supabase
    ↓  returns data
main.js → renderer → React state update
```

The renderer never calls APIs or DBs directly. Everything goes through IPC.

---

## IPC Channels

| Channel | Payload | Returns |
|---------|---------|---------|
| `ai:claude` | `{ messages, systemPrompt?, maxTokens? }` | string |
| `ai:openai` | `{ messages, model?, maxTokens? }` | string |
| `ai:gemini` | `{ prompt, model? }` | string |
| `finance:coingecko-price` | `{ ids, vsCurrencies? }` | object |
| `finance:coingecko-market` | `{ vsCurrency?, perPage? }` | array |
| `finance:massive-quote` | `{ ticker }` | object |
| `finance:massive-aggs` | `{ ticker, from, to, multiplier?, timespan? }` | object |
| `finance:massive-news` | `{ ticker, limit? }` | array |
| `news:headlines` | `{ country?, category?, q? }` | object |
| `news:everything` | `{ q, sortBy?, pageSize? }` | object |
| `weather:current` | `{ city }` or `{ lat, lon }` + `{ units? }` | object |
| `weather:forecast` | `{ city }` or `{ lat, lon }` + `{ units?, cnt? }` | object |
| `drive:list-files` | `{ pageSize?, query? }` | array |
| `drive:download-file` | `{ fileId }` | base64 string |
| `db:query` | `{ sql, params? }` | rows array |
| `db:run` | `{ sql, params? }` | run info |

### Adding a new channel

1. Handler in `main.js`: `ipcMain.handle('service:action', async (event, payload) => { ... })`
2. Wrapper in `src/services/ipc.js`
3. Add to whitelist in `preload.js` → `channels` array

---

## Folder Structure

```
src/
├── components/   # Reusable UI pieces
├── pages/        # Full-page views
├── services/
│   ├── api.js    # Client instantiation (main process only)
│   ├── db.js     # DB connection (main process only)
│   └── ipc.js    # IPC wrappers (renderer / React)
├── hooks/        # Custom hooks
├── utils/        # Pure helpers
└── App.jsx
```

### Naming

| Thing | Convention | Example |
|-------|------------|---------|
| Components | PascalCase | `StockDashboard.jsx` |
| Utilities | camelCase | `formatCurrency.js` |
| IPC channels | `service:action` | `finance:massive-quote` |
| DB tables | snake_case | `user_sessions` |
| CSS classes | kebab-case | `stock-card` |

---

## Database: supabase

**SQLite:** Schema at `src/db/schema.sql`, runs on first launch. Always use `db:query` / `db:run` IPC from React. Use parameterized queries.

**Supabase:** Run `src/db/supabase.sql` in the Supabase SQL editor. Enable RLS on all tables. Access via `getSupabase()` in main process handlers only.

---

## Google Drive OAuth Setup

1. Google Cloud Console → create project → enable Drive API
2. Create OAuth2 credentials (Desktop app type)
3. Add Client ID + Secret to `.env`
4. Run OAuth flow → get access + refresh tokens → add to `.env`
5. Tokens auto-refresh via the googleapis library

---

## Feature Building Workflow

1. Describe the feature
2. Claude Code reads this file + DESIGN.md
3. Creates component in `src/pages/` or `src/components/`
4. Adds IPC handler in `main.js` if new data is needed
5. Wires IPC call via `src/services/ipc.js`
6. Applies design tokens from DESIGN.md

**Example prompt:**
> "Build a crypto dashboard showing top 20 coins by market cap. Use Recharts for the price chart."

Claude Code will use `finance:coingeckoMarket`, create `src/pages/CryptoDashboard.jsx`, apply design tokens from DESIGN.md.
