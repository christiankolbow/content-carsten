// src/utils/getContentCollections.ts
import { cmsConfig } from '@/carsten.config';

/**
 * Erzeugt den Repository-Ordnerpfad für einen Content-Typ.
 * Beispiel: baseFolder = "content", type = "page" -> "content/pages"
 */
function getRepoFolder(contentTypeId: string, baseFolder: string): string {
  // Hier wird einfach ein "s" an den Content-Type angehängt.
  return `${baseFolder}/${contentTypeId}s`;
}

/**
 * Gibt ein Array aller Content Collections (Content-Typen) zurück,
 * wobei jeder Eintrag zusätzlich den abgeleiteten Repository-Ordner enthält.
 */
export function getContentCollections() {
  const { baseFolder, contentTypes } = cmsConfig;
  return contentTypes.map((ct) => ({
    ...ct,
    repoFolder: getRepoFolder(ct.id, baseFolder),
  }));
}
