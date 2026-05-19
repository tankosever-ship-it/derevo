import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Archive() {
  const [tab, setTab] = useState('clans');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Архів</h1>
        <p className="text-stone-500 text-sm mt-1">База родів та архівних осіб</p>
      </div>

      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('clans')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'clans' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          📚 Роди
        </button>
        <button
          onClick={() => setTab('persons')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'persons' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          📜 Архівні особи
        </button>
      </div>

      {tab === 'clans' ? <ClansTab /> : <PersonsTab />}
    </div>
  );
}

// ─── Clans tab ───────────────────────────────────────────────────────────────

function ClansTab() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editClan, setEditClan] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => {
    api.get('/clans').then(r => setClans(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Видалити рід та всі його документи?')) return;
    await api.delete(`/clans/${id}`);
    if (selected?.id === id) setSelected(null);
    load();
  };

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  return (
    <div className="flex gap-6">
      {/* Clan list */}
      <div className="w-72 flex-shrink-0">
        <button
          onClick={() => { setEditClan(null); setShowForm(true); }}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
        >
          + Додати рід
        </button>

        {clans.length === 0 ? (
          <div className="text-center text-stone-400 py-10 text-sm">
            Жодного роду ще немає.<br />Додайте перший!
          </div>
        ) : (
          <div className="space-y-2">
            {clans.map(clan => (
              <button
                key={clan.id}
                onClick={() => setSelected(clan)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected?.id === clan.id
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-stone-200 bg-white hover:border-amber-300'
                }`}
              >
                <div className="font-semibold text-stone-800">{clan.name}</div>
                {clan.origin && <div className="text-xs text-stone-500 mt-0.5">{clan.origin}</div>}
                <div className="text-xs text-stone-400 mt-1">
                  {clan.documents.length} документ{clan.documents.length === 1 ? '' : 'ів'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clan detail */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <ClanDetail
            clan={selected}
            onEdit={() => { setEditClan(selected); setShowForm(true); }}
            onDelete={() => handleDelete(selected.id)}
            onUpdate={(updated) => {
              setSelected(updated);
              load();
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-2xl">
            Оберіть рід зі списку
          </div>
        )}
      </div>

      {showForm && (
        <ClanFormModal
          clan={editClan}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ClanDetail({ clan, onEdit, onDelete, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post(`/clans/${clan.id}/documents`, fd);
    onUpdate({ ...clan, documents: [...clan.documents, data] });
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Видалити документ?')) return;
    await api.delete(`/clans/documents/${docId}`);
    onUpdate({ ...clan, documents: clan.documents.filter(d => d.id !== docId) });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">{clan.name}</h2>
          <div className="flex gap-3 mt-1 text-sm text-stone-500">
            {clan.origin && <span>📍 {clan.origin}</span>}
            {clan.period && <span>🕰 {clan.period}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 px-3 py-1 rounded-lg"
          >
            Редагувати
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg"
          >
            Видалити
          </button>
        </div>
      </div>

      {clan.description && (
        <p className="text-stone-600 text-sm leading-relaxed mb-5 whitespace-pre-wrap">{clan.description}</p>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-700">Документи та матеріали</h3>
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
          >
            {uploading ? 'Завантаження...' : '+ Додати файл'}
          </button>
          <input ref={fileRef} type="file" onChange={handleUpload} className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx" />
        </div>

        {clan.documents.length === 0 ? (
          <div className="text-center text-stone-400 text-sm py-6 border border-dashed border-stone-200 rounded-xl">
            Документів ще немає
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {clan.documents.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onDelete={() => handleDeleteDoc(doc.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc, onDelete }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.url);

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden group relative">
      {isImage ? (
        <a href={doc.url} target="_blank" rel="noreferrer">
          <img src={doc.url} alt={doc.caption || doc.filename} className="w-full h-32 object-cover" />
        </a>
      ) : (
        <a href={doc.url} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-3 hover:bg-stone-50">
          <span className="text-2xl">📄</span>
          <span className="text-sm text-stone-700 truncate">{doc.filename}</span>
        </a>
      )}
      {doc.caption && <div className="px-3 py-1 text-xs text-stone-500">{doc.caption}</div>}
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 bg-white/80 hover:bg-red-50 text-red-500 rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

function ClanFormModal({ clan, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: clan?.name || '',
    description: clan?.description || '',
    origin: clan?.origin || '',
    period: clan?.period || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (clan) {
        await api.put(`/clans/${clan.id}`, form);
      } else {
        await api.post('/clans', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-stone-800 mb-4">
          {clan ? 'Редагувати рід' : 'Новий рід'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Назва роду *</label>
            <input value={form.name} onChange={set('name')} required placeholder="Коваленки" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Географічне походження</label>
            <input value={form.origin} onChange={set('origin')} placeholder="Полтавська обл." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Період</label>
            <input value={form.period} onChange={set('period')} placeholder="XIX–XX ст." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Опис</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              placeholder="Що відомо про цей рід, звідки походять, де жили..."
              className={`${inputCls} resize-none`} />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-stone-300 text-stone-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50">
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Persons tab ──────────────────────────────────────────────────────────────

function PersonsTab() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [lines, setLines] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/persons?archival=true'),
      api.get('/persons/meta/family-lines'),
    ]).then(([pRes, lRes]) => {
      setPeople(pRes.data);
      setLines(lRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = people.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchLine = !filterLine || p.familyLine === filterLine;
    return matchSearch && matchLine;
  });

  const grouped = filtered.reduce((acc, p) => {
    const key = p.familyLine || 'Без прив\'язки до роду';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Пошук за іменем..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={filterLine}
          onChange={(e) => setFilterLine(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Всі роди</option>
          {lines.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Link
          to="/people/new"
          state={{ isArchival: true }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Додати особу
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-stone-400 py-20">
          {people.length === 0 ? 'Архів порожній. Додайте першу архівну особу!' : 'Нікого не знайдено.'}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([line, persons]) => (
            <div key={line}>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-amber-400 inline-block"></span>
                {line}
                <span className="text-stone-400 font-normal normal-case tracking-normal">({persons.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map(person => <ArchiveCard key={person.id} person={person} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveCard({ person }) {
  const photo = person.media?.[0];
  return (
    <Link
      to={`/people/${person.id}`}
      className="border-2 border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-200 flex-shrink-0 flex items-center justify-center text-xl">
        {photo ? <img src={photo.url} alt="" className="w-full h-full object-cover" /> : '📜'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-stone-800 truncate">{person.firstName} {person.lastName}</div>
        <div className="text-xs text-stone-500 mt-0.5">
          {person.birthDate && `~${person.birthDate}`}
          {person.birthPlace && ` • ${person.birthPlace}`}
        </div>
        {person.archivalNote && (
          <div className="text-xs text-amber-700 mt-1 line-clamp-2">{person.archivalNote}</div>
        )}
      </div>
    </Link>
  );
}
