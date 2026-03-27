// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import AdminGeneral from "@/components/pages/AdminGeneral";
import AdminEmpresa from "@/components/pages/AdminEmpresa";
import Empleado from "@/components/pages/Empleado";
import Invitado from "@/components/pages/Invitado";

export default function DashboardPage() {
  const { usuario } = useAuth();

  if (!usuario) return null; // todavía cargando sesión

  if (usuario.codigoRol === "ROLE_ADMIN") return <AdminGeneral />;
  if (usuario.codigoRol === "ROLE_ADMIN_EMPRESA") return <AdminEmpresa />;
  if (usuario.codigoRol === "ROLE_EMPLEADO")      return <Empleado logoEmpresaUrl={usuario.logoEmpresaUrl} nombreEmpresa={usuario.nombreEmpresa} usuario={usuario} />;
  if (usuario.codigoRol === "INVITADO")      return <Invitado />;

  return null;
}