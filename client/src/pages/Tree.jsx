import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Tree() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/persons?archival=false')
      .then(r => setPeople(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Дерево роду</h1>
        <Link
          to="/people/new"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Додати людину
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold text-stone-700 mb-2">Поки що порожньо</h2>
          <p className="text-stone-500 mb-6">Додайте першу людину, щоб почати будувати родовід</p>
          <Link
            to="/people/new"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Почати будувати дерево
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🌳</div>
          <p className="text-stone-600 font-medium">
            Інтерактивне дерево з'явиться на наступному етапі розробки
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Зараз доступно {people.length} {people.length === 1 ? 'людина' : 'людей'} у розділі "Люди"
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {people.slice(0, 8).map(p => (
              <Link
                key={p.id}
                to={`/people/${p.id}`}
                className={`rounded-xl p-3 border-2 hover:shadow transition-shadow text-sm ${
                  p.gender === 'MALE' ? 'bg-blue-50 border-blue-200' :
                  p.gender === 'FEMALE' ? 'bg-pink-50 border-pink-200' :
                  'bg-white border-stone-200'
                }`}
              >
                <div className="font-medium text-stone-800 truncate">{p.firstName}</div>
                <div className="text-stone-500 truncate">{p.lastName}</div>
                {p.birthDate && <div className="text-xs text-stone-400 mt-0.5">{p.birthDate}</div>}
              </Link>
            ))}
          </div>
          {people.length > 8 && (
            <Link to="/people" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">
              Переглянути всіх ({people.length}) →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
