/** Personalisation from the link: ?brand=…&city=…&embed=1 (used by cold-outreach links). */
const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const clean = (v: string | null) => (v || '').replace(/\s+/g, ' ').trim().slice(0, 42);

export const param = (k: string) => clean(q.get(k));
export const brandOr = (fallback: string) => param('brand') || fallback;
export const cityOr = (fallback: string) => param('city') || fallback;
/** Rendered inside the portfolio's comparison window: no demo badge, no heavy media. */
export const EMBED = q.has('embed');
