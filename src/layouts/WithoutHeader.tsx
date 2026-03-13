// layouts/WithoutHeader.tsx
import { Outlet } from "react-router-dom";

export default function WithoutHeader() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
}