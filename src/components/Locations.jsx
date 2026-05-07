import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import Modal from './Modal';
import { makeLocation } from '../store';

const TYPES = ['city', 'building', 'dungeon', 'district', 'alley', 'other'];
const TYPE_ICON = { city: '🌆', building: '🏛', dungeon: '⚔', district: '🗺', alley: '🌑', other: '◎' };
const TYPE_BADGE = { city: 'blue', building: 'cyan', dungeon: 'red', district: 'purple', alley: 'muted', other: 'muted' };

export default function Locations() {
  const { activeProject, updateProject, showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const locations = activeProject?.locations || [];
  const filtered = locations.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    return matchSearch && matchType;
  });

  const openNew = () => { setEditing(makeLocation()); setIsNew(true); };
  const openEdit = (l) => { setEditing({ ...l }); setIsNew(false); };
  const closeModal = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing.name.trim()) { showToast('Location needs a name', 'warn'); return; }
    const updated = isNew
      ? [...locations, editing]
      : locations.map(l => l.id === editing.id ? editing : l);
    updateProject({ locations: updated });
    showToast(isNew ? `${editing.name} added` : `${editing.name} updated`, 'success');
    closeModal();
  };

  const remove = (id) => {
    updateProject({ locations: locations.filter(l => l.id !== id) });
    showToast('Location removed', 'info');
    closeModal();
  };

  if (!activeProject) return <div className="sw-page"><div className="sw-empty"><div className="sw-empty__title">No project selected</div></div></div>;

  return (
    <div className="sw-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s6)' }}>
        <div className="sw-page-header" style={{ marginBottom: 0 }}>
          <h1>Locations</h1>
          <p>Map out your story's world · {locations.length} total</p>
        </div>
        <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add Location</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--s3)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
        <div className="sw-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span className="sw-search-bar__icon">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations…" />
        </div>
        <div className="sw-view-toggle">
          <div className={`sw-view-toggle__btn${typeFilter === 'all' ? ' is-active' : ''}`} onClick={() => setTypeFilter('all')}>All</div>
          {TYPES.map(t => (
            <div key={t} className={`sw-view-toggle__btn${typeFilter === t ? ' is-active' : ''}`} onClick={() => setTypeFilter(t)}>
              {TYPE_ICON[t]} {t}
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="sw-empty">
          <div className="sw-empty__icon">◎</div>
          <div className="sw-empty__title">{search ? 'No locations found' : 'No locations yet'}</div>
          <div className="sw-empty__body">Add locations manually or let AI extract them as you write.</div>
          {!search && <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add First Location</button>}
        </div>
      ) : (
        <div className="sw-cards-grid">
          {filtered.map((l, i) => (
            <div key={l.id} className="sw-entity-card" style={{ '--i': i }} onClick={() => openEdit(l)}>
              <div className="sw-entity-card__header">
                <div className="sw-entity-card__avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', fontSize: 22 }}>
                  {TYPE_ICON[l.type] || '◎'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sw-entity-card__title">{l.name}</div>
                  <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 4 }}>
                    <span className={`sw-badge sw-badge--${TYPE_BADGE[l.type] || 'muted'}`}>{l.type}</span>
                    {l.aiExtracted && <span className="sw-badge sw-badge--purple">✦ AI</span>}
                  </div>
                </div>
              </div>
              <div className="sw-entity-card__body">{l.description || 'No description yet.'}</div>
              {l.atmosphere && (
                <div style={{ marginBottom: 'var(--s3)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>ATMOSPHERE</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{l.atmosphere}</div>
                </div>
              )}
              <div className="sw-entity-card__footer">
                <span className="sw-entity-card__meta">Click to edit</span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? 'New Location' : editing.name}
          subtitle={isNew ? 'Add a location to your world' : 'Edit location details'}
          onClose={closeModal}
          footer={
            <>
              {!isNew && <button className="sw-btn sw-btn--danger sw-btn--sm" onClick={() => remove(editing.id)}>Delete</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={closeModal}>Cancel</button>
                <button className="sw-btn sw-btn--primary" onClick={save}>Save Location</button>
              </div>
            </>
          }
        >
          <div className="sw-field">
            <label className="sw-field__label">Name *</label>
            <input className="sw-field__input" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} placeholder="Location name" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Type</label>
            <select className="sw-field__select" value={editing.type} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Description</label>
            <textarea className="sw-field__textarea" rows={3} value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} placeholder="What does this place look like?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Atmosphere</label>
            <textarea className="sw-field__textarea" rows={2} value={editing.atmosphere} onChange={e => setEditing(p => ({ ...p, atmosphere: e.target.value }))} placeholder="What's the mood and feeling of this place?" />
          </div>
        </Modal>
      )}
    </div>
  );
}
