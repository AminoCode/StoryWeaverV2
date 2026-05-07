import React, { useContext } from 'react';
import { AppContext } from '../App';
import { signOut } from '../services/auth';

function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Profile() {
  const { user, data, setData, setActiveView, showToast, dbSynced } = useContext(AppContext);
  const projects = data.projects || [];

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const selectProject = (id) => {
    setData(prev => ({ ...prev, activeProjectId: id }));
    setActiveView('dashboard');
  };

  const totalWords = projects.reduce((acc, p) =>
    acc + (p.chapters || []).reduce((a, c) => a + (c.wordCount || 0), 0), 0);

  return (
    <div className="sw-page">
      <div className="sw-page-header">
        <h1>Profile</h1>
        <p>Your account and stories</p>
      </div>

      {/* User card */}
      {user ? (
        <div className="sw-profile-card">
          <div className="sw-profile-card__avatar">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : <span>{(user.email || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div className="sw-profile-card__info">
            <div className="sw-profile-card__name">{user.user_metadata?.full_name || user.email}</div>
            <div className="sw-profile-card__email">{user.email}</div>
            <div className="sw-profile-card__meta">
              <span className={`sw-badge ${dbSynced ? 'sw-badge--teal' : 'sw-badge--muted'}`}>
                {dbSynced ? '✓ Cloud synced' : '● Local only'}
              </span>
              <span className="sw-badge sw-badge--muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              <span className="sw-badge sw-badge--muted">{totalWords.toLocaleString()} words total</span>
            </div>
          </div>
          <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <div className="sw-profile-card" style={{ justifyContent: 'center', textAlign: 'center', padding: 'var(--sp-8)' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 'var(--sp-4)' }}>
              Sign in to sync your stories to the cloud and access them from anywhere.
            </div>
            <button
              className="sw-btn sw-btn--primary"
              onClick={() => setActiveView('__auth')}
            >
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div style={{ marginTop: 'var(--sp-7)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 'var(--sp-4)' }}>
          Your Projects
        </div>

        {projects.length === 0 ? (
          <div className="sw-empty">
            <div className="sw-empty__icon">📖</div>
            <div className="sw-empty__title">No projects yet</div>
            <div className="sw-empty__body">Create a project to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {projects.map(p => {
              const words = (p.chapters || []).reduce((a, c) => a + (c.wordCount || 0), 0);
              const isActive = p.id === data.activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`sw-entity-card${isActive ? ' sw-entity-card--active' : ''}`}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', padding: 'var(--sp-4) var(--sp-5)' }}
                  onClick={() => selectProject(p.id)}
                >
                  <div style={{ fontSize: 24 }}>📖</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sw-entity-card__title" style={{ marginBottom: 2 }}>{p.name}</div>
                    <div className="sw-entity-card__meta">
                      {(p.chapters || []).length} chapter{(p.chapters || []).length !== 1 ? 's' : ''} ·{' '}
                      {words.toLocaleString()} words ·{' '}
                      {(p.characters || []).length} characters · updated {timeAgo(p.updatedAt)}
                    </div>
                  </div>
                  {isActive && <span className="sw-badge sw-badge--magenta">Active</span>}
                  {p._dbId && <span className="sw-badge sw-badge--teal" title="Saved to cloud">☁</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
