// src/hooks/useFileCRUD.ts
import { useState } from 'react';
import { FileWriteInput } from '@/schemas/fileWriteSchema';

export function useFileCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrUpdateFile(data: FileWriteInput) {
    setLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }
      const result = await res.json();
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }

  async function readFile(params: { type: string; slug: string; ext?: string; branch?: string }) {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        type: params.type,
        slug: params.slug,
        ext: params.ext || 'mdx',
        branch: params.branch || '',
      });
      const res = await fetch(`/api/files?${query.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Laden');
      }
      const result = await res.json();
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }

  async function deleteFile(data: { type: string; slug: string; ext?: string; branch?: string; message?: string }) {
    setLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Löschen');
      }
      const result = await res.json();
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }

  return { loading, error, createOrUpdateFile, readFile, deleteFile };
}
