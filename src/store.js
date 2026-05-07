const STORAGE_KEY = 'storyweaver_v1';

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function charColor(name) {
  const colors = ['#e040fb', '#4361ee', '#00d4ff', '#ff6b35', '#00e5a0', '#ff3d3d', '#9b5de5', '#e5447d'];
  let hash = 0;
  for (const c of String(name)) hash = (hash * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return colors[hash % colors.length];
}

function defaultProject(name = 'Untitled Project') {
  return {
    id: uuid(),
    name,
    description: '',
    genre: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: [{ id: uuid(), title: 'Chapter 1', content: '', wordCount: 0, createdAt: Date.now(), updatedAt: Date.now() }],
    characters: [],
    locations: [],
    events: [],
    items: [],
    relationships: [],
  };
}

function getDefault() {
  const project = defaultProject('My First Story');
  return { projects: [project], activeProjectId: project.id };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    return { ...getDefault(), ...JSON.parse(raw) };
  } catch {
    return getDefault();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] Save failed:', e);
  }
}

export function makeCharacter(name = 'New Character') {
  return {
    id: uuid(),
    name,
    role: 'minor',
    description: '',
    backstory: '',
    traits: [],
    imageColor: charColor(name),
    nodeX: 200 + Math.random() * 400,
    nodeY: 200 + Math.random() * 300,
    aiExtracted: false,
    createdAt: Date.now(),
  };
}

export function makeLocation(name = 'New Location') {
  return {
    id: uuid(),
    name,
    type: 'other',
    description: '',
    atmosphere: '',
    aiExtracted: false,
    createdAt: Date.now(),
  };
}

export function makeEvent(title = 'New Event') {
  return {
    id: uuid(),
    title,
    description: '',
    importance: 'minor',
    chapter: '',
    when: '',
    order: Date.now(),
    aiExtracted: false,
    createdAt: Date.now(),
  };
}

export function makeItem(name = 'New Item') {
  return {
    id: uuid(),
    name,
    type: 'object',
    description: '',
    significance: '',
    holder: '',
    aiExtracted: false,
    createdAt: Date.now(),
  };
}

export function makeRelationship(fromId, toId, type = 'neutral') {
  return { id: uuid(), fromId, toId, type, description: '' };
}

export function makeChapter(title) {
  return { id: uuid(), title: title || 'New Chapter', content: '', wordCount: 0, createdAt: Date.now(), updatedAt: Date.now() };
}

export function countWords(html) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

export { uuid, charColor };
