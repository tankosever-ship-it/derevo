import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Archive() {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Архів</h1>
          <p className="text-stone-500 text-sm mt-1">
            Особи, знайдені в архівах — зв'язок із родом не підтверджено
          </p>
        </div>
        <Link
          to="/people/new"
          state={{ isArchival: true }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Додати архівну особу
        </Link>
      </div>

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
          {lines.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-stone-400 py-20">
          {people.length === 0
            ? 'Архів порожній. Додайте першу архівну особу!'
            : 'Нікого не знайдено.'}
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
                {persons.map(person => (
                  <ArchiveCard key={person.id} person={person} />
                ))}
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
        {photo
          ? <img src={photo.url} alt="" className="w-full h-full object-cover" />
          : '📜'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-stone-800 truncate">
          {person.firstName} {person.lastName}
        </div>
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
