import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [allPeople, setAllPeople] = useState([]);
  const [showAddRel, setShowAddRel] = useState(false);
  const [relForm, setRelForm] = useState({ personBId: '', type: 'PARENT_OF' });
  const fileRef = useRef();

  const load = () => {
    api.get(`/persons/${id}`).then(r => setPerson(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/persons?archival=false').then(r => setAllPeople(r.data));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Видалити цю людину? Всі зв\'язки також будуть видалені.')) return;
    await api.delete(`/persons/${id}`);
    navigate('/people');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/media/upload/${id}`, fd);
    load();
    setUploading(false);
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('Видалити файл?')) return;
    await api.delete(`/media/${mediaId}`);
    load();
  };

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    await api.post('/relationships', {
      personAId: Number(id),
      personBId: Number(relForm.personBId),
      type: relForm.type,
    });
    setShowAddRel(false);
    load();
  };

  const handleDeleteRelationship = async (relId) => {
    if (!confirm('Видалити зв\'язок?')) return;
    await api.delete(`/relationships/${relId}`);
    load();
  };

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;
  if (!person) return <div className="text-center text-stone-500 py-20">Особу не знайдено</div>;

  const photos = person.media.filter(m => m.type === 'PHOTO');
  const docs = person.media.filter(m => m.type === 'DOCUMENT');
  const mainPhoto = photos[0];

  const genderBg = person.gender === 'MALE'
    ? 'bg-blue-100 border-blue-300'
    : person.gender === 'FEMALE'
    ? 'bg-pink-100 border-pink-300'
    : 'bg-stone-100 border-stone-300';

  // Build relationships list
  const relationships = [
    ...person.relationshipsAsA.map(r => ({ id: r.id, type: r.type, person: r.personB, dir: 'a' })),
    ...person.relationshipsAsB.map(r => ({ id: r.id, type: r.type, person: r.personA, dir: 'b' })),
  ];

  const relLabel = (r) => {
    if (r.type === 'SPOUSE_OF') return 'Подружжя';
    if (r.type === 'PARENT_OF' && r.dir === 'a') return 'Батько/мати для';
    if (r.type === 'PARENT_OF' && r.dir === 'b') return 'Дитина від';
    return r.type;
  };

  const availablePeople = allPeople.filter(p => p.id !== person.id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/people" className="text-stone-500 hover:text-stone-800">← Люди</Link>
      </div>

      {/* Header */}
      <div className={`border-2 rounded-2xl p-6 mb-6 flex gap-6 items-start ${genderBg}`}>
        <div className="w-28 h-28 rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center text-5xl">
          {mainPhoto
            ? <img src={mainPhoto.url} alt="" className="w-full h-full object-cover" />
            : (person.gender === 'MALE' ? '👨' : person.gender === 'FEMALE' ? '👩' : '👤')}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-800">
            {person.firstName} {person.lastName}
            {person.maidenName && <span className="text-stone-500 font-normal text-base ml-2">(дів. {person.maidenName})</span>}
          </h1>
          {person.isArchival && (
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
              Архівна особа
            </span>
          )}
          <div className="mt-2 text-stone-600 text-sm space-y-0.5">
            {(person.birthDate || person.birthPlace) && (
              <div>🎂 {person.birthDate} {person.birthPlace && `• ${person.birthPlace}`}</div>
            )}
            {(person.deathDate || person.deathPlace) && (
              <div>✝ {person.deathDate} {person.deathPlace && `• ${person.deathPlace}`}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/people/${id}/edit`}
            className="text-sm border border-stone-400 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Редагувати
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bio */}
        {person.bio && (
          <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Про людину</h2>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Archival note */}
        {person.isArchival && person.archivalNote && (
          <div className="md:col-span-2 bg-amber-50 rounded-xl border border-amber-200 p-5">
            <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">Нотатки (архів)</h2>
            {person.familyLine && (
              <div className="text-sm text-amber-700 mb-2">Родова лінія: <strong>{person.familyLine}</strong></div>
            )}
            <p className="text-stone-700 whitespace-pre-wrap text-sm">{person.archivalNote}</p>
          </div>
        )}

        {/* Relationships */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Зв'язки</h2>
            <button
              onClick={() => setShowAddRel(!showAddRel)}
              className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
            >
              + Додати
            </button>
          </div>

          {showAddRel && (
            <form onSubmit={handleAddRelationship} className="mb-4 p-3 bg-stone-50 rounded-lg space-y-2">
              <select
                value={relForm.personBId}
                onChange={e => setRelForm(f => ({ ...f, personBId: e.target.value }))}
                required
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">— оберіть людину —</option>
                {availablePeople.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
              <select
                value={relForm.type}
                onChange={e => setRelForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="PARENT_OF">Є батьком/матір'ю для обраного</option>
                <option value="SPOUSE_OF">Подружжя</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded hover:bg-emerald-800">
                  Зберегти
                </button>
                <button type="button" onClick={() => setShowAddRel(false)} className="text-xs text-stone-500 px-2 py-1.5">
                  Скасувати
                </button>
              </div>
            </form>
          )}

          {relationships.length === 0 ? (
            <p className="text-stone-400 text-sm">Зв'язки ще не додано</p>
          ) : (
            <ul className="space-y-2">
              {relationships.map(r => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-stone-400 text-xs">{relLabel(r)}: </span>
                    <Link to={`/people/${r.person.id}`} className="text-emerald-700 hover:underline font-medium">
                      {r.person.firstName} {r.person.lastName}
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDeleteRelationship(r.id)}
                    className="text-red-400 hover:text-red-600 text-xs ml-2"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Фото та документи</h2>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors disabled:opacity-50"
            >
              {uploading ? '...' : '+ Завантажити'}
            </button>
            <input type="file" ref={fileRef} onChange={handleUpload} className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx" />
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map(m => (
                <div key={m.id} className="relative group">
                  <img src={m.url} alt={m.caption || ''} className="w-full h-20 object-cover rounded-lg" />
                  <button
                    onClick={() => handleDeleteMedia(m.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {docs.length > 0 && (
            <ul className="space-y-1">
              {docs.map(m => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <a href={m.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    📄 {m.filename}
                  </a>
                  <button onClick={() => handleDeleteMedia(m.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                </li>
              ))}
            </ul>
          )}

          {person.media.length === 0 && (
            <p className="text-stone-400 text-sm">Файли ще не завантажено</p>
          )}
        </div>
      </div>
    </div>
  );
}
