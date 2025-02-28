// src/app/admin/[collection]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { getContentCollections } from '@/utils/getContentCollections';

export default function CollectionListPage() {
  const { collection } = useParams();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      signIn();
    },
  });

  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Annahme: Unsere Routen nutzen den Plural, also "pages" → wir wandeln in Singular "page"
  const collectionId = (collection as string)?.endsWith('s') ? (collection as string).slice(0, -1) : collection;
  const collections = getContentCollections();
  const contentCollection = collections.find((ct) => ct.id === collectionId);

  useEffect(() => {
    async function fetchFiles() {
      setLoadingFiles(true);
      try {
        // Falls collectionId ein Array ist, den ersten Wert nehmen, ansonsten direkt nutzen.
        const typeValue = Array.isArray(collectionId) ? collectionId[0] : collectionId || '';
        const query = new URLSearchParams({ type: typeValue });
        const res = await fetch(`/api/files?${query.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Laden');
        }
        const data = await res.json();
        setFiles(data.files || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingFiles(false);
      }
    }

    if (collectionId) {
      fetchFiles();
    }
  }, [collectionId]);

  if (status === 'loading' || loadingFiles) {
    return <p>Lade …</p>;
  }
  if (!contentCollection) {
    return <p>Collection "{collection}" nicht gefunden.</p>;
  }

  return (
    <div className="flex">
      <aside className="min-h-screen py-6 px-2 bg-neutral-200 dark:bg-neutral-800">
        <nav>
          <ul className="space-y-2">
            {collections.map((col) => (
              <li key={col.id}>
                <Link className="bg-neutral-100 dark:bg-neutral-700 py-2 px-7 w-full inline-block" href={`/admin/${col.id}s`}>
                  {col.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-h-screen flex-1 bg-white dark:bg-neutral-700 py-6 px-8">
        <h1 className="text-2xl font-bold mb-4">{contentCollection.name} Übersicht</h1>
        <Link className="mb-4 inline-block px-4 py-2 bg-blue-500 text-white" href={`/admin/${collection}/new`}>
          Neue {contentCollection.name} erstellen
        </Link>
        {error && <p className="text-red-500">{error}</p>}
        <ul>
          {files.map((file) => (
            <li key={file.name} className="mb-2 border p-2 flex justify-between">
              <strong>{file.name.replace('.mdx', '')}</strong> – {file.path}
              <Link href={`/admin/${collection}/edit?slug=${file.name.split('.')[0]}`}>Bearbeiten</Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
