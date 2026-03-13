import React, { useState } from 'react';
// Icono de usuario de React Icons
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // 1. Estados originales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // 2. NUEVO ESTADO: Para manejar mensajes de error (ej: contraseña incorrecta)
  const [errorMensaje, setErrorMensaje] = useState('');
  // 3. NUEVO ESTADO: Para saber si está cargando (para desactivar el botón)
  const [isLoading, setIsLoading] = useState(false);

  // --- LÓGICA DE CONEXIÓN AL SERVIDOR ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');
    setIsLoading(true);

    try {
      const response = await fetch('https://atalayas-backend.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password
        }),
      });

      // 2. Comprobamos si el servidor nos ha dejado pasar (Código 200)
      if (response.ok) {
        const data = await response.json();
        // Los tokens viajan en cookies HttpOnly (el navegador los gestiona solo)
        // Aquí solo guardamos los datos de display en memoria/contexto
        // Por ahora navegamos al dashboard pasando los datos del usuario
        navigate('/dashboard', {
          state: {
            nombre: data.nombre,
            codigoRol: data.codigoRol,
            nombreEmpresa: data.nombreEmpresa,
          }
        });
      } else {
        setErrorMensaje('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error conectando al servidor:', error);
      setErrorMensaje('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };
  // ----------------------------------------------

  return (
    <div className="bg-blue-950 min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-200 rounded-[2.5rem] p-12 w-full max-w-sm flex flex-col items-center gap-y-10 shadow-2xl">

        
        
        <div className="flex flex-col items-center gap-y-4">
          <FaUserCircle className="text-blue-950 text-6xl" />
          <h1 className="text-2xl font-bold text-blue-950">Iniciar Sesión</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-y-8">
          
          <div className="flex flex-col gap-y-2">
            <label className="font-bold text-sm text-slate-700" htmlFor="email">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-300 rounded-full px-6 py-3.5 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="font-bold text-sm text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-300 rounded-full px-6 py-3.5 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="flex items-center gap-x-2 mt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <label htmlFor="rememberMe" className="flex items-center gap-x-2 cursor-pointer font-bold text-sm text-slate-700">
              <span className="h-5 w-5 bg-slate-300 rounded-full border border-slate-400 flex items-center justify-center transition-colors peer-checked:bg-blue-600 peer-checked:border-blue-600">
                {rememberMe && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              Recordarme
            </label>
          </div>

          {errorMensaje && (
            <p className="text-red-600 font-semibold text-sm text-center">
              {errorMensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-950 text-white font-bold py-4 rounded-full w-full mt-4 hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;