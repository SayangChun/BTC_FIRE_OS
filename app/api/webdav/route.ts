import { NextRequest, NextResponse } from "next/server";

type WebDavCredentials = {
  url: string;
  username: string;
  password: string;
  path: string;
};

function buildAuthHeader(creds: WebDavCredentials): string {
  return `Basic ${btoa(`${creds.username}:${creds.password}`)}`;
}

function getRemoteUrl(creds: WebDavCredentials, filename?: string): string {
  const base = creds.url.endsWith("/") ? creds.url : `${creds.url}/`;
  const dir = creds.path.endsWith("/") ? creds.path : `${creds.path}/`;
  return filename ? `${base}${dir}${filename}` : `${base}${dir}`;
}

async function webdavFetch(
  creds: WebDavCredentials,
  method: string,
  url: string,
  body?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: buildAuthHeader(creds),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }
  return fetch(url, { method, headers, body });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, creds, filename, data } = body as {
      action: string;
      creds: WebDavCredentials;
      filename?: string;
      data?: unknown;
    };

    if (!creds?.url || !creds?.username || !creds?.password) {
      return NextResponse.json({ error: "Missing WebDAV credentials" }, { status: 400 });
    }

    switch (action) {
      case "ensureDir": {
        const dirUrl = getRemoteUrl(creds);
        const propfindRes = await webdavFetch(creds, "PROPFIND", dirUrl);
        if (propfindRes.status === 404) {
          const mkcolRes = await webdavFetch(creds, "MKCOL", dirUrl);
          if (!mkcolRes.ok && mkcolRes.status !== 405) {
            return NextResponse.json({ error: `MKCOL failed: ${mkcolRes.status}` }, { status: 502 });
          }
        }
        return NextResponse.json({ ok: true });
      }

      case "list": {
        const dirUrl = getRemoteUrl(creds);
        const res = await webdavFetch(creds, "PROPFIND", dirUrl);
        if (!res.ok) {
          return NextResponse.json({ entries: [] });
        }
        const text = await res.text();
        const hrefRegex = /<d:href>([^<]+)<\/d:href>/g;
        const lastmodRegex = /<d:lastmod>([^<]+)<\/d:lastmod>/g;
        const hrefs: string[] = [];
        const lastmods: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = hrefRegex.exec(text)) !== null) hrefs.push(match[1]);
        while ((match = lastmodRegex.exec(text)) !== null) lastmods.push(match[1]);
        const entries = hrefs
          .map((href, i) => ({
            basename: decodeURIComponent(href.split("/").pop() || ""),
            lastmod: lastmods[i] || "",
          }))
          .filter((e) => e.basename.startsWith("backup-") && e.basename.endsWith(".json"))
          .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());
        return NextResponse.json({ entries });
      }

      case "upload": {
        const uploadFilename = filename || `backup-${new Date().toISOString().split("T")[0]}.json`;
        await webdavFetch(creds, "PROPFIND", getRemoteUrl(creds));
        const fileUrl = getRemoteUrl(creds, uploadFilename);
        const res = await webdavFetch(creds, "PUT", fileUrl, JSON.stringify(data, null, 2));
        if (!res.ok) {
          return NextResponse.json({ error: `PUT failed: ${res.status}` }, { status: 502 });
        }
        return NextResponse.json({ ok: true, filename: uploadFilename });
      }

      case "download": {
        let targetUrl: string;
        if (filename) {
          targetUrl = getRemoteUrl(creds, filename);
        } else {
          const listRes = await webdavFetch(creds, "PROPFIND", getRemoteUrl(creds));
          if (!listRes.ok) {
            return NextResponse.json({ error: "No backups found" }, { status: 404 });
          }
          const text = await listRes.text();
          const hrefRegex = /<d:href>([^<]+)<\/d:href>/g;
          const lastmodRegex = /<d:lastmod>([^<]+)<\/d:lastmod>/g;
          const hrefs: string[] = [];
          const lastmods: string[] = [];
          let match: RegExpExecArray | null;
          while ((match = hrefRegex.exec(text)) !== null) hrefs.push(match[1]);
          while ((match = lastmodRegex.exec(text)) !== null) lastmods.push(match[1]);
          const backups = hrefs
            .map((href, i) => ({
              basename: decodeURIComponent(href.split("/").pop() || ""),
              href: hrefs[i],
              lastmod: lastmods[i] || "",
            }))
            .filter((e) => e.basename.startsWith("backup-") && e.basename.endsWith(".json"))
            .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());
          if (backups.length === 0) {
            return NextResponse.json({ error: "No backups found" }, { status: 404 });
          }
          targetUrl = getRemoteUrl(creds, backups[0].basename);
        }
        const res = await webdavFetch(creds, "GET", targetUrl);
        if (!res.ok) {
          return NextResponse.json({ error: `GET failed: ${res.status}` }, { status: 502 });
        }
        const content = await res.json();
        return NextResponse.json({ data: content });
      }

      case "delete": {
        if (!filename) {
          return NextResponse.json({ error: "filename required" }, { status: 400 });
        }
        const fileUrl = getRemoteUrl(creds, filename);
        const res = await webdavFetch(creds, "DELETE", fileUrl);
        if (!res.ok) {
          return NextResponse.json({ error: `DELETE failed: ${res.status}` }, { status: 502 });
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("WebDAV proxy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
