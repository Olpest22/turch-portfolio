import C from './contacts.json';

/* Where leads can reach TURCH. Values live in contacts.json (also read by ops/threads/radar/score.py).
   whatsapp: digits with country code (79001234567); telegram / instagram / threads: username without @;
   max: full profile link from the MAX app. Empty = channel not shown. */
export type Channel = 'whatsapp' | 'telegram' | 'max' | 'instagram';
const digits = (s: string) => s.replace(/\D/g, '');

export const CH: Record<Channel, { label: string; handle: string; url: (text?: string) => string }> = {
  whatsapp: {
    label: 'WhatsApp',
    handle: C.whatsapp ? `+${digits(C.whatsapp)}` : '',
    url: (t) => `https://wa.me/${digits(C.whatsapp)}${t ? `?text=${encodeURIComponent(t)}` : ''}`,
  },
  telegram: {
    label: 'Telegram',
    handle: C.telegram ? `@${C.telegram.replace(/^@/, '')}` : '',
    url: (t) => `https://t.me/${C.telegram.replace(/^@/, '')}${t ? `?text=${encodeURIComponent(t)}` : ''}`,
  },
  max: { label: 'MAX', handle: C.max, url: () => C.max },
  instagram: {
    label: 'Instagram',
    handle: C.instagram ? `@${C.instagram.replace(/^@/, '')}` : '',
    url: () => `https://ig.me/m/${C.instagram.replace(/^@/, '')}`,
  },
};
/** Channels in order of preference for a Russian local business owner. */
export const CHANNELS = (['whatsapp', 'telegram', 'max', 'instagram'] as Channel[]).filter((c) => CH[c].handle);
export const isChannel = (c: string): c is Channel => (CHANNELS as string[]).includes(c);
export const THREADS = C.threads.replace(/^@/, '');

/** «в WhatsApp +7…, Telegram @…» for message texts; skips the channel the chat is already in. */
export function contactLine(except?: Channel) {
  const list = CHANNELS.filter((c) => c !== except).map((c) => `${CH[c].label} ${CH[c].handle}`.trim());
  return list.join(', ');
}
// kept for older imports
export const TG_HANDLE = CH.telegram.handle;
export const TG_URL = CH.telegram.url();
