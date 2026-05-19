import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Handle, Position, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

// ─── Layout ──────────────────────────────────────────────────────────────────

function getLayoutedElements(nodes, edges) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });
  nodes.forEach(n => g.setNode(n.id, { width: 170, height: 100 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  Dagre.layout(g);
  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - 85, y: pos.y - 50 } };
    }),
    edges,
  };
}

// ─── Leaf Node ───────────────────────────────────────────────────────────────

function LeafNode({ data }) {
  const isMale = data.gender === 'MALE';
  const isFemale = data.gender === 'FEMALE';
  const nodeBg = isMale ? '#E2F3E4' : isFemale ? '#F3F8E2' : '#EEF5EC';

  return (
    <div
      style={{
        width: 170, minHeight: 90,
        background: nodeBg,
        border: '2px solid #94C98C',
        borderRadius: '50% / 40%',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px 8px 10px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(80,120,80,0.12)',
        position: 'relative',
      }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#94C98C', border: 'none', width: 8, height: 8 }} />

      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: '2px solid #94C98C',
        background: '#C8E6C9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {data.photo
          ? <img src={data.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{isMale ? '👨' : isFemale ? '👩' : '👤'}</span>
        }
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#2D4F2D', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
          {data.firstName}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#2D4F2D', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
          {data.lastName}
        </div>
        {(data.birthDate || data.deathDate) && (
          <div style={{ fontSize: 10, color: '#6B8E6B', marginTop: 2 }}>
            {data.birthDate || '?'}{data.deathDate ? ` – ${data.deathDate}` : ''}
          </div>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); data.onAddChild(); }}
        title="Додати зв'язок"
        style={{
          position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: '#6aab5e', border: '2px solid white',
          color: 'white', fontSize: 14, lineHeight: '18px', textAlign: 'center',
          cursor: 'pointer', zIndex: 10, padding: 0,
        }}
      >+</button>

      <Handle type="source" position={Position.Bottom} style={{ background: '#94C98C', border: 'none', width: 8, height: 8, bottom: -4 }} />
    </div>
  );
}

const nodeTypes = { leaf: LeafNode };

const edgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#B9D8B2', strokeWidth: 2.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94C98C', width: 12, height: 12 },
};

// ─── Build ReactFlow data from API ───────────────────────────────────────────

function buildFlow(persons, relationships, callbacks) {
  const nodes = persons.map(p => ({
    id: String(p.id),
    type: 'leaf',
    position: { x: 0, y: 0 },
    data: {
      ...p,
      photo: p.media?.find(m => m.type === 'PHOTO')?.url || null,
      onClick: () => callbacks.onNodeClick(p),
      onAddChild: () => callbacks.onAddChild(p),
    },
  }));

  const edges = relationships
    .filter(r => r.type === 'PARENT_OF')
    .map(r => ({
      id: `e-${r.personAId}-${r.personBId}`,
      source: String(r.personAId),
      target: String(r.personBId),
      ...edgeOptions,
    }));

  return getLayoutedElements(nodes, edges);
}

// ─── Tree page ────────────────────────────────────────────────────────────────

