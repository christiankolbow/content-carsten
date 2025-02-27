// src/app/(protected)/layout.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
