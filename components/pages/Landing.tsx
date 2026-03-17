// src/components/pages/Landing.tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import Image from "next/image";
import logo from "../../public/logo.webp";

export default function Landing() {
  const router = useRouter();

  return (
    <div className="text-white flex flex-col items-center justify-center gap-y-4 min-h-screen">
      <Image
        src={logo}
        alt="Logo"
        className="h-24 w-auto"
        loading="eager"
      />
      <p className="text-8xl font-bold">Bienvenido</p>
      <p className="text-2xl font-bold mb-5">Página de Formación de EGM Atalayas</p>
      <div className="flex gap-x-4">
        <Button onClick={() => router.push("/login")} className="bg-white">
          Iniciar sesión
        </Button>
        <Button onClick={() => router.push("/dashboard")} className="bg-white">
          Empresa
        </Button>
      </div>
    </div>
  );
}