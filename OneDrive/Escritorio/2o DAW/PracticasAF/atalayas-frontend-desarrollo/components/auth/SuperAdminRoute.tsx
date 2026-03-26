"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const SUPERADMIN_ROL = "SUPERADMIN"; // ← cambia esto cuando sepas el codigoRol exacto

// src/components/auth/SuperAdminRoute.tsx — temporal para ver el diseño
export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // ← sin protección, solo para probar
}


// export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
//   const { usuario } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!usuario) {
//       router.replace("/login");
//       return;
//     }
//     if (usuario.codigoRol !== SUPERADMIN_ROL) {
//       router.replace("/dashboard");
//     }
//   }, [usuario]);

//   if (!usuario || usuario.codigoRol !== SUPERADMIN_ROL) return null;

//   return <>{children}</>;
// }

// Ctrl + K, luego Ctrl + C → Comentar
// Ctrl + K, luego Ctrl + U → Descomentar
