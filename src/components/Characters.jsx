import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import Modal from './Modal';
import { makeCharacter, charColor } from '../store';

const ROLES = ['protagonist', 'antagonist', 'supporting', 'ally', 'minor'];
const ROLE_BADGE = { protagonist: 'magenta', antagonist: 'red', supporting: 'blue', ally: 'cyan', minor: 'muted' };

export default function Characters() {
  const { activeProject, updateProject, showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const characters = activeProject?.characters || [];
  const filtered = characters.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || c.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openNew = () => { setEditing(makeCharacter()); setIsNew(true); };
  const openEdit = (c) => { setEditing({ ...c }); setIsNew(false); };
  const closeModal = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing.name.trim()) { showToast('Character needs a name', 'warn'); return; }
    const updated = isNew
      ? [...characters, editing]
      : characters.map(c => c.id === editing.id ? editing : c);
    updateProject({ characters: updated });
    showToast(isNew ? `${editing.name} added` : `${editing.name} updated`, 'success');
    closeModal();
  };

  const remove = (id) => {
    updateProject({ characters: characters.filter(c => c.id !== id) });
    showToast('Character removed', 'info');
    closeModal();
  };

  const setField = (key, val) => setEditing(prev => ({
    ...prev,
    [key]: val,
    ...(key === 'name' ? { imageColor: charColor(val) } : {}),
  }));

  const addTrait = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().replace(',', '');
      if (val && !editing.traits.includes(val)) {
        setEditing(prev => ({ ...prev, traits: [...prev.traits, val] }));
        e.target.value = '';
      }
    }
  };

  if (!activeProject) return <div className="sw-page"><div className="sw-empty"><div className="sw-empty__title">No project selected</div></div></div>;

  return (
    <div className="sw-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s6)' }}>
        <div className="sw-page-header" style={{ marginBottom: 0 }}>
          <h1>Characters</h1>
          <p>Manage your story's cast · {characters.length} total</p>
        </div>
        <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add Character</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--s3)', marginBottom: 'var(--s5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="sw-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span className="sw-search-bar__icon">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search characters…" />
        </div>
        <div className="sw-view-toggle">
          <div className={`sw-view-toggle__btn${roleFilter === 'all' ? ' is-active' : ''}`} onClick={() => setRoleFilter('all')}>All</div>
          {ROLES.map(r => (
            <div key={r} className={`sw-view-toggle__btn${roleFilter === r ? ' is-active' : ''}`} onClick={() => setRoleFilter(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="sw-empty">
          <div className="sw-empty__icon">◉</div>
          <div className="sw-empty__title">{search ? 'No characters found' : 'No characters yet'}</div>
          <div className="sw-empty__body">{search ? 'Try a different search.' : 'Add characters manually or let AI extract them as you write.'}</div>
          {!search && <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add First Character</button>}
        </div>
      ) : (
        <div className="sw-cards-grid">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className="sw-entity-card"
              style={{ '--i': i }}
              onClick={() => openEdit(c)}
            >
              <div className="sw-entity-card__header">
                <div className="sw-entity-card__avatar" style={{ background: c.imageColor }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sw-entity-card__title">{c.name}</div>
                  <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginTop: 4 }}>
                    <span className={`sw-badge sw-badge--${ROLE_BADGE[c.role] || 'muted'}`}>{c.role}</span>
                    {c.aiExtracted && <span className="sw-badge sw-badge--purple">✦ AI</span>}
                  </div>
                </div>
              </div>
              <div className="sw-entity-card__body">{c.description || 'No description yet.'}</div>
              {c.traits?.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginBottom: 'var(--s3)' }}>
                  {c.traits.slice(0, 4).map(t => (
                    <span key={t} className="sw-badge sw-badge--muted">{t}</span>
                  ))}
                  {c.traits.length > 4 && <span className="sw-badge sw-badge--muted">+{c.traits.length - 4}</span>}
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

      {/* Edit Modal */}
      {editing && (
        <Modal
          title={isNew ? 'New Character' : editing.name}
          subtitle={isNew ? 'Add a new character to your story' : 'Edit character details'}
          onClose={closeModal}
          footer={
            <>
              {!isNew && <button className="sw-btn sw-btn--danger sw-btn--sm" onClick={() => remove(editing.id)}>Delete</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={closeModal}>Cancel</button>
                <button className="sw-btn sw-btn--primary" onClick={save}>Save Character</button>
              </div>
            </>
          }
        >
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--r2)', background: editing.imageColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {editing.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Avatar color auto-generated from name
            </div>
          </div>

          <div className="sw-field">
            <label className="sw-field__label">Name *</label>
            <input className="sw-field__input" value={editing.name} onChange={e => setField('name', e.target.value)} placeholder="Character name" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Role</label>
            <select className="sw-field__select" value={editing.role} onChange={e => setField('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Description</label>
            <textarea className="sw-field__textarea" rows={3} value={editing.description} onChange={e => setField('description', e.target.value)} placeholder="Who is this character?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Backstory</label>
            <textarea className="sw-field__textarea" rows={3} value={editing.backstory} onChange={e => setField('backstory', e.target.value)} placeholder="What's their history?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Traits (press Enter or comma to add)</label>
            <div className="sw-traits-wrap">
              {(editing.traits || []).map(t => (
                <span key={t} className="sw-trait-tag">
                  {t}
                  <span className="sw-trait-tag__remove" onClick={() => setEditing(prev => ({ ...prev, traits: prev.traits.filter(x => x !== t) }))}>✕</span>
                </span>
              ))}
              <input className="sw-traits-input" placeholder="Add trait…" onKeyDown={addTrait} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
