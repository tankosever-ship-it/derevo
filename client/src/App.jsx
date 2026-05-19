import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Tree from './pages/Tree';
import People from './pages/People';
import PersonForm from './pages/PersonForm';
import PersonProfile from './pages/PersonProfile';
import Archive from './pages/Archive';

function PrivateRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuth } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Tree /></Layout></PrivateRoute>} />
      <Route path="/people" element={<PrivateRoute><Layout><People /></Layout></PrivateRoute>} />
      <Route path="/people/new" element={<PrivateRoute><Layout><PersonForm /></Layout></PrivateRoute>} />
      <Route path="/people/:id" element={<PrivateRoute><Layout><PersonProfile /></Layout></PrivateRoute>} />
      <Route path="/people/:id/edit" element={<PrivateRoute><Layout><PersonForm /></Layout></PrivateRoute>} />
      <Route path="/archive" element={<PrivateRoute><Layout><Archive /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
