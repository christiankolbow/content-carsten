// app/api/files/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { cmsConfig } from '@/carsten.config';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// Umgebungsvariablen (sollten in .env.local gesetzt sein)
const owner = process.env.GITHUB_REPO_OWNER; // z.B. "your-github-user"
const repo = process.env.GITHUB_REPO_NAME; // z.B. "content-carsten-repo"
const defaultBranch = process.env.GITHUB_REPO_BRANCH || 'main';

// GitHub API-Client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Hilfsfunktion zur Ableitung des Repository-Ordners aus dem globalen Base-Path
 * und dem Content-Typ.
 * Beispiel: baseFolder = "content", type = "page" → "content/pages"
 */
function getRepoFolder(contentTypeId: string, baseFolder: string): string {
  return `${baseFolder}/${contentTypeId}s`;
}

/**
 * GET handler
 * - Wenn kein "slug" angegeben wird, listet er den Inhalt des entsprechenden Ordners.
 * - Bei Angabe eines "slug" wird der Inhalt der einzelnen Datei geladen.
 * In Development wird lokal mit fs gearbeitet, in Production via GitHub API.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const slug = searchParams.get('slug');
  const ext = searchParams.get('ext') || 'mdx';
  const branch = searchParams.get('branch') || defaultBranch;

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 });
  }

  const contentType = cmsConfig.contentTypes.find((ct) => ct.id === type);
  if (!contentType) {
    return NextResponse.json({ error: `Content type "${type}" not configured` }, { status: 400 });
  }
  const folder = getRepoFolder(contentType.id, cmsConfig.baseFolder);

  if (process.env.NODE_ENV === 'development') {
    // Lokaler Modus: Verwende das Dateisystem
    try {
      if (slug) {
        const localPath = path.resolve(process.cwd(), folder, `${slug}.${ext}`);
        const content = await fs.readFile(localPath, 'utf-8');
        return NextResponse.json({ filePath: localPath, content });
      } else {
        // Ordnerinhalt auflisten
        const localDir = path.resolve(process.cwd(), folder);
        const filenames = await fs.readdir(localDir);
        const files = await Promise.all(
          filenames.map(async (name) => {
            const filePath = path.join(localDir, name);
            try {
              const stats = await fs.stat(filePath);
              if (stats.isFile()) {
                return { name, path: filePath };
              }
            } catch {
              return null;
            }
          })
        );
        return NextResponse.json({ folder: localDir, files: files.filter(Boolean) });
      }
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Produktion: Verwende GitHub API
    if (!slug) {
      try {
        const { data } = await octokit.repos.getContent({
          owner: owner!,
          repo: repo!,
          path: folder,
          ref: branch,
        });
        if (Array.isArray(data)) {
          const files = data
            .filter((item) => item.type === 'file')
            .map((item) => ({
              name: item.name,
              path: item.path,
              sha: item.sha,
            }));
          return NextResponse.json({ folder, files });
        } else {
          return NextResponse.json({ error: 'Folder not found or not a directory' }, { status: 404 });
        }
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const filePath = `${folder}/${slug}.${ext}`;
      try {
        const { data } = await octokit.repos.getContent({
          owner: owner!,
          repo: repo!,
          path: filePath,
          ref: branch,
        });
        if (!Array.isArray(data) && data.type === 'file' && data.content) {
          const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
          return NextResponse.json({ filePath, content: decodedContent });
        } else {
          return NextResponse.json({ error: 'File not found or invalid type' }, { status: 404 });
        }
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }
}

/**
 * Zod-Schema zur Validierung der POST-Daten.
 * Erwartet:
 * - type: Content-Typ (z.B. "page", "blog")
 * - slug: Eindeutiger Identifier (z.B. "home")
 * - content: Der Dateiinhalts-String (z.B. Markdown/MDX)
 * - ext: Optionale Dateiendung (Default "mdx")
 * - branch: Optionaler Branch-Name (Default: defaultBranch)
 * - message: Optionale Commit-Message
 */
