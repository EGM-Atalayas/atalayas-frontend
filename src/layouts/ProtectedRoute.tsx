import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export function ProtectedRoute() {
  const { usuario, setUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // Si ya tenemos el usuario en memoria, no hace falta volver a preguntar
    if (usuario) {
      setVerificando(false);
      return;
    }

    // Preguntamos al backend si la cookie es válida
    fetch('https://atalayas-backend.onrender.com/api/v1/users/me', {
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('No autenticado');
      })
      .then((data) => {
        setUsuario({
          nombre: data.nombre,
          codigoRol: data.codigoRol,
          nombreEmpresa: data.nombreEmpresa,
          logoEmpresaUrl: data.logoEmpresaUrl,
        });
      })
      .catch(() => {
        setUsuario(null);
      })
      .finally(() => {
        setVerificando(false);
      });
  }, []);

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#100D3E] flex items-center justify-center">
        <p className="text-white text-xl">Verificando sesión...</p>
      </div>
    );
  }

  if(!usuario){
    return <Navigate to="/login" replace />;
  }

  return(
    <>
    <Header logoEmpresa={usuario.logoEmpresaUrl} />
    <main className='min-h-screen bg-slate-50'>
        <Outlet />
    </main>
    </>
  )
}