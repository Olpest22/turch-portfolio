import { BASE } from '@/lib/base';

/* Personalisation of the demo sites.
   1. From the link: ?brand=…&city=…&embed=1 (cold-outreach links).
   2. From a pitch page /p/<slug>/: the build injects window.__PITCH__ from pitches/<slug>/pitch.json
      (the lead's own name, phone, colour, logo, photos and price level). See pitches/README.md. */
export type Pitch = {
  slug: string;
  demo: string;
  brand: string;
  city?: string;
  phone?: string;
  /** brand colour, replaces the demo's accent */
  accent?: string;
  /** file in pitches/<slug>/ */
  logo?: string;
  /** demo image name (as in IMG('hero')) → file in pitches/<slug>/ */
  images?: Record<string, string>;
  /** all shown prices are multiplied by this (their prices vs the demo's) */
  priceK?: number;
};
export const PITCH: Pitch | undefined = typeof window !== 'undefined' ? (window as unknown as { __PITCH__?: Pitch }).__PITCH__ : undefined;
const pitchFile = (f: string) => `${BASE}p/${PITCH!.slug}/${f}`;

const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const clean = (v: string | null | undefined) => (v || '').replace(/\s+/g, ' ').trim().slice(0, 42);

export const param = (k: string) => clean(q.get(k));
export const brandOr = (fallback: string) => clean(PITCH?.brand) || param('brand') || fallback;
export const cityOr = (fallback: string) => clean(PITCH?.city) || param('city') || fallback;
export const phoneOr = (fallback: string) => PITCH?.phone || fallback;
/** tel: link for a displayed phone */
export const telOf = (phone: string) => {
  let d = phone.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return `tel:+${d}`;
};
/** The lead's logo, or '' to keep the demo's own mark. */
export const LOGO = PITCH?.logo ? pitchFile(PITCH.logo) : '';
export const PRICE_K = PITCH?.priceK && PITCH.priceK > 0 ? PITCH.priceK : 1;
/** Demo image by name, replaced by the lead's photo when the pitch maps one. */
export const imgOr = (name: string, fallback: string) => (PITCH?.images?.[name] ? pitchFile(PITCH.images[name]) : fallback);
/** Rendered inside the portfolio's comparison window: no demo badge, no heavy media. */
export const EMBED = q.has('embed');

/* the lead's brand colour replaces each demo's accent (both the raw token and Tailwind's --color-* copy) */
const ACCENT_VARS: Record<string, string[]> = {
  remont: ['--cream', '--color-cream'],
  mebel: ['--walnut', '--color-walnut'],
  kuhni: ['--olive', '--color-olive', '--olive-2'],
  vyveski: ['--pink', '--color-pink'],
  kuzov: ['--y', '--color-y'],
  tipografiya: ['--m', '--color-m'],
};
if (PITCH?.accent && typeof document !== 'undefined') {
  for (const v of ACCENT_VARS[PITCH.demo] ?? []) document.documentElement.style.setProperty(v, PITCH.accent);
}
