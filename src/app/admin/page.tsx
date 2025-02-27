'use client';
import { useSession, signIn } from 'next-auth/react';

export default function AdminPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Falls der Nutzer nicht authentifiziert ist, starte den Login-Prozess
      signIn();
    },
  });

  if (status === 'loading') {
    return <p>Lade…</p>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin-Bereich</h1>
      <p>Willkommen, {session?.user?.name || 'Benutzer'}!</p>
      {/* Weitere geschützte Inhalte */}
    </main>
  );
}
