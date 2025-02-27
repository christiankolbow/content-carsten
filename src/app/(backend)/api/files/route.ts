// app/api/files/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { cmsConfig } from '@/carsten.config';

// Diese Werte sollten in deinen Umgebungsvariablen gesetzt sein:
const owner = process.env.GITHUB_REPO_OWNER; // z. B. "mein-github-nutzer"
const repo = process.env.GITHUB_REPO_NAME; // z. B. "content-carsten-repo"
const branch = process.env.GITHUB_REPO_BRANCH || 'main';

// Octokit initialisieren
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Ableitung des Ordnerpfads aus dem Base-Path und dem Content-Typ.
 * Beispiel: baseFolder = "content", type = "page" -> "content/pages"
 */
function getRepoFolder(contentTypeId: string, baseFolder: string): string {
  // Eine einfache Pluralisierung: Hänge einfach ein "s" an.
  // Für komplexere Fälle könnte man eine Bibliothek wie "pluralize" nutzen.
  return `${baseFolder}/${contentTypeId}s`;
}

export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url);
  const type = searchParams.get('type');
  const slug = searchParams.get('slug');
  const ext = searchParams.get('ext') || 'md'; // Dateiendung optional, Standard: md

  if (!type || !slug) {
    return NextResponse.json({ error: 'Missing type or slug' }, { status: 400 });
  }

  // Finde den Content-Typ in der Konfiguration
  const contentType = cmsConfig.contentTypes.find((ct) => ct.id === type);
  if (!contentType) {
    return NextResponse.json({ error: `Content type "${type}" not configured` }, { status: 400 });
  }

  // Ableiten des Ordnerpfads automatisch aus dem Base-Path und dem Content-Typ
  const folder = getRepoFolder(contentType.id, cmsConfig.baseFolder);
  // Beispiel: "content/pages/<slug>.md" oder "content/blogs/<slug>.md"
  const filePath = `${folder}/${slug}.${ext}`;

  try {
    const { data } = await octokit.repos.getContent({
      owner: owner!,
      repo: repo!,
      path: filePath,
      ref: branch,
    });

    // Falls es sich um eine Datei handelt (Blob)
    if (!Array.isArray(data) && data.type === 'file' && data.content) {
      const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
      return NextResponse.json({ filePath, content: decodedContent });
    } else {
      return NextResponse.json({ error: 'Datei nicht gefunden oder ungültiger Typ' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