const FileWriteSchema = z.object({
  type: z.string(),
  slug: z.string(),
  content: z.string(),
  ext: z.string().optional().default('mdx'),
  branch: z.string().optional().default(defaultBranch),
  message: z.string().optional(),
});

/**
 * POST handler
 * - Validiert die Eingaben.
 * - Speichert die Datei entweder lokal (Development) oder via GitHub (Production).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = FileWriteSchema.parse(body);

    const contentType = cmsConfig.contentTypes.find((ct) => ct.id === parsed.type);
    if (!contentType) {
      return NextResponse.json({ error: `Content type "${parsed.type}" not configured` }, { status: 400 });
    }
    const folder = getRepoFolder(contentType.id, cmsConfig.baseFolder);
    const filePath = `${folder}/${parsed.slug}.${parsed.ext}`;
    const commitMessage = parsed.message || `Update ${parsed.slug}`;

    if (process.env.NODE_ENV === 'development') {
      // Lokaler Modus: Schreibe die Datei ins lokale Dateisystem
      const localDir = path.resolve(process.cwd(), folder);
      await fs.mkdir(localDir, { recursive: true });
      const localPath = path.resolve(localDir, `${parsed.slug}.${parsed.ext}`);
      await fs.writeFile(localPath, parsed.content, 'utf-8');
      return NextResponse.json({ success: true, filePath: localPath, commit: null });
    } else {
      // Produktion: Nutze GitHub API zum Erstellen/Aktualisieren
      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner: owner!,
          repo: repo!,
          path: filePath,
          ref: parsed.branch,
        });
        if (!Array.isArray(data) && data.type === 'file') {
          sha = data.sha;
        }
      } catch (error) {
        // Datei existiert nicht, also wird sie erstellt
      }
      const encodedContent = Buffer.from(parsed.content).toString('base64');
      const response = await octokit.repos.createOrUpdateFileContents({
        owner: owner!,
        repo: repo!,
        path: filePath,
        message: commitMessage,
        content: encodedContent,
        branch: parsed.branch,
        sha,
      });
      return NextResponse.json({
        success: true,
        filePath,
        commit: response.data.commit,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE handler
 * - Löscht eine Datei entweder lokal (Development) oder via GitHub (Production).
 */
const FileDeleteSchema = z.object({
  type: z.string(),
  slug: z.string(),
  ext: z.string().optional().default('mdx'),
  branch: z.string().optional().default(defaultBranch),
  message: z.string().optional().default('Delete file'),
});

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = FileDeleteSchema.parse(body);

    const contentType = cmsConfig.contentTypes.find((ct) => ct.id === parsed.type);
    if (!contentType) {
      return NextResponse.json({ error: `Content type "${parsed.type}" not configured` }, { status: 400 });
    }
    const folder = getRepoFolder(contentType.id, cmsConfig.baseFolder);
    const filePath = `${folder}/${parsed.slug}.${parsed.ext}`;

    if (process.env.NODE_ENV === 'development') {
      // Lokaler Modus: Datei lokal löschen
      const localPath = path.resolve(process.cwd(), filePath);
      await fs.unlink(localPath);
      return NextResponse.json({ success: true, filePath: localPath });
    } else {
      // Produktion: Datei über GitHub API löschen
      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner: owner!,
          repo: repo!,
          path: filePath,
          ref: parsed.branch,
        });
        if (!Array.isArray(data) && data.type === 'file') {
          sha = data.sha;
        }
      } catch (error) {
        // Datei existiert nicht
      }
      if (!sha) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const response = await octokit.repos.deleteFile({
        owner: owner!,
        repo: repo!,
        path: filePath,
        message: parsed.message,
        branch: parsed.branch,
        sha,
      });
      return NextResponse.json({ success: true, filePath, commit: response.data.commit });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
