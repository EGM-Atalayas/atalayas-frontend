import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
  
export function Landing() {
    const navigate = useNavigate();
    return (
        <div className="text-white flex flex-col items-center justify-center gap-y-4 min-h-screen">
      <img src="../src/assets/logo.webp" alt="Logo" className="h-24 w-auto" />
      <p className="text-8xl font-bold">Bienvenido</p>
      <p className="text-2xl font-bold mb-5">Elija su perfil de usuario</p>
      <Button onClick={() => navigate('/login')} className="bg-white">Iniciar sesión</Button>
    </div>
    )
}