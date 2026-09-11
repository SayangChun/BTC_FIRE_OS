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

async function proxyRequest(action: string, extra?: Record<string, unknown>): Promise<unknown> {
  const config = getWebDavConfig();
  if (!config) throw new Error("WebDAV not configured");

  const res = await fetch("/api/webdav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, creds: config, ...extra }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Proxy request failed: ${res.status}`);
  }
  return json;
}

export async function ensureRemoteDirectory(): Promise<void> {
  await proxyRequest("ensureDir");
}

export async function uploadBackup(data: ExportData): Promise<string> {
  const result = (await proxyRequest("upload", { data })) as { filename: string };
  return result.filename;
}

interface BackupEntry {
  basename: string;
  lastmod: string;
}

export async function listBackups(): Promise<BackupEntry[]> {
  const result = (await proxyRequest("list")) as { entries: BackupEntry[] };
  return result.entries;
}

export async function downloadBackup(filename?: string): Promise<ExportData> {
  const result = (await proxyRequest("download", { filename })) as { data: ExportData };
  return result.data;
}

export async function deleteBackup(filename: string): Promise<void> {
  await proxyRequest("delete", { filename });
}
