import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../App';
import { useAI } from '../hooks/useAI';

// Minimal markdown → HTML: **bold**, *italic*, line breaks
function renderMd(text) {
  const html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  return { __html: html };
}

export default function Dashboard() {
  const { activeProject, setActiveView, aiStatus, setAiStatus, showToast } = useContext(AppContext);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your writing partner. Ask me anything about your story — characters, plot, consistency, ideas." }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { chat } = useAI({
    onUpdate: () => ({}),
    onStatusChange: setAiStatus,
    onToast: showToast,
  });

  const totalWords = (activeProject?.chapters || []).reduce((a, c) => a + (c.wordCount || 0), 0);

  const stats = [
    { label: 'Chapters',   value: (activeProject?.chapters || []).length,   color: '#e040fb', i: 0 },
    { label: 'Characters', value: (activeProject?.characters || []).length,  color: '#4361ee', i: 1 },
    { label: 'Locations',  value: (activeProject?.locations || []).length,   color: '#00d4ff', i: 2 },
    { label: 'Events',     value: (activeProject?.events || []).length,      color: '#00e5a0', i: 3 },
  ];

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setChatLoading(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const reply = await chat(
        next.map(m => ({ role: m.role, content: m.content })),
        activeProject
      );
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `I couldn't respond: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!activeProject) {
    return (
      <div className="sw-page">
        <div className="sw-empty">
          <div className="sw-empty__icon">📖</div>
          <div className="sw-empty__title">No project selected</div>
          <div className="sw-empty__body">Create or select a project to get started.</div>
        </div>
      </div>
    );
  }

  const recentChapter = [...(activeProject.chapters || [])].sort((a, b) => b.updatedAt - a.updatedAt)[0];

  return (
    <div className="sw-page">
      {/* Header */}
      <div className="sw-page-header">
        <h1 className="g-enter">{activeProject.name}</h1>
        <p className="g-enter">{activeProject.description || 'Your story begins here.'}</p>
      </div>

      {/* Stats row */}
      <div className="sw-stats-row">
        {stats.map(s => (
          <div
            key={s.label}
            className="sw-stat-card g-enter-box"
            style={{ '--stat-color': s.color, '--i': s.i }}
          >
            <div className="sw-stat-card__value">{s.value}</div>
            <div className="sw-stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Word count */}
      <div className="sw-word-bar g-enter-box" style={{ '--i': 4 }}>
        <div className="sw-word-bar__count">{totalWords.toLocaleString()}</div>
        <div style={{ flex: 1 }}>
          <div className="sw-word-bar__label">Total Words · {Math.round((totalWords / 80000) * 100)}% of a typical novel</div>
          <div className="sw-word-bar__track">
            <div className="sw-word-bar__fill" style={{ width: `${Math.min(100, (totalWords / 80000) * 100)}%` }} />
          </div>
        </div>
        <div className="sw-word-bar__pct">{(80000 - totalWords).toLocaleString()} to go</div>
      </div>

      <div className="sw-dashboard-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
            <button className="sw-btn sw-btn--primary" onClick={() => setActiveView('editor')}>
              ✎ Open Editor
            </button>
            <button className="sw-btn sw-btn--secondary" onClick={() => setActiveView('characters')}>
              ◉ Characters
            </button>
            <button className="sw-btn sw-btn--ghost" onClick={() => setActiveView('timeline')}>
              ◷ Timeline
            </button>
            <button className="sw-btn sw-btn--ghost" onClick={() => setActiveView('relationships')}>
              ⬡ Relationships
            </button>
          </div>

          {/* Recent chapter */}
          {recentChapter && (
            <div
              className="sw-entity-card g-enter-box"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveView('editor')}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--s2)' }}>
                RECENTLY EDITED
              </div>
              <div className="sw-entity-card__title">{recentChapter.title}</div>
              <div className="sw-entity-card__body" style={{ WebkitLineClamp: 4 }}>
                {recentChapter.content
                  ? recentChapter.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280) + '…'
                  : 'No content yet.'}
              </div>
              <div className="sw-entity-card__footer">
                <span className="sw-badge sw-badge--magenta">{recentChapter.wordCount || 0} words</span>
                <span className="sw-entity-card__meta">
                  {new Date(recentChapter.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Recent characters */}
          {(activeProject.characters || []).length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>
                CAST
              </div>
              <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
                {(activeProject.characters || []).slice(0, 8).map(c => (
                  <div
                    key={c.id}
                    onClick={() => setActiveView('characters')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--s2)',
                      padding: 'var(--s2) var(--s3)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r2)',
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-base)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.imageColor}
                    onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.imageColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {c.name[0]}
                    </div>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}</span>
                    <span className={`sw-badge sw-badge--${c.role === 'protagonist' ? 'magenta' : c.role === 'antagonist' ? 'red' : 'muted'}`}>
                      {c.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="sw-ai-chat g-enter-box" style={{ '--i': 2 }}>
          <div className="sw-ai-chat__header">
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-magenta), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
            <div className="sw-ai-chat__title">AI Writing Partner</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: aiStatus === 'idle' ? 'var(--accent-teal)' : 'var(--accent-orange)' }}>
              {aiStatus === 'idle' ? '● active' : '◌ busy'}
            </div>
          </div>

          <div className="sw-ai-chat__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`sw-ai-message sw-ai-message--${msg.role}`}>
                <div className="sw-ai-message__bubble" dangerouslySetInnerHTML={renderMd(msg.content)} />
              </div>
            ))}
            {chatLoading && (
              <div className="sw-ai-message sw-ai-message--assistant">
                <div className="sw-ai-message__bubble" style={{ display: 'flex', gap: 4 }}>
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="sw-ai-chat__input-row">
            <input
              className="sw-ai-chat__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your story…"
              disabled={chatLoading}
            />
            <button
              className="sw-btn sw-btn--primary sw-btn--sm"
              onClick={sendMessage}
              disabled={!input.trim() || chatLoading}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
