import React, { useContext } from 'react';
import { AppContext } from '../App';
import { signOut } from '../services/auth';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'D', countKey: null },
  { id: 'editor', label: 'Editor', icon: 'E', countKey: 'chapters' },
  { id: 'characters', label: 'Characters', icon: 'C', countKey: 'characters' },
  { id: 'locations', label: 'Locations', icon: 'L', countKey: 'locations' },
  { id: 'timeline', label: 'Timeline', icon: 'T', countKey: 'events' },
  { id: 'items', label: 'Items', icon: 'I', countKey: 'items' },
  { id: 'relationships', label: 'Relationships', icon: 'R', countKey: null },
  { id: 'profile', label: 'Profile', icon: 'P', countKey: null },
];

function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Sidebar() {
  const {
    activeView, setActiveView,
    activeProject,
    aiStatus,
    setShowProjectPicker,
    triggerAnalysis,
    lastScan,
    user, dbSynced,
    showToast,
  } = useContext(AppContext);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const count = (key) => {
    if (!key || !activeProject) return null;
    const val = (activeProject[key] || []).length;
    return val > 0 ? val : null;
  };

  const busy = aiStatus === 'analyzing' || aiStatus === 'pending';
  const statusLabel = {
    idle: 'Ready',
    pending: 'Queued...',
    analyzing: 'Scanning...',
    error: 'Failed',
  }[aiStatus] || 'Ready';

  const scanSummary = lastScan?.counts
    ? [
        lastScan.counts.characters && `${lastScan.counts.characters} char`,
        lastScan.counts.locations && `${lastScan.counts.locations} loc`,
        lastScan.counts.events && `${lastScan.counts.events} evt`,
        lastScan.counts.items && `${lastScan.counts.items} item`,
      ].filter(Boolean).join(' / ')
    : null;

  return (
    <aside className="sw-sidebar">
      <div className="sw-sidebar__brand">
        <div className="sw-sidebar__logo">Story<span>Weaver</span></div>
        <div className="sw-sidebar__tagline">AI Writing Studio</div>
      </div>

      <div className="sw-project-pill" onClick={() => setShowProjectPicker(true)} title="Switch project">
        <div className="sw-project-pill__dot" />
        <div className="sw-project-pill__name">{activeProject?.name || 'No Project'}</div>
        <div className="sw-project-pill__chevron">v</div>
      </div>

      <div className="sw-sidebar__section">Writing Studio</div>
      <nav>
        {NAV.map((item) => {
          const c = count(item.countKey);
          return (
            <div
              key={item.id}
              className={`sw-nav-item${activeView === item.id ? ' is-active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="sw-nav-item__icon">{item.icon}</span>
              <span className="sw-nav-item__label">{item.label}</span>
              {c !== null && <span className="sw-nav-item__count">{c}</span>}
            </div>
          );
        })}
      </nav>

      <div className="sw-user-strip">
        {user ? (
          <>
            <div className="sw-user-strip__avatar">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span>{(user.email || 'U')[0].toUpperCase()}</span>}
            </div>
            <div className="sw-user-strip__name" title={user.email}>
              {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
            </div>
            <div className="sw-user-strip__sync" title={dbSynced ? 'Cloud synced' : 'Local only'}>
              {dbSynced ? 'Cloud' : 'Local'}
            </div>
            <button className="sw-user-strip__signout" onClick={handleSignOut} title="Sign out">Out</button>
          </>
        ) : (
          <button
            className="sw-btn sw-btn--ghost sw-btn--sm"
            style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
            onClick={() => setActiveView('__auth')}
          >
            Sign in to sync
          </button>
        )}
      </div>

      <div className="sw-ai-panel">
        <div className="sw-ai-panel__header">
          <div className="sw-ai-panel__title">
            <span className="sw-ai-panel__icon">AI</span>
            Story Analysis
          </div>
          <div className={`sw-ai-panel__status sw-ai-panel__status--${aiStatus}`}>
            {busy && <span className="spinner" style={{ width: 8, height: 8, marginRight: 4 }} />}
            {statusLabel}
          </div>
        </div>

        <div className="sw-ai-panel__bar">
          <div
            className={`sw-ai-panel__bar-fill${busy ? ' sw-ai-panel__bar-fill--active' : ''}`}
            style={{ width: busy ? '100%' : (lastScan ? '100%' : '0%') }}
          />
        </div>

        <div className="sw-ai-panel__message">
          {aiStatus === 'analyzing' && 'Extracting characters, locations, events and items...'}
          {aiStatus === 'pending' && 'Analysis queued from editor...'}
          {aiStatus === 'error' && 'Analysis failed. Check console for details.'}
          {aiStatus === 'idle' && lastScan && (
            <span>
              Last scan {timeAgo(lastScan.timestamp)}
              {scanSummary && <> / <strong style={{ color: 'var(--magenta)' }}>{scanSummary}</strong></>}
            </span>
          )}
          {aiStatus === 'idle' && !lastScan && 'Run analysis to extract story entities'}
        </div>

        <div className="sw-ai-panel__counts">
          {[
            { icon: 'C', count: (activeProject?.characters || []).length },
            { icon: 'L', count: (activeProject?.locations || []).length },
            { icon: 'T', count: (activeProject?.events || []).length },
            { icon: 'I', count: (activeProject?.items || []).length },
          ].map((t, i) => (
            <div key={i} className="sw-ai-panel__count-chip">
              <span style={{ color: 'var(--text-3)', fontSize: 9 }}>{t.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: t.count > 0 ? 'var(--magenta)' : 'var(--text-4)' }}>{t.count}</span>
            </div>
          ))}
        </div>

        <button
          className={`sw-btn sw-btn--primary sw-ai-panel__btn${busy ? ' is-loading' : ''}`}
          onClick={triggerAnalysis}
          disabled={busy}
        >
          {busy
            ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Analyzing...</>
            : 'Analyze Story Now'}
        </button>

        <div className="sw-ai-panel__hint">Also runs automatically 18s after you stop typing</div>
      </div>
    </aside>
  );
}
