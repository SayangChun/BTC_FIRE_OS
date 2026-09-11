import type { ExportData } from "./types";

const STORAGE_KEYS = {
  url: "btc-fire-os:webdav:url",
  username: "btc-fire-os:webdav:username",
  password: "btc-fire-os:webdav:password",
  path: "btc-fire-os:webdav:path",
} as const;

export type WebDavConfig = {
  url: string;
  username: string;
  password: string;
  path: string;
};

export function getWebDavConfig(): WebDavConfig | null {
  if (typeof window === "undefined") return null;

  const url = localStorage.getItem(STORAGE_KEYS.url);
  const username = localStorage.getItem(STORAGE_KEYS.username);
  const password = localStorage.getItem(STORAGE_KEYS.password);
  const path = localStorage.getItem(STORAGE_KEYS.path) || "/btc-fire-os/";

  if (!url || !username || !password) return null;

  return { url, username, password: atob(password), path };
}

export function isWebDavConfigured(): boolean {
  return getWebDavConfig() !== null;
}

export function saveWebDavConfig(config: Omit<WebDavConfig, "password"> & { password: string }): void {
  localStorage.setItem(STORAGE_KEYS.url, config.url);
  localStorage.setItem(STORAGE_KEYS.username, config.username);
  localStorage.setItem(STORAGE_KEYS.password, btoa(config.password));
  localStorage.setItem(STORAGE_KEYS.path, config.path);
}

export function clearWebDavConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.url);
  localStorage.removeItem(STORAGE_KEYS.username);
  localStorage.removeItem(STORAGE_KEYS.password);
  localStorage.removeItem(STORAGE_KEYS.path);
}

function buildAuthHeader(config: WebDavConfig): string {
  const token = btoa(`${config.username}:${config.password}`);
  return `Basic ${token}`;
}

function getRemoteUrl(config: WebDavConfig, filename?: string): string {
  const base = config.url.endsWith("/") ? config.url : `${config.url}/`;
  const dir = config.path.endsWith("/") ? config.path : `${config.path}/`;
  return filename ? `${base}${dir}${filename}` : `${base}${dir}`;
}

async function webdavRequest(
  config: WebDavConfig,
  method: string,
  url: string,
  body?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: buildAuthHeader(config),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  return fetch(url, {
    method,
    headers,
    body,
    mode: "cors",
  });
}

export async function ensureRemoteDirectory(): Promise<void> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  const dirUrl = getRemoteUrl(config);
  try {
    const res = await webdavRequest(config, "PROPFIND", dirUrl);
    if (res.status === 404) {
      const mkRes = await webdavRequest(config, "MKCOL", dirUrl);
      if (!mkRes.ok && mkRes.status !== 405) {
        throw new Error(`Failed to create directory: ${mkRes.status}`);
      }
    }
  } catch (e) {
    const mkRes = await webdavRequest(config, "MKCOL", dirUrl);
    if (!mkRes.ok && mkRes.status !== 405) {
      throw new Error(`Failed to create directory: ${mkRes.status}`);
    }
  }
}

export async function uploadBackup(data: ExportData): Promise<string> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  const filename = `backup-${new Date().toISOString().split("T")[0]}.json`;
  const fileUrl = getRemoteUrl(config, filename);

  await ensureRemoteDirectory();

  const res = await webdavRequest(config, "PUT", fileUrl, JSON.stringify(data, null, 2));
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return filename;
}

interface WebDavFileEntry {
  basename: string;
  filename: string;
  lastmod: string;
}

export async function listBackups(): Promise<WebDavFileEntry[]> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  const dirUrl = getRemoteUrl(config);
  const res = await webdavRequest(config, "PROPFIND", dirUrl);
  if (!res.ok) return [];

  const text = await res.text();
  const entries: WebDavFileEntry[] = [];

  const hrefRegex = /<d:href>([^<]+)<\/d:href>/g;
  const lastmodRegex = /<d:lastmod>([^<]+)<\/d:lastmod>/g;

  const hrefs: string[] = [];
  const lastmods: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(text)) !== null) {
    hrefs.push(match[1]);
  }
  while ((match = lastmodRegex.exec(text)) !== null) {
    lastmods.push(match[1]);
  }

  for (let i = 0; i < hrefs.length; i++) {
    const basename = decodeURIComponent(hrefs[i].split("/").pop() || "");
    if (basename.startsWith("backup-") && basename.endsWith(".json")) {
      entries.push({
        basename,
        filename: hrefs[i],
        lastmod: lastmods[i] || "",
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime(),
  );
}

export async function downloadBackup(filename?: string): Promise<ExportData> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  let fileUrl: string;
  if (filename) {
    fileUrl = getRemoteUrl(config, filename);
  } else {
    const backups = await listBackups();
    if (backups.length === 0) {
      throw new Error("No backups found");
    }
    fileUrl = backups[0].filename.startsWith("http")
      ? backups[0].filename
      : getRemoteUrl(config, backups[0].basename);
  }

  const res = await webdavRequest(config, "GET", fileUrl);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }

  const content = await res.text();
  return JSON.parse(content);
}

export async function deleteBackup(filename: string): Promise<void> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  const fileUrl = getRemoteUrl(config, filename);
  const res = await webdavRequest(config, "DELETE", fileUrl);
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
  }
}