export default function Tree() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState([]);
  const [panel, setPanel] = useState(null);
  const [addRelForm, setAddRelForm] = useState({ personBId: '', type: 'PARENT_OF' });
  const [allPeople, setAllPeople] = useState([]);

  const load = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      api.get('/persons?archival=false'),
      api.get('/relationships'),
    ]);
    setPersons(pRes.data);
    setAllPeople(pRes.data);

    const { nodes: n, edges: e } = buildFlow(pRes.data, rRes.data, {
      onNodeClick: (p) => setPanel({ type: 'person', person: p }),
      onAddChild: (p) => setPanel({ type: 'addChild', parent: p }),
    });
    setNodes(n);
    setEdges(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    await api.post('/relationships', {
      personAId: panel.parent.id,
      personBId: Number(addRelForm.personBId),
      type: addRelForm.type,
    });
    setPanel(null);
    setAddRelForm({ personBId: '', type: 'PARENT_OF' });
    load();
  };

  const handleDeletePerson = async (id) => {
    if (!confirm('Видалити цю людину?')) return;
    await api.delete(`/persons/${id}`);
    setPanel(null);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-stone-500">Завантаження дерева...</div>
  );

  if (persons.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-6xl">🌱</div>
      <p className="text-stone-500">Дерево порожнє. Додайте першу людину!</p>
      <button onClick={() => navigate('/people/new')}
        className="bg-emerald-700 text-white px-5 py-2 rounded-lg hover:bg-emerald-800">
        + Додати людину
      </button>
    </div>
  );

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 80px)', background: '#F8FAF5', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        style={{ background: '#F8FAF5' }}
      >
        <Background color="#C8E6C9" gap={28} size={1} />
        <Controls style={{ background: 'white', border: '1px solid #C8E6C9' }} />
        <MiniMap
          nodeColor={n => n.data?.gender === 'MALE' ? '#E2F3E4' : '#F3F8E2'}
          style={{ border: '1px solid #C8E6C9' }}
        />
      </ReactFlow>

      <button
        onClick={() => navigate('/people/new')}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 20,
          background: '#6aab5e', color: 'white', border: 'none',
          borderRadius: 10, padding: '8px 18px', fontWeight: 600,
          cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(80,120,80,0.25)',
        }}
      >
        + Додати людину
      </button>

      {panel && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 300,
          background: 'white', borderLeft: '2px solid #C8E6C9',
          zIndex: 30, overflowY: 'auto', padding: 20,
          boxShadow: '-4px 0 20px rgba(80,120,80,0.1)',
        }}>
          <button onClick={() => setPanel(null)} style={{ float: 'right', fontSize: 18, color: '#6B8E6B', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>

          {panel.type === 'person' && (
            <PersonPanel
              person={panel.person}
              onEdit={() => navigate(`/people/${panel.person.id}/edit`)}
              onDelete={() => handleDeletePerson(panel.person.id)}
              onAddChild={() => setPanel({ type: 'addChild', parent: panel.person })}
            />
          )}

          {panel.type === 'addChild' && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ color: '#2D4F2D', fontWeight: 700, marginBottom: 4 }}>Додати зв'язок</h3>
              <p style={{ color: '#6B8E6B', fontSize: 12, marginBottom: 16 }}>
                Від: <strong>{panel.parent.firstName} {panel.parent.lastName}</strong>
              </p>
              <form onSubmit={handleAddRelationship} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#2D4F2D', display: 'block', marginBottom: 4 }}>Тип зв'язку</label>
                  <select
                    value={addRelForm.type}
                    onChange={e => setAddRelForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #C8E6C9', fontSize: 13 }}
                  >
                    <option value="PARENT_OF">Батько/Мати → Дитина</option>
                    <option value="SPOUSE_OF">Чоловік/Дружина</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#2D4F2D', display: 'block', marginBottom: 4 }}>Людина</label>
                  <select
                    required
                    value={addRelForm.personBId}
                    onChange={e => setAddRelForm(f => ({ ...f, personBId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #C8E6C9', fontSize: 13 }}
                  >
                    <option value="">Оберіть...</option>
                    {allPeople.filter(p => p.id !== panel.parent.id).map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" style={{ background: '#6aab5e', color: 'white', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 600, cursor: 'pointer' }}>
                  Додати зв'язок
                </button>
                <button type="button" onClick={() => setPanel(null)} style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, padding: '8px 0', cursor: 'pointer', color: '#555' }}>
                  Скасувати
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Person panel ─────────────────────────────────────────────────────────────

function PersonPanel({ person, onEdit, onDelete, onAddChild }) {
  const photo = person.media?.find(m => m.type === 'PHOTO');

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 10px',
          overflow: 'hidden', border: '3px solid #94C98C', background: '#E2F3E4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>
          {photo
            ? <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (person.gender === 'MALE' ? '👨' : person.gender === 'FEMALE' ? '👩' : '👤')
          }
        </div>
        <h3 style={{ color: '#2D4F2D', fontWeight: 700, fontSize: 16, margin: 0 }}>
          {person.firstName} {person.lastName}
        </h3>
        {person.maidenName && <div style={{ color: '#6B8E6B', fontSize: 12 }}>({person.maidenName})</div>}
      </div>

      <div style={{ background: '#F8FAF5', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, lineHeight: 1.6 }}>
        {person.birthDate && <div style={{ color: '#2D4F2D' }}>🎂 {person.birthDate}{person.birthPlace && `, ${person.birthPlace}`}</div>}
        {person.deathDate && <div style={{ color: '#6B8E6B' }}>✝ {person.deathDate}{person.deathPlace && `, ${person.deathPlace}`}</div>}
        {person.bio && <div style={{ color: '#555', marginTop: 8 }}>{person.bio}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={onAddChild} style={{ background: '#E2F3E4', border: '1.5px solid #94C98C', borderRadius: 8, padding: '9px 0', color: '#2D4F2D', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          + Додати зв'язок
        </button>
        <button onClick={onEdit} style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 8, padding: '9px 0', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          ✏️ Редагувати
        </button>
        <button onClick={onDelete} style={{ background: '#FFF5F5', border: '1.5px solid #FC8181', borderRadius: 8, padding: '9px 0', color: '#C53030', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          🗑 Видалити
        </button>
      </div>
    </div>
  );
}
