"use client";

import { useAuth } from "@/context/AuthContext";
import AdminGeneral from "@/components/pages/AdminGeneral";
import AdminEmpresa from "@/components/pages/AdminEmpresa";
import Empleado from "@/components/pages/Empleado";

export default function DashboardPage() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  if (usuario.codigoRol === "ROLE_ADMIN")         return <AdminGeneral />;
  if (usuario.codigoRol === "ROLE_ADMIN_EMPRESA") return <AdminEmpresa />;
  if (usuario.codigoRol === "ROLE_EMPLEADO")      return <Empleado />;

  return null;
}