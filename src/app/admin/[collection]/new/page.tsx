// src/app/admin/[collection]/new/page.tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { getContentCollections } from '@/utils/getContentCollections';
import { useState } from 'react';
import { useFileCRUD } from '@/hooks/useFileCRUD';
import { FileWriteSchema, FileWriteInput } from '@/schemas/fileWriteSchema';
import { z } from 'zod';

export default function NewContentPage() {
  const { collection } = useParams();
  const router = useRouter();
  const collectionId = (collection as string)?.endsWith('s') ? (collection as string).slice(0, -1) : collection;
  const collections = getContentCollections();
  const contentCollection = collections.find((ct) => ct.id === collectionId);

  const { createOrUpdateFile, loading, error } = useFileCRUD();

  // Wir initialisieren formData mit allen Feldnamen aus der Collection
  const initialData: Record<string, string> = {};
  contentCollection?.fields.forEach((field) => {
    initialData[field.name] = '';
  });
  const [formData, setFormData] = useState<Record<string, string>>(initialData);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!contentCollection) {
    return <p>Collection "{collection}" nicht gefunden.</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Erweitere die formData um den Content-Typ (wird benötigt)
    const payload: FileWriteInput = {
      type: contentCollection.id,
      slug: formData['slug'] || '', // Erwartet ein Feld "slug"
      content: formData['content'] || '', // Erwartet ein Feld "content"
      ext: 'mdx',
      // Optional: branch und message können hier ergänzt werden
    };

    // Validierung mit Zod
    try {
      FileWriteSchema.parse(payload);
    } catch (err: any) {
      setValidationError(err.errors.map((e: any) => e.message).join(', '));
      return;
    }

    try {
      await createOrUpdateFile(payload);
      router.push(`/admin/${collection}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Neue {contentCollection.name} erstellen</h1>
      {validationError && <p className="text-red-500">{validationError}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        {contentCollection.fields.map((field) => (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className="block font-bold mb-1">
              {field.name} {field.required && '*'}
            </label>
            {field.type === 'text' || field.type === 'mdx' ? (
              <textarea id={field.name} name={field.name} onChange={handleChange} className="border p-2 w-full" placeholder={field.name} />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type="text"
                onChange={handleChange}
                className="border p-2 w-full"
                placeholder={field.name}
              />
            )}
          </div>
        ))}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white" disabled={loading}>
          {loading ? 'Speichern…' : 'Speichern'}
        </button>
      </form>
    </main>
  );
}
