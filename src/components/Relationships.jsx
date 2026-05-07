import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import Modal from './Modal';
import { makeRelationship } from '../store';

const REL_TYPES = ['ally', 'enemy', 'family', 'romantic', 'mentor', 'rival', 'neutral'];
const REL_COLORS = {
  ally: '#00d4ff', enemy: '#ff3d3d', family: '#e040fb',
  romantic: '#ff6b8a', mentor: '#4361ee', rival: '#ff6b35', neutral: '#44445a'
};
const REL_BADGE = {
  ally: 'cyan', enemy: 'red', family: 'magenta',
  romantic: 'orange', mentor: 'blue', rival: 'orange', neutral: 'muted'
};

function autoLayout(characters, canvasW, canvasH) {
  const count = characters.length;
  const cx = canvasW / 2, cy = canvasH / 2;
  const r = Math.min(cx, cy) * 0.65;
  const positions = {};
  characters.forEach((c, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions[c.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return positions;
}

export default function Relationships() {
  const { activeProject, updateProject, showToast } = useContext(AppContext);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [hovered, setHovered] = useState(null);

  const characters = activeProject?.characters || [];
  const relationships = activeProject?.relationships || [];

  // Init positions from character data or auto-layout
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 800, h = rect.height || 600;
    const pos = {};
    const needsLayout = characters.some(c => !c.nodeX);
    const auto = needsLayout ? autoLayout(characters, w, h) : {};
    characters.forEach(c => {
      pos[c.id] = needsLayout ? auto[c.id] : { x: c.nodeX || 200, y: c.nodeY || 200 };
    });
    setPositions(pos);
  }, [characters.length]);

  const handleMouseDown = useCallback((e, charId) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = positions[charId];
    if (!pos) return;
    setDragging({ id: charId, offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y });
  }, [positions]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPositions(prev => ({ ...prev, [dragging.id]: { x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    const pos = positions[dragging.id];
    const updated = characters.map(c => c.id === dragging.id ? { ...c, nodeX: pos.x, nodeY: pos.y } : c);
    updateProject({ characters: updated });
    setDragging(null);
  }, [dragging, positions, characters, updateProject]);

  const handleAutoLayout = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const auto = autoLayout(characters, rect.width, rect.height);
    setPositions(auto);
    const updated = characters.map(c => ({ ...c, nodeX: auto[c.id]?.x, nodeY: auto[c.id]?.y }));
    updateProject({ characters: updated });
  };

  const openNew = () => {
    if (characters.length < 2) { showToast('Add at least 2 characters first', 'warn'); return; }
    setEditing({ ...makeRelationship(characters[0].id, characters[1].id) });
    setIsNew(true);
  };
  const openEdit = (rel) => { setEditing({ ...rel }); setIsNew(false); };
  const closeModal = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing.fromId || !editing.toId || editing.fromId === editing.toId) {
      showToast('Select two different characters', 'warn'); return;
    }
    const rels = activeProject?.relationships || [];
    const updated = isNew ? [...rels, editing] : rels.map(r => r.id === editing.id ? editing : r);
    updateProject({ relationships: updated });
    showToast(isNew ? 'Relationship added' : 'Relationship updated', 'success');
    closeModal();
  };

  const remove = (id) => {
    updateProject({ relationships: relationships.filter(r => r.id !== id) });
    showToast('Relationship removed', 'info');
    closeModal();
  };

  const getChar = (id) => characters.find(c => c.id === id);

  const getCurvedPath = (from, to) => {
    if (!from || !to) return '';
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offset = len * 0.15;
    const nx = -dy / len, ny = dx / len;
    const cx = mx + nx * offset, cy = my + ny * offset;
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  };

  const NODE_R = 36;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'var(--s5) var(--s7) var(--s4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Relationships</h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-secondary)' }}>
            {characters.length} characters · {relationships.length} connections
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--s3)' }}>
          <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={handleAutoLayout} title="Auto-arrange nodes">⊹ Auto Layout</button>
          <button className="sw-btn sw-btn--primary" onClick={openNew}>+ Add Relationship</button>
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="sw-graph-shell" style={{ flex: 1, margin: 'var(--s5) var(--s7)', borderRadius: 'var(--r3)' }}>
        {characters.length === 0 ? (
          <div className="sw-graph-empty">
            <div style={{ fontSize: 48, opacity: 0.2 }}>⬡</div>
            <p>Add characters first, then define their relationships here.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="sw-graph-canvas"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              {/* Grid background */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
              {/* Arrow markers per relationship type */}
              {REL_TYPES.map(type => (
                <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={REL_COLORS[type]} opacity="0.7" />
                </marker>
              ))}
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {relationships.map(rel => {
              const from = positions[rel.fromId];
              const to = positions[rel.toId];
              if (!from || !to) return null;
              const path = getCurvedPath(from, to);
              const color = REL_COLORS[rel.type] || REL_COLORS.neutral;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const isHovered = hovered === rel.id;
              return (
                <g key={rel.id} onClick={() => openEdit(rel)} style={{ cursor: 'pointer' }}>
                  {/* Click target */}
                  <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
                  {/* Visible line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 1.5}
                    opacity={isHovered ? 0.9 : 0.5}
                    markerEnd={`url(#arrow-${rel.type})`}
                    style={{ transition: 'stroke-width 0.15s, opacity 0.15s' }}
                    onMouseEnter={() => setHovered(rel.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {/* Label */}
                  {isHovered && (
                    <g>
                      <rect x={mx - 30} y={my - 12} width={60} height={18} rx={4} fill="var(--bg-card)" stroke={color} strokeWidth={1} opacity={0.95} />
                      <text x={mx} y={my + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={9} fontFamily="Fragment Mono" letterSpacing="0.06em">
                        {rel.type}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {characters.map(char => {
              const pos = positions[char.id];
              if (!pos) return null;
              const isDragging = dragging?.id === char.id;
              return (
                <g
                  key={char.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onMouseDown={e => handleMouseDown(e, char.id)}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
                >
                  {/* Glow ring */}
                  <circle r={NODE_R + 6} fill="transparent" stroke={char.imageColor} strokeWidth={1} opacity={0.2} />
                  {/* Main circle */}
                  <circle r={NODE_R} fill={char.imageColor} opacity={isDragging ? 0.9 : 1} style={{ filter: isDragging ? `drop-shadow(0 0 12px ${char.imageColor})` : `drop-shadow(0 0 6px ${char.imageColor}55)` }} />
                  {/* Initial */}
                  <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={18} fontFamily="Playfair Display" fontWeight="700" style={{ pointerEvents: 'none' }}>
                    {char.name[0]?.toUpperCase()}
                  </text>
                  {/* Name label */}
                  <text textAnchor="middle" y={NODE_R + 16} fill="var(--text-secondary)" fontSize={11} fontFamily="Fragment Mono" style={{ pointerEvents: 'none' }}>
                    {char.name.length > 10 ? char.name.slice(0, 9) + '…' : char.name}
                  </text>
                  {/* Role label */}
                  <text textAnchor="middle" y={NODE_R + 29} fill="var(--text-muted)" fontSize={9} fontFamily="Fragment Mono" style={{ pointerEvents: 'none' }}>
                    {char.role}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Graph controls */}
        <div className="sw-graph-controls">
          <button className="sw-graph-ctrl-btn" onClick={handleAutoLayout} title="Auto layout">⊹</button>
        </div>

        {/* Legend */}
        <div className="sw-graph-legend">
          {REL_TYPES.map(t => (
            <div key={t} className="sw-graph-legend__row">
              <div className="sw-graph-legend__dot" style={{ background: REL_COLORS[t] }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Relationship list */}
      {relationships.length > 0 && (
        <div style={{ padding: '0 var(--s7) var(--s5)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>Connections</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)' }}>
            {relationships.map(rel => {
              const from = getChar(rel.fromId);
              const to = getChar(rel.toId);
              if (!from || !to) return null;
              return (
                <div
                  key={rel.id}
                  onClick={() => openEdit(rel)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s2)',
                    padding: 'var(--s2) var(--s3)',
                    background: 'var(--bg-card)',
                    border: `1px solid ${REL_COLORS[rel.type]}44`,
                    borderRadius: 'var(--r2)',
                    cursor: 'pointer',
                    transition: 'border-color var(--dur-base)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = REL_COLORS[rel.type]}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${REL_COLORS[rel.type]}44`}
                >
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-primary)' }}>{from.name}</span>
                  <span style={{ color: REL_COLORS[rel.type], fontSize: 10 }}>—{rel.type}→</span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-primary)' }}>{to.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? 'New Relationship' : 'Edit Relationship'}
          onClose={closeModal}
          footer={
            <>
              {!isNew && <button className="sw-btn sw-btn--danger sw-btn--sm" onClick={() => remove(editing.id)}>Remove</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--s3)' }}>
                <button className="sw-btn sw-btn--ghost" onClick={closeModal}>Cancel</button>
                <button className="sw-btn sw-btn--primary" onClick={save}>Save</button>
              </div>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
            <div className="sw-field">
              <label className="sw-field__label">From</label>
              <select className="sw-field__select" value={editing.fromId} onChange={e => setEditing(p => ({ ...p, fromId: e.target.value }))}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sw-field">
              <label className="sw-field__label">To</label>
              <select className="sw-field__select" value={editing.toId} onChange={e => setEditing(p => ({ ...p, toId: e.target.value }))}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Relationship Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)' }}>
              {REL_TYPES.map(t => (
                <div
                  key={t}
                  onClick={() => setEditing(p => ({ ...p, type: t }))}
                  style={{
                    padding: 'var(--s2) var(--s3)',
                    borderRadius: 'var(--r1)',
                    border: `1px solid ${editing.type === t ? REL_COLORS[t] : 'var(--border-mid)'}`,
                    background: editing.type === t ? `${REL_COLORS[t]}15` : 'transparent',
                    color: editing.type === t ? REL_COLORS[t] : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: REL_COLORS[t], display: 'inline-block' }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Notes</label>
            <textarea className="sw-field__textarea" rows={2} value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} placeholder="Describe this relationship…" />
          </div>
        </Modal>
      )}
    </div>
  );
}
