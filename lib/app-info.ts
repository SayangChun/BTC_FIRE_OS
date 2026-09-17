/**
 * Build-time app metadata.
 *
 * APP_VERSION is injected by `env` in next.config.ts, which reads package.json —
 * so the footer badge, the git tag and CHANGELOG.md can never drift apart.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

export const REPOSITORY_URL = "https://github.com/SayangChun/BTC_FIRE_OS";
export const CHANGELOG_URL = `${REPOSITORY_URL}/blob/main/CHANGELOG.md`;
export const RELEASES_URL = `${REPOSITORY_URL}/releases`;

/** Release page for a specific version (tags are always named vX.Y.Z). */
export function releaseUrl(version: string): string {
  return `${RELEASES_URL}/tag/v${version}`;
}
