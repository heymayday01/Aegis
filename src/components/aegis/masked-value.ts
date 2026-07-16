/**
 * Mask the middle of a sensitive value for safe display in chips / lists.
 *   - emails keep the local-part prefix + domain, e.g. `john@acme.com` → `j•••@acme.com`
 *   - everything else keeps first char + last char (or last 4 for short values)
 *
 * Pure + side-effect free so it can be used in render without re-renders biting.
 */
export function maskValue(raw: string): string {
  if (!raw) return '';
  const v = String(raw);
  if (v.length <= 2) return v[0] + '•';
  if (v.length <= 5) return v[0] + '•'.repeat(v.length - 2) + v[v.length - 1];

  // Email: keep first char of local part + the full domain.
  const atIdx = v.indexOf('@');
  if (atIdx > 1 && atIdx < v.length - 3) {
    const local = v.slice(0, atIdx);
    const domain = v.slice(atIdx);
    const localMasked = local.length <= 1 ? local + '•••' : local[0] + '•'.repeat(Math.max(3, local.length - 1));
    return `${localMasked}${domain}`;
  }

  // Long secrets / tokens: keep first 4 + last 4.
  if (v.length > 16) {
    return `${v.slice(0, 4)}${'•'.repeat(6)}${v.slice(-4)}`;
  }

  // Default: first + masked middle + last.
  return v[0] + '•'.repeat(v.length - 2) + v[v.length - 1];
}

/** Truncate a hash for compact display: `0a1b2c3d…f0e1d2c3`. */
export function truncateHash(hash: string, head = 12, tail = 8): string {
  if (!hash) return '';
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
