import SuperAdminRoute from "@/components/auth/SuperAdminRoute";
import SuperAdminSidebar from "@/components/ui/SuperAdminSidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminRoute>
      <div className="flex min-h-screen bg-[#F7F6F3]">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SuperAdminRoute>
  );
}