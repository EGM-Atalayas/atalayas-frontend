"use client";

import dynamic from "next/dynamic";

const IncidenciasAdminTab = dynamic(
  () => import("@/components/incidencias/IncidenciasAdminTab"),
  { ssr: false }
);

interface Props {
  esSuperadmin?: boolean;
}

export default function GestionIncidencias({ esSuperadmin }: Props) {
  return <IncidenciasAdminTab esSuperadmin={esSuperadmin} />;
}
