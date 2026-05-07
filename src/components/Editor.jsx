import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../App';
import { useAI } from '../hooks/useAI';
import { makeChapter, countWords } from '../store';

const FORMATS = [
  { id: 'novel',      label: 'Novel',       desc: 'Literary prose format' },
  { id: 'screenplay', label: 'Screenplay',  desc: 'Hollywood script format' },
  { id: 'stage_play', label: 'Stage Play',  desc: 'Theatre script format' },
  { id: 'tv_script',  label: 'TV Script',   desc: 'Television script format' },
  { id: 'magazine',   label: 'Magazine',    desc: 'Journalistic article format' },
];

export default function Editor() {
  const {
    activeProject, activeChapterId, setActiveChapterId,
    updateProject, aiStatus, setAiStatus, showToast,
    applyAIUpdate, triggerAnalysis,
  } = useContext(AppContext);

  const editorRef    = useRef(null);
  const saveTimer    = useRef(null);
  const lastIdRef    = useRef(null);
  const [wordCount,  setWordCount]  = useState(0);
  const [showFormat, setShowFormat] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [editTitle,  setEditTitle]  = useState(false);
  const [titleVal,   setTitleVal]   = useState('');

  const chapters = activeProject?.chapters || [];
  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

  const { scheduleAnalysis, cancel, formatText } = useAI({
    onUpdate: (parsed) => applyAIUpdate(parsed, activeProject),
    onStatusChange: setAiStatus,
    onToast: showToast,
  });

  // Load content when chapter changes
  useEffect(() => {
    if (!editorRef.current || !activeChapter) return;
    if (lastIdRef.current === activeChapter.id) return;
    editorRef.current.innerHTML = activeChapter.content || '';
    setWordCount(activeChapter.wordCount || 0);
    lastIdRef.current = activeChapter.id;
    cancel();
  }, [activeChapter?.id, cancel]);

  // Save with debounce
  const persist = useCallback((html) => {
    if (!activeChapter) return;
    const wc = countWords(html);
    setWordCount(wc);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const updated = (activeProject.chapters || []).map(c =>
        c.id === activeChapter.id ? { ...c, content: html, wordCount: wc, updatedAt: Date.now() } : c
      );
      updateProject({ chapters: updated });
    }, 5000);
  }, [activeChapter, activeProject, updateProject]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    persist(html);
    scheduleAnalysis(html, activeProject);
  };

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // Chapter CRUD
  const addChapter = () => {
    const ch = makeChapter(`Chapter ${chapters.length + 1}`);
    updateProject({ chapters: [...chapters, ch] });
    setActiveChapterId(ch.id);
  };

  const deleteChapter = (id) => {
    if (chapters.length <= 1) { showToast('Cannot delete the only chapter', 'warn'); return; }
    const updated = chapters.filter(c => c.id !== id);
    updateProject({ chapters: updated });
    if (activeChapterId === id) setActiveChapterId(updated[0]?.id);
  };

  const renameChapter = (id, title) => {
    const updated = chapters.map(c => c.id === id ? { ...c, title } : c);
    updateProject({ chapters: updated });
    setEditTitle(false);
  };

  // AI Format
  const handleFormat = async (formatId) => {
    setShowFormat(false);
    if (!editorRef.current || !activeChapter) return;
    setFormatting(true);
    try {
      const result = await formatText(activeChapter.content || '', formatId);
      const html = result.split('\n\n').map(p =>
        p.trim() ? `<p>${p.replace(/\n/g, '<br/>')}</p>` : ''
      ).join('');
      editorRef.current.innerHTML = html;
      persist(html);
      showToast(`Reformatted as ${FORMATS.find(f => f.id === formatId)?.label}`, 'success');
    } catch (err) {
      showToast(`Format failed: ${err.message}`, 'error');
    } finally {
      setFormatting(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="sw-page">
        <div className="sw-empty">
          <div className="sw-empty__icon">✎</div>
          <div className="sw-empty__title">No project selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-editor-shell" style={{ height: 'calc(100vh - 0px)', display: 'flex' }}>
      {/* Chapter panel */}
      <div className="sw-chapter-panel">
        <div className="sw-chapter-panel__header">
          <span className="sw-chapter-panel__title">Chapters</span>
          <button
            className="sw-btn sw-btn--sm sw-btn--primary"
            onClick={addChapter}
            title="Add chapter"
            style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
          >+</button>
        </div>
        <div className="sw-chapter-list">
          {chapters.map(ch => (
            <div
              key={ch.id}
              className={`sw-chapter-item${activeChapter?.id === ch.id ? ' is-active' : ''}`}
              onClick={() => setActiveChapterId(ch.id)}
              onDoubleClick={() => { setEditTitle(ch.id); setTitleVal(ch.title); }}
            >
              {editTitle === ch.id ? (
                <input
                  autoFocus
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={() => renameChapter(ch.id, titleVal)}
                  onKeyDown={e => { if (e.key === 'Enter') renameChapter(ch.id, titleVal); if (e.key === 'Escape') setEditTitle(false); }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--accent-magenta)', borderRadius: 'var(--r1)', padding: '2px 6px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                />
              ) : (
                <>
                  <div className="sw-chapter-item__title">{ch.title}</div>
                  <div className="sw-chapter-item__meta">{(ch.wordCount || 0).toLocaleString()} words</div>
                </>
              )}
              {chapters.length > 1 && activeChapter?.id === ch.id && (
                <button
                  onClick={e => { e.stopPropagation(); deleteChapter(ch.id); }}
                  style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, padding: 0 }}
                  title="Delete chapter"
                >✕ delete</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main editor */}
      <div className="sw-editor-main">
        {/* Topbar */}
        <div className="sw-editor-topbar">
          {/* Top row: chapter title + right controls */}
          <div className="sw-editor-topbar__controls">
            <span className="sw-word-count">{activeChapter?.title || 'Untitled'}</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', flexShrink: 0 }}>
              <span className="sw-word-count">{wordCount.toLocaleString()} words</span>

              <button
                className="sw-btn sw-btn--ghost sw-btn--sm"
                onClick={triggerAnalysis}
                disabled={aiStatus === 'analyzing' || aiStatus === 'pending'}
                title="Extract characters, locations and events from your text"
                style={{ fontSize: 11 }}
              >
                {(aiStatus === 'analyzing' || aiStatus === 'pending')
                  ? <><span className="spinner" style={{ width: 10, height: 10 }} /> Scanning…</>
                  : '✦ Extract Entities'
                }
              </button>

              {/* AI Format */}
              <div className="sw-format-dropdown">
                <button
                  className={`sw-btn sw-btn--secondary sw-btn--sm${formatting ? ' is-loading' : ''}`}
                  onClick={() => setShowFormat(v => !v)}
                  disabled={formatting}
                >
                  {formatting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Formatting…</> : '✦ AI Format'}
                </button>
                {showFormat && (
                  <div className="sw-format-dropdown__menu">
                    {FORMATS.map(f => (
                      <div key={f.id} className="sw-format-dropdown__item" onClick={() => handleFormat(f.id)}>
                        {f.label}
                        <span>{f.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom row: full-width toolbar */}
          <div className="sw-toolbar">
            <button className={`sw-toolbar-btn${isActive('bold') ? ' is-active' : ''}`} onMouseDown={e => { e.preventDefault(); exec('bold'); }} title="Bold"><b>B</b></button>
            <button className={`sw-toolbar-btn${isActive('italic') ? ' is-active' : ''}`} onMouseDown={e => { e.preventDefault(); exec('italic'); }} title="Italic"><i>I</i></button>
            <button className={`sw-toolbar-btn${isActive('underline') ? ' is-active' : ''}`} onMouseDown={e => { e.preventDefault(); exec('underline'); }} title="Underline"><u>U</u></button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }} title="Strikethrough"><s>S</s></button>
            <div className="sw-toolbar__sep" />
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'H1'); }} title="Heading 1" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>H1</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'H2'); }} title="Heading 2" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>H2</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'H3'); }} title="Heading 3" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>H3</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'P'); }} title="Paragraph" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>¶</button>
            <div className="sw-toolbar__sep" />
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }} title="Align Left">⬅</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }} title="Center">↔</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('justifyFull'); }} title="Justify">☰</button>
            <div className="sw-toolbar__sep" />
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} title="Bullet List">• ≡</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} title="Numbered List">1 ≡</button>
            <div className="sw-toolbar__sep" />
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('undo'); }} title="Undo">↩</button>
            <button className="sw-toolbar-btn" onMouseDown={e => { e.preventDefault(); exec('redo'); }} title="Redo">↪</button>
          </div>
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          className="sw-editor-area"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={`Start writing ${activeChapter?.title || ''}…`}
          spellCheck
          onKeyDown={e => {
            if (e.key === 'Tab') {
              e.preventDefault();
              exec('insertText', '\t');
            }
          }}
          onClick={() => setShowFormat(false)}
        />
      </div>
    </div>
  );
}
