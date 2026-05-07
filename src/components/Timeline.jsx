import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import Modal from './Modal';
import { makeEvent } from '../store';

const IMPORTANCE = ['major', 'minor', 'background'];
const IMP_COLOR = { major: '#e040fb', minor: '#4361ee', background: '#44445a' };
const IMP_BADGE = { major: 'magenta', minor: 'blue', background: 'muted' };

export default function Timeline() {
  const { activeProject, updateProject, showToast } = useContext(AppContext);
  const [view, setView] = useState('timeline');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const events = [...(activeProject?.events || [])].sort((a, b) => a.order - b.order);
  const chapters = activeProject?.chapters || [];

  const filtered = events.filter(e => filter === 'all' || e.importance === filter);

  const openNew = () => { setEditing({ ...makeEvent(), chapter: chapters[0]?.title || '' }); setIsNew(true); };
  const openEdit = (e) => { setEditing({ ...e }); setIsNew(false); };
  const closeModal = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing.title.trim()) { showToast('Event needs a title', 'warn'); return; }
    const evts = activeProject?.events || [];
    const updated = isNew
      ? [...evts, editing]
      : evts.map(e => e.id === editing.id ? editing : e);
    updateProject({ events: updated });
    showToast(isNew ? 'Event added' : 'Event updated', 'success');
    closeModal();
  };

  const remove = (id) => {
    updateProject({ events: (activeProject?.events || []).filter(e => e.id !== id) });
    showToast('Event removed', 'info');
    closeModal();
  };

  const counts = {
    major: events.filter(e => e.importance === 'major').length,
    minor: events.filter(e => e.importance === 'minor').length,
    background: events.filter(e => e.importance === 'background').length,
  };

  if (!activeProject) return <div className="sw-page"><div className="sw-empty"><div className="sw-empty__title">No project selected</div></div></div>;

  return (
    <div className="sw-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s5)' }}>
        <div className="sw-page-header" style={{ marginBottom: 0 }}>
          <h1>Timeline</h1>
          <p>Track major events in your story</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center' }}>
          <div className="sw-view-toggle">
            <div className={`sw-view-toggle__btn${view === 'timeline' ? ' is-active' : ''}`} onClick={() => setView('timeline')}>⏱ Timeline</div>
            <div className={`sw-view-toggle__btn${view === 'cards' ? ' is-active' : ''}`} onClick={() => setView('cards')}>⊞ Cards</div>
          </div>
          <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add Event</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>
        {IMPORTANCE.map(imp => (
          <div key={imp} className="sw-stat-card g-enter-box" style={{ '--stat-color': IMP_COLOR[imp], '--i': IMPORTANCE.indexOf(imp), cursor: 'pointer' }} onClick={() => setFilter(filter === imp ? 'all' : imp)}>
            <div className="sw-stat-card__value">{counts[imp]}</div>
            <div className="sw-stat-card__label">{imp} events</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="sw-view-toggle" style={{ marginBottom: 'var(--s5)', display: 'inline-flex' }}>
        <div className={`sw-view-toggle__btn${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>All ({events.length})</div>
        {IMPORTANCE.map(imp => (
          <div key={imp} className={`sw-view-toggle__btn${filter === imp ? ' is-active' : ''}`} onClick={() => setFilter(filter === imp ? 'all' : imp)}>
            {imp.charAt(0).toUpperCase() + imp.slice(1)}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="sw-empty">
          <div className="sw-empty__icon">◷</div>
          <div className="sw-empty__title">No events yet</div>
          <div className="sw-empty__body">Add events manually or let AI extract them as you write your story.</div>
          <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add First Event</button>
        </div>
      ) : view === 'timeline' ? (
        <div className="sw-timeline-rail">
          {filtered.map((evt, i) => (
            <div
              key={evt.id}
              className="sw-timeline-event"
              style={{ '--i': i, '--event-color': IMP_COLOR[evt.importance] }}
            >
              <div className="sw-timeline-event__card" onClick={() => openEdit(evt)}>
                <div className="sw-timeline-event__title">{evt.title}</div>
                <div className="sw-timeline-event__desc">{evt.description}</div>
                <div className="sw-timeline-event__meta">
                  <span className={`sw-badge sw-badge--${IMP_BADGE[evt.importance]}`}>{evt.importance}</span>
                  {evt.chapter && <span className="sw-badge sw-badge--muted">📖 {evt.chapter}</span>}
                  {evt.when && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>⏱ {evt.when}</span>}
                  {evt.aiExtracted && <span className="sw-badge sw-badge--purple">✦ AI</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sw-cards-grid">
          {filtered.map((evt, i) => (
            <div key={evt.id} className="sw-entity-card" style={{ '--i': i }} onClick={() => openEdit(evt)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: IMP_COLOR[evt.importance], boxShadow: `0 0 8px ${IMP_COLOR[evt.importance]}`, flexShrink: 0 }} />
                <div className="sw-entity-card__title" style={{ fontSize: 15 }}>{evt.title}</div>
              </div>
              <div className="sw-entity-card__body">{evt.description || 'No description.'}</div>
              <div className="sw-entity-card__footer">
                <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
                  <span className={`sw-badge sw-badge--${IMP_BADGE[evt.importance]}`}>{evt.importance}</span>
                  {evt.chapter && <span className="sw-badge sw-badge--muted">{evt.chapter}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? 'New Event' : editing.title}
          onClose={closeModal}
          footer={
            <>
              {!isNew && <button className="sw-btn sw-btn--danger sw-btn--sm" onClick={() => remove(editing.id)}>Delete</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={closeModal}>Cancel</button>
                <button className="sw-btn sw-btn--primary" onClick={save}>Save Event</button>
              </div>
            </>
          }
        >
          <div className="sw-field">
            <label className="sw-field__label">Title *</label>
            <input className="sw-field__input" value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} placeholder="What happened?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Description</label>
            <textarea className="sw-field__textarea" rows={3} value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} placeholder="Describe this event…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
            <div className="sw-field">
              <label className="sw-field__label">Importance</label>
              <select className="sw-field__select" value={editing.importance} onChange={e => setEditing(p => ({ ...p, importance: e.target.value }))}>
                {IMPORTANCE.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
              </select>
            </div>
            <div className="sw-field">
              <label className="sw-field__label">Chapter</label>
              <select className="sw-field__select" value={editing.chapter} onChange={e => setEditing(p => ({ ...p, chapter: e.target.value }))}>
                <option value="">— None —</option>
                {chapters.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">When (narrative time)</label>
            <input className="sw-field__input" value={editing.when} onChange={e => setEditing(p => ({ ...p, when: e.target.value }))} placeholder="e.g. During the ceasefire, After the battle…" />
          </div>
        </Modal>
      )}
    </div>
  );
}
