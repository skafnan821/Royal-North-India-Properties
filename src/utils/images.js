// Turns what an owner typed into a usable image address.
// Returns '' for empty input, null for something that cannot be an image link.
export function normalizeImageUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (s.startsWith('/') || /^data:image\//i.test(s)) return s; // local files in /public or inline images
  const full = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s) ? `https://${s}` : s;
  try {
    const u = new URL(full);
    return /^https?:$/.test(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
