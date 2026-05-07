import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import Modal from './Modal';
import { makeItem } from '../store';

const TYPES = ['weapon', 'reward', 'object', 'artifact', 'vehicle', 'consumable', 'other'];
const TYPE_ICON = { weapon: '⚔', reward: '🏆', object: '◆', artifact: '✦', vehicle: '◈', consumable: '◉', other: '◇' };
const TYPE_BADGE = { weapon: 'red', reward: 'teal', object: 'muted', artifact: 'magenta', vehicle: 'blue', consumable: 'orange', other: 'muted' };

export default function Items() {
  const { activeProject, updateProject, showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const items = activeProject?.items || [];
  const characters = activeProject?.characters || [];

  const filtered = items.filter(it => {
    const matchSearch = it.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || it.type === typeFilter;
    return matchSearch && matchType;
  });

  const openNew = () => { setEditing(makeItem()); setIsNew(true); };
  const openEdit = (it) => { setEditing({ ...it }); setIsNew(false); };
  const closeModal = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing.name.trim()) { showToast('Item needs a name', 'warn'); return; }
    const updated = isNew
      ? [...items, editing]
      : items.map(it => it.id === editing.id ? editing : it);
    updateProject({ items: updated });
    showToast(isNew ? `${editing.name} added` : 'Item updated', 'success');
    closeModal();
  };

  const remove = (id) => {
    updateProject({ items: items.filter(it => it.id !== id) });
    showToast('Item removed', 'info');
    closeModal();
  };

  if (!activeProject) return <div className="sw-page"><div className="sw-empty"><div className="sw-empty__title">No project selected</div></div></div>;

  return (
    <div className="sw-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s6)' }}>
        <div className="sw-page-header" style={{ marginBottom: 0 }}>
          <h1>Items</h1>
          <p>Track significant objects in your story · {items.length} total</p>
        </div>
        <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add Item</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--s3)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
        <div className="sw-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span className="sw-search-bar__icon">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" />
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
          <div className="sw-empty__icon">◆</div>
          <div className="sw-empty__title">{search ? 'No items found' : 'No items yet'}</div>
          <div className="sw-empty__body">Add items manually or let AI extract them as you write.</div>
          {!search && <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add First Item</button>}
        </div>
      ) : (
        <div className="sw-cards-grid">
          {filtered.map((it, i) => (
            <div key={it.id} className="sw-entity-card" style={{ '--i': i }} onClick={() => openEdit(it)}>
              <div className="sw-entity-card__header">
                <div className="sw-entity-card__avatar" style={{ background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-magenta))', fontSize: 22 }}>
                  {TYPE_ICON[it.type] || '◇'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sw-entity-card__title">{it.name}</div>
                  <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 4 }}>
                    <span className={`sw-badge sw-badge--${TYPE_BADGE[it.type] || 'muted'}`}>{it.type}</span>
                    {it.aiExtracted && <span className="sw-badge sw-badge--purple">✦ AI</span>}
                  </div>
                </div>
              </div>
              <div className="sw-entity-card__body">{it.description || 'No description yet.'}</div>
              {it.significance && (
                <div style={{ marginBottom: 'var(--s3)', padding: 'var(--s3)', background: 'var(--bg-inset)', borderRadius: 'var(--r2)', borderLeft: '2px solid var(--accent-orange)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>SIGNIFICANCE</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-secondary)' }}>{it.significance}</div>
                </div>
              )}
              {it.holder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HELD BY</span>
                  <span className="sw-badge sw-badge--muted">{it.holder}</span>
                </div>
              )}
              <div className="sw-entity-card__footer">
                <span className="sw-entity-card__meta">Click to edit</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? 'New Item' : editing.name}
          onClose={closeModal}
          footer={
            <>
              {!isNew && <button className="sw-btn sw-btn--danger sw-btn--sm" onClick={() => remove(editing.id)}>Delete</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={closeModal}>Cancel</button>
                <button className="sw-btn sw-btn--primary" onClick={save}>Save Item</button>
              </div>
            </>
          }
        >
          <div className="sw-field">
            <label className="sw-field__label">Name *</label>
            <input className="sw-field__input" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} placeholder="Item name" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Type</label>
            <select className="sw-field__select" value={editing.type} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Description</label>
            <textarea className="sw-field__textarea" rows={3} value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} placeholder="What is this item?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Significance to the story</label>
            <textarea className="sw-field__textarea" rows={2} value={editing.significance} onChange={e => setEditing(p => ({ ...p, significance: e.target.value }))} placeholder="Why does this matter?" />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Currently held by</label>
            <select className="sw-field__select" value={editing.holder} onChange={e => setEditing(p => ({ ...p, holder: e.target.value }))}>
              <option value="">— Unknown —</option>
              {characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
