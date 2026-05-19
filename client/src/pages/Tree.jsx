import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReactFamilyTree from 'react-family-tree';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import api from '../api/client';
import { buildTreeNodes, pickRoot } from '../utils/treeAdapter';
import TreeNode, { NODE_W, NODE_H } from '../components/TreeNode';

export default function Tree() {
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rootId, setRootId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/persons?archival=false'),
      api.get('/relationships'),
    ]).then(([pRes, rRes]) => {
      setPeople(pRes.data);
      setRelationships(rRes.data);
      setRootId(pickRoot(pRes.data));
    }).finally(() => setLoading(false));
  }, []);

  const personMap = Object.fromEntries(
    people.map(p => [String(p.id), {
      ...p,
      mainPhoto: p.media?.[0]?.url ?? null,
    }])
  );

  const nodes = buildTreeNodes(people, relationships);

  const handleRootChange = useCallback((e) => {
    setRootId(e.target.value);
  }, []);

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  if (people.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-7xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-stone-700 mb-2">Поки що порожньо</h2>
        <p className="text-stone-500 mb-6">Додайте першу людину, щоб почати будувати родовід</p>
        <Link to="/people/new" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Почати будувати дерево
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Дерево роду</h1>
        <div className="flex items-center gap-3">
          {/* Root selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-500 whitespace-nowrap">Корінь дерева:</label>
            <select
              value={rootId || ''}
              onChange={handleRootChange}
              className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {people.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.firstName} {p.lastName} {p.birthDate ? `(${p.birthDate})` : ''}
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/people/new"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Додати людину
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-300 inline-block"></span>Чоловіча лінія</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-300 inline-block"></span>Жіноча лінія</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>Корінь</span>
        <span className="text-stone-400">Клік на картку → профіль · Колесо миші або щипок → зум · Тягни → переміщення</span>
      </div>

      {/* Tree canvas */}
      <div className="bg-stone-100 rounded-2xl border border-stone-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {rootId && nodes.length > 0 ? (
          <TransformWrapper
            initialScale={0.9}
            minScale={0.2}
            maxScale={2}
            centerOnInit
            limitToBounds={false}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Zoom controls */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
                  <button
                    onClick={() => zoomIn()}
                    className="w-8 h-8 bg-white border border-stone-300 rounded-lg shadow text-stone-700 hover:bg-stone-50 font-bold text-lg flex items-center justify-center"
                  >+</button>
                  <button
                    onClick={() => zoomOut()}
                    className="w-8 h-8 bg-white border border-stone-300 rounded-lg shadow text-stone-700 hover:bg-stone-50 font-bold text-lg flex items-center justify-center"
                  >−</button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-8 h-8 bg-white border border-stone-300 rounded-lg shadow text-stone-600 hover:bg-stone-50 text-xs flex items-center justify-center"
                    title="Скинути"
                  >⌂</button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ padding: '60px' }}
                >
                  <div style={{ position: 'relative' }}>
                    <ReactFamilyTree
                      nodes={nodes}
                      rootId={rootId}
                      width={NODE_W}
                      height={NODE_H}
                      placeholders
                      renderNode={(node) => (
                        <TreeNode
                          key={node.id}
                          node={node}
                          person={personMap[node.id] || null}
                          isRoot={node.id === rootId}
                          style={{
                            position: 'absolute',
                            width: NODE_W,
                            height: NODE_H,
                            transform: `translate(${node.left * (NODE_W / 2)}px, ${node.top * (NODE_H / 2)}px)`,
                          }}
                        />
                      )}
                    />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400">
            Немає даних для відображення
          </div>
        )}
      </div>
    </div>
  );
}
