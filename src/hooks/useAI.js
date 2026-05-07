import { useCallback, useRef } from 'react';

// Use Electron IPC when available (full app), fall back to local dev server
const CHANNEL_URLS = {
  'story:analyze': '/api/story/analyze',
  'story:format':  '/api/story/format',
  'story:chat':    '/api/story/chat',
};

// Strip markdown code fences that Claude sometimes wraps around JSON
function parseAIJson(raw) {
  if (!raw) return null;
  let s = raw.trim();
  // Remove ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(s); } catch (e) {
    console.error('[AI] JSON parse failed. Raw response:', raw, e);
    return null;
  }
}

async function invoke(channel, payload) {
  const hasIpc = typeof window !== 'undefined' && window.ipc && typeof window.ipc.invoke === 'function';
  if (hasIpc) {
    return window.ipc.invoke(channel, payload);
  }
  const url = CHANNEL_URLS[channel];
  if (!url) throw new Error(`No dev fallback for channel: ${channel}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ── Standalone analysis runner (used by App context for global analyze button) ─
export async function runAnalysis({ html, project, onUpdate, onStatusChange }) {
  onStatusChange('analyzing');
  try {
    const raw = await invoke('story:analyze', {
      text: html,
      existingCharacters: (project?.characters || []).map(c => c.name),
      existingLocations:  (project?.locations  || []).map(l => l.name),
    });
    console.log('[AI Analyze] raw response:', raw);
    const parsed = parseAIJson(raw);
    if (!parsed) { onStatusChange('idle'); return null; }
    const counts = onUpdate(parsed);
    onStatusChange('idle');
    return counts;
  } catch (err) {
    console.error('[AI Analysis]', err);
    onStatusChange('error');
    setTimeout(() => onStatusChange('idle'), 3000);
    throw err;
  }
}

export function useAI({ onUpdate, onStatusChange, onToast }) {
  const timerRef = useRef(null);

  const scheduleAnalysis = useCallback((html, project) => {
    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length < 80) return;

    onStatusChange('pending');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      onStatusChange('analyzing');
      try {
        const raw = await invoke('story:analyze', {
          text: html,
          existingCharacters: (project?.characters || []).map(c => c.name),
          existingLocations: (project?.locations || []).map(l => l.name),
        });

        console.log('[AI ScheduleAnalyze] raw response:', raw);
        const parsed = parseAIJson(raw);
        if (!parsed) { onStatusChange('idle'); return; }

        const counts = onUpdate(parsed, project);
        const parts = [];
        if (counts.characters) parts.push(`${counts.characters} character${counts.characters !== 1 ? 's' : ''}`);
        if (counts.locations)  parts.push(`${counts.locations} location${counts.locations !== 1 ? 's' : ''}`);
        if (counts.events)     parts.push(`${counts.events} event${counts.events !== 1 ? 's' : ''}`);
        if (counts.items)      parts.push(`${counts.items} item${counts.items !== 1 ? 's' : ''}`);
        if (parts.length > 0) onToast(`AI updated: ${parts.join(', ')}`, 'success');

        onStatusChange('idle');
      } catch (err) {
        console.error('[AI Analysis]', err);
        onStatusChange('error');
        setTimeout(() => onStatusChange('idle'), 3000);
      }
    }, 18000);
  }, [onUpdate, onStatusChange, onToast]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onStatusChange('idle');
  }, [onStatusChange]);

  const chat = useCallback(async (messages, project) => {
    const context = {
      name: project?.name || 'Untitled',
      characters: (project?.characters || []).map(c => `${c.name} (${c.role})`).slice(0, 10).join(', ') || 'none',
      locations: (project?.locations || []).map(l => l.name).slice(0, 8).join(', ') || 'none',
      events: (project?.events || []).filter(e => e.importance === 'major').map(e => e.title).slice(0, 6).join(', ') || 'none',
    };
    return invoke('story:chat', { messages, projectContext: context });
  }, []);

  const formatText = useCallback(async (content, format) => {
    return invoke('story:format', { content, format });
  }, []);

  return { scheduleAnalysis, cancel, chat, formatText };
}
