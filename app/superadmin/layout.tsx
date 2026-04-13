import React from "react";
import SuperAdminHeader from "@/components/ui/SuperAdminHeader";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* El Header maestro con toda la navegación */}
      <SuperAdminHeader />
      
      {/* El contenido de las páginas (las tablas, gráficas, etc) */}
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}