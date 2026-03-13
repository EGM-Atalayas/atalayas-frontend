import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (

    <div className=" text-black flex flex-col items-center justify-center gap-6 py-20">
      <h1 className="text-4xl font-bold">Panel principal</h1>
      <p className="text-xl">Bienvenido, {usuario?.nombre}</p>
      <p className="text-slate-400">Rol: {usuario?.codigoRol}</p>
      {usuario?.nombreEmpresa && (
        <p className="text-slate-400">Empresa: {usuario.nombreEmpresa}</p>
      )}
      <button
        onClick={handleLogout}
        className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
}