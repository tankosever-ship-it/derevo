import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/persons?archival=false')
      .then(r => setPeople(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = people.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Люди</h1>
        <Link
          to="/people/new"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Додати людину
        </Link>
      </div>

      <input
        type="text"
        placeholder="Пошук за іменем..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-stone-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {filtered.length === 0 ? (
        <div className="text-center text-stone-400 py-20">
          {people.length === 0
            ? 'Поки що нікого немає. Додайте першу людину!'
            : 'Нікого не знайдено за запитом.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(person => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }) {
  const photo = person.media?.[0];
  const genderColor = person.gender === 'MALE'
    ? 'border-blue-300 bg-blue-50'
    : person.gender === 'FEMALE'
    ? 'border-pink-300 bg-pink-50'
    : 'border-stone-300 bg-white';

  return (
    <Link
      to={`/people/${person.id}`}
      className={`border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${genderColor}`}
    >
      <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center text-2xl">
        {photo
          ? <img src={photo.url} alt="" className="w-full h-full object-cover" />
          : (person.gender === 'MALE' ? '👨' : person.gender === 'FEMALE' ? '👩' : '👤')}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-stone-800 truncate">
          {person.firstName} {person.lastName}
        </div>
        {person.maidenName && (
          <div className="text-xs text-stone-500">(дівоче: {person.maidenName})</div>
        )}
        <div className="text-sm text-stone-500">
          {person.birthDate && `${person.birthDate}`}
          {person.birthDate && person.deathDate && ' — '}
          {person.deathDate && `${person.deathDate}`}
        </div>
      </div>
    </Link>
  );
}
