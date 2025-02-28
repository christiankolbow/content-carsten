'use client';
import { getContentCollections } from '@/utils/getContentCollections';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

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

  const contentCollections = getContentCollections();

  return (
    <div className="flex">
      <aside className="min-h-screen py-6 px-2 bg-neutral-200 dark:bg-neutral-800">
        <nav>
          <ul className="space-y-2">
            {contentCollections.map((collection) => (
              <li key={collection.id}>
                <Link className="bg-neutral-100 dark:bg-neutral-700 py-2 px-7 w-full inline-block" href={`/admin/${collection.id}`}>
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-h-screen flex-1 bg-white dark:bg-neutral-700 py-6 px-8">
        <div className="grid grid-cols-4 gap-6">
          {contentCollections.map((collection) => (
            <div
              className="p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-800"
              key={collection.id}>
              <h2 className="font-bold text-2xl">{collection.name}</h2>
              <Link href={`/admin/${collection.id}/new`}>New</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
