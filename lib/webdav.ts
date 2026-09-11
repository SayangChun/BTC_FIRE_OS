import { createClient, type WebDAVClient, type FileStat } from "webdav";
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

function getClient(): WebDAVClient {
  const config = getWebDavConfig();
  if (!config) {
    throw new Error("WebDAV not configured");
  }

  return createClient(config.url, {
    username: config.username,
    password: config.password,
  });
}

function getRemotePath(filename: string): string {
  const config = getWebDavConfig()!;
  const path = config.path.endsWith("/") ? config.path : `${config.path}/`;
  return `${path}${filename}`;
}

export async function ensureRemoteDirectory(): Promise<void> {
  const client = getClient();
  const config = getWebDavConfig()!;
  const path = config.path.endsWith("/") ? config.path : `${config.path}/`;

  try {
    await client.getDirectoryContents(path);
  } catch {
    await client.createDirectory(path);
  }
}

export async function uploadBackup(data: ExportData): Promise<string> {
  const client = getClient();
  const filename = `backup-${new Date().toISOString().split("T")[0]}.json`;
  const remotePath = getRemotePath(filename);

  await ensureRemoteDirectory();
  await client.putFileContents(remotePath, JSON.stringify(data, null, 2), {
    overwrite: true,
  });

  return filename;
}

export async function listBackups(): Promise<FileStat[]> {
  const client = getClient();
  const config = getWebDavConfig()!;
  const path = config.path.endsWith("/") ? config.path : `${config.path}/`;

  try {
    const contents = await client.getDirectoryContents(path);
    return contents
      .filter((f) => f.basename.startsWith("backup-") && f.basename.endsWith(".json"))
      .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());
  } catch {
    return [];
  }
}

export async function downloadBackup(filename?: string): Promise<ExportData> {
  const client = getClient();

  let targetFile: string;
  if (filename) {
    targetFile = getRemotePath(filename);
  } else {
    const backups = await listBackups();
    if (backups.length === 0) {
      throw new Error("No backups found");
    }
    targetFile = backups[0].filename;
  }

  const content = await client.getFileContents(targetFile, { format: "text" });
  return JSON.parse(content as string);
}

export async function deleteBackup(filename: string): Promise<void> {
  const client = getClient();
  const remotePath = getRemotePath(filename);
  await client.deleteFile(remotePath);
}
