import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { uuid, makeChapter } from '../store';

function newProject(name, description = '') {
  return {
    id: uuid(),
    name,
    description,
    genre: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: [makeChapter('Chapter 1')],
    characters: [],
    locations: [],
    events: [],
    items: [],
    relationships: [],
  };
}

export default function ProjectManager({ onClose }) {
  const { data, setData, showToast } = useContext(AppContext);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const projects = data.projects || [];

  const selectProject = (id) => {
    setData(prev => ({ ...prev, activeProjectId: id }));
    onClose();
  };

  const createProject = () => {
    if (!newName.trim()) { showToast('Project needs a name', 'warn'); return; }
    const project = newProject(newName.trim(), newDesc.trim());
    setData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), project],
      activeProjectId: project.id,
    }));
    showToast(`"${project.name}" created`, 'success');
    onClose();
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    if (projects.length <= 1) { showToast('Cannot delete the only project', 'warn'); return; }
    const updated = projects.filter(p => p.id !== id);
    setData(prev => ({
      ...prev,
      projects: updated,
      activeProjectId: prev.activeProjectId === id ? updated[0].id : prev.activeProjectId,
    }));
    showToast('Project deleted', 'info');
  };

  return (
    <div className="sw-project-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sw-project-picker">
        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 'var(--s1)' }}>
            Story<span style={{ color: 'var(--accent-magenta)' }}>Weaver</span>
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-secondary)' }}>
            Select a project or create a new one
          </div>
        </div>

        {projects.length > 0 && (
          <div style={{ marginBottom: 'var(--s6)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>
              Your Projects
            </div>
            {projects.map(p => {
              const wordCount = (p.chapters || []).reduce((a, c) => a + (c.wordCount || 0), 0);
              return (
                <div
                  key={p.id}
                  className={`sw-project-card${p.id === data.activeProjectId ? ' is-active' : ''}`}
                  onClick={() => selectProject(p.id)}
                >
                  <div className="sw-project-card__icon">📖</div>
                  <div className="sw-project-card__info">
                    <div className="sw-project-card__name">{p.name}</div>
                    <div className="sw-project-card__meta">
                      {(p.chapters || []).length} chapter{(p.chapters || []).length !== 1 ? 's' : ''} · {wordCount.toLocaleString()} words · {(p.characters || []).length} characters
                    </div>
                  </div>
                  {p.id === data.activeProjectId && (
                    <span className="sw-badge sw-badge--magenta">Active</span>
                  )}
                  {projects.length > 1 && (
                    <button
                      className="sw-btn sw-btn--danger sw-btn--sm"
                      onClick={e => deleteProject(p.id, e)}
                      style={{ opacity: 0.5, flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ borderTop: projects.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: projects.length > 0 ? 'var(--s5)' : 0 }}>
          {!creating ? (
            <button
              className="sw-btn sw-btn--secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setCreating(true)}
            >
              + New Project
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--accent-magenta)', textTransform: 'uppercase' }}>
                New Project
              </div>
              <div className="sw-field">
                <label className="sw-field__label">Title *</label>
                <input
                  className="sw-field__input"
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="My Novel"
                  onKeyDown={e => { if (e.key === 'Enter') createProject(); if (e.key === 'Escape') setCreating(false); }}
                />
              </div>
              <div className="sw-field">
                <label className="sw-field__label">Description (optional)</label>
                <input className="sw-field__input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="A brief description…" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button className="sw-btn sw-btn--primary" style={{ flex: 1 }} onClick={createProject}>Create Project →</button>
              </div>
            </div>
          )}
        </div>

        {projects.length > 0 && !creating && (
          <button className="sw-btn sw-btn--ghost sw-btn--sm" style={{ marginTop: 'var(--s4)', width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
