import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard.tsx';
import WithoutHeader from './layouts/WithoutHeader.tsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route element={<WithoutHeader />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Rutas protegidas — cualquier ruta bajo aquí requiere sesión */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;