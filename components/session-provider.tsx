// components/session-provider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      {/* 🔥 Adicionamos refetchOnWindowFocus={false} acima para evitar bater na DB toda vez que volta pra aba */}
      {children}
    </NextAuthSessionProvider>
  );
}
