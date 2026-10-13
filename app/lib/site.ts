export const SITE_NAME = "Nepal Birdwatching Tours";

// TODO: set the real public URL (custom domain or https://<user>.github.io/<repo>).
export const SITE_URL = "https://example.github.io/nepalbirdwatchingtours";

/** URL for a file in `public/`, honouring the deploy base path (BASE_PATH). */
export function assetUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
