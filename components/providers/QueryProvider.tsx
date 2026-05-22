"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export let queryClient: QueryClient;

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime:    10 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      });
      queryClient = qc;
      return qc;
    }
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
