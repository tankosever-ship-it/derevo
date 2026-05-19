import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-700 text-white'
        : 'text-emerald-100 hover:bg-emerald-700/50'
    }`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <nav className="bg-emerald-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="text-xl font-bold tracking-tight">Дерево</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>Дерево</NavLink>
            <NavLink to="/people" className={linkClass}>Люди</NavLink>
            <NavLink to="/archive" className={linkClass}>Архів</NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-emerald-200 hover:text-white transition-colors"
          >
            Вийти
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
