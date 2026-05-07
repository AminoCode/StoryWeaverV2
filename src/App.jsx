import React, { useState, useEffect, useCallback, useRef, createContext } from 'react';
import './index.css';

import { loadData, saveData, makeCharacter, makeLocation, makeEvent, makeItem } from './store';
import { runAnalysis } from './hooks/useAI';
import { getSession, onAuthChange } from './services/auth';
import { loadUserProjects, saveProjectToDB } from './services/db-store';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import Characters from './components/Characters';
import Locations from './components/Locations';
import Timeline from './components/Timeline';
import Items from './components/Items';
import Relationships from './components/Relationships';
import ProjectManager from './components/ProjectManager';
import AuthGate from './components/AuthGate';
import Profile from './components/Profile';

export const AppContext = createContext({});

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="sw-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`sw-toast sw-toast--${t.type}`} onClick={() => remove(t.id)} style={{ cursor: 'pointer' }}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warn' ? '⚠' : 'ℹ'}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]                     = useState(loadData);
  const [activeView, setActiveView]         = useState('dashboard');
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [aiStatus, setAiStatus]             = useState('idle');
  const [toasts, setToasts]                 = useState([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [lastScan, setLastScan]             = useState(null);
  const [user, setUser]                     = useState(null);
  const [dbSynced, setDbSynced]             = useState(false);
  const [authReady, setAuthReady]           = useState(false);
  const dbSaveTimer                         = useRef(null);

  const activeProject = (data.projects || []).find(p => p.id === data.activeProjectId) || data.projects?.[0] || null;

  // ── Auth: initialize and listen ──────────────────────────────────────────────
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const session = await getSession();
        setUser(session?.user || null);
        setAuthReady(true);
        if (session?.user) await syncFromDB(session.user);
        unsub = await onAuthChange(async (session) => {
          const u = session?.user || null;
          setUser(u);
          if (u) await syncFromDB(u);
          else setDbSynced(false);
        });
      } catch {
        setAuthReady(true); // auth not configured — continue without it
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []); // eslint-disable-line

  // Load projects from DB into local state on sign-in
  async function syncFromDB(u) {
    try {
      const dbProjects = await loadUserProjects(u.id);
      if (dbProjects.length > 0) {
        setData(prev => {
          const localIds = new Set((prev.projects || []).map(p => p.id));
          const newOnes  = dbProjects.filter(p => !localIds.has(p.id));
          return {
            ...prev,
            projects: [...(prev.projects || []), ...newOnes],
          };
        });
        setDbSynced(true);
      }
    } catch { /* DB unavailable — continue with localStorage */ }
  }

  // ── Persist to localStorage on every data change ──────────────────────────────
  useEffect(() => { saveData(data); }, [data]);

  // ── 5-second autosave to DB ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !activeProject) return;
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current);
    dbSaveTimer.current = setTimeout(async () => {
      try {
        const newDbId = await saveProjectToDB(user.id, activeProject);
        // Attach _dbId back onto the project if it was new
        if (newDbId && !activeProject._dbId) {
          setData(prev => ({
            ...prev,
            projects: (prev.projects || []).map(p =>
              p.id === prev.activeProjectId ? { ...p, _dbId: newDbId } : p
            ),
          }));
        }
        setDbSynced(true);
      } catch { /* silently fail — localStorage still saves */ }
    }, 5000);
    return () => clearTimeout(dbSaveTimer.current);
  }, [data, user, activeProject]); // eslint-disable-line

  // ── Project picker on no project ─────────────────────────────────────────────
  useEffect(() => { if (!activeProject) setShowProjectPicker(true); }, [activeProject]);

  // ── Default chapter ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeProject && !activeChapterId)
      setActiveChapterId(activeProject.chapters?.[0]?.id || null);
  }, [activeProject?.id, activeChapterId]); // eslint-disable-line

  // ── Toast helpers ─────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Project updater ───────────────────────────────────────────────────────────
  const updateProject = useCallback((patch) => {
    setData(prev => ({
      ...prev,
      projects: (prev.projects || []).map(p =>
        p.id === prev.activeProjectId ? { ...p, ...patch, updatedAt: Date.now() } : p
      ),
    }));
  }, []);

  // ── AI entity merge ───────────────────────────────────────────────────────────
  const applyAIUpdate = useCallback((parsed, project) => {
    if (!project || !parsed) return { characters: 0, locations: 0, events: 0, items: 0 };
    const counts = { characters: 0, locations: 0, events: 0, items: 0 };
    let chars = [...(project.characters || [])];
    let locs  = [...(project.locations  || [])];
    let evts  = [...(project.events     || [])];
    let items = [...(project.items      || [])];

    (parsed.characters || []).forEach(pc => {
      if (!pc.name?.trim()) return;
      const ex = chars.find(c => c.name.toLowerCase() === pc.name.toLowerCase());
      if (ex) { if (pc.description && !ex.description) { chars = chars.map(c => c.id === ex.id ? { ...c, description: pc.description } : c); counts.characters++; } }
      else { const nc = makeCharacter(pc.name); nc.role = pc.role || 'minor'; nc.description = pc.description || ''; nc.aiExtracted = true; chars = [...chars, nc]; counts.characters++; }
    });
    (parsed.locations || []).forEach(pl => {
      if (!pl.name?.trim()) return;
      const ex = locs.find(l => l.name.toLowerCase() === pl.name.toLowerCase());
      if (ex) { if (pl.description && !ex.description) { locs = locs.map(l => l.id === ex.id ? { ...l, description: pl.description } : l); counts.locations++; } }
      else { const nl = makeLocation(pl.name); nl.type = pl.type || 'other'; nl.description = pl.description || ''; nl.atmosphere = pl.atmosphere || ''; nl.aiExtracted = true; locs = [...locs, nl]; counts.locations++; }
    });
    (parsed.events || []).forEach(pe => {
      if (!pe.title?.trim()) return;
      if (!evts.find(e => e.title.toLowerCase() === pe.title.toLowerCase())) {
        const ne = makeEvent(pe.title); ne.description = pe.description || ''; ne.importance = pe.importance || 'minor'; ne.aiExtracted = true; evts = [...evts, ne]; counts.events++;
      }
    });
    (parsed.items || []).forEach(pi => {
      if (!pi.name?.trim()) return;
      if (!items.find(it => it.name.toLowerCase() === pi.name.toLowerCase())) {
        const ni = makeItem(pi.name); ni.type = pi.type || 'object'; ni.description = pi.description || ''; ni.aiExtracted = true; items = [...items, ni]; counts.items++;
      }
    });

    setData(prev => ({
      ...prev,
      projects: (prev.projects || []).map(p =>
        p.id === prev.activeProjectId
          ? { ...p, characters: chars, locations: locs, events: evts, items, updatedAt: Date.now() }
          : p
      ),
    }));
    return counts;
  }, []);

  // ── Global AI analysis ────────────────────────────────────────────────────────
  const triggerAnalysis = useCallback(async () => {
    if (aiStatus === 'analyzing' || aiStatus === 'pending') return;
    const project = (data.projects || []).find(p => p.id === data.activeProjectId) || data.projects?.[0];
    if (!project) return;
    const allHtml = (project.chapters || []).map(c => c.content || '').join('\n');
    if (allHtml.replace(/<[^>]*>/g, ' ').trim().length < 20) { showToast('Write some story content first', 'warn'); return; }
    try {
      const counts = await runAnalysis({
        html: allHtml, project,
        onUpdate:       (parsed) => applyAIUpdate(parsed, project),
        onStatusChange: setAiStatus,
      });
      if (counts) {
        const parts = [
          counts.characters && `${counts.characters} character${counts.characters !== 1 ? 's' : ''}`,
          counts.locations  && `${counts.locations} location${counts.locations !== 1 ? 's' : ''}`,
          counts.events     && `${counts.events} event${counts.events !== 1 ? 's' : ''}`,
          counts.items      && `${counts.items} item${counts.items !== 1 ? 's' : ''}`,
        ].filter(Boolean);
        showToast(parts.length ? `Extracted: ${parts.join(', ')}` : 'No new entities found', parts.length ? 'success' : 'info');
        setLastScan({ counts, timestamp: Date.now() });
      }
    } catch { /* handled in runAnalysis */ }
  }, [aiStatus, data, applyAIUpdate, showToast]);

  // ── Context ───────────────────────────────────────────────────────────────────
  const ctx = {
    data, setData,
    activeProject,
    activeView, setActiveView,
    activeChapterId, setActiveChapterId,
    aiStatus, setAiStatus,
    showToast,
    showProjectPicker, setShowProjectPicker,
    updateProject, applyAIUpdate,
    triggerAnalysis, lastScan,
    user, dbSynced,
  };

  const VIEWS = {
    dashboard:     <Dashboard />,
    editor:        <Editor />,
    characters:    <Characters />,
    locations:     <Locations />,
    timeline:      <Timeline />,
    items:         <Items />,
    relationships: <Relationships />,
    profile:       <Profile />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="sw-shell">
        <Sidebar />
        <div className="sw-content">
          {VIEWS[activeView] || <Dashboard />}
        </div>

        {showProjectPicker && <ProjectManager onClose={() => setShowProjectPicker(false)} />}
        {activeView === '__auth' && <AuthGate onClose={() => setActiveView('dashboard')} />}
        <Toast toasts={toasts} remove={removeToast} />
      </div>
    </AppContext.Provider>
  );
}
