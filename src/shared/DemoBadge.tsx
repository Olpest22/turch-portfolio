import { BASE } from '@/lib/base';
import { CH, CHANNELS } from '@/lib/contact';
import { PITCH, PRICE_K } from './brand';
/** Floating label that marks a demo site and links back to the TURCH portfolio.
    On a pitch page it says whose first screen this is and opens a chat with TURCH instead. */
export function DemoBadge({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const dark = tone === 'dark';
  const ch = CHANNELS[0];
  const href = PITCH && ch ? CH[ch].url(`Здравствуйте! Посмотрел первый экран для «${PITCH.brand}».`) : `${BASE}#examples`;
  return (
    <a
      href={href}
      target={PITCH ? '_blank' : undefined}
      rel={PITCH ? 'noopener' : undefined}
      className="ui-press ui-focus fixed bottom-4 left-4 z-[80] inline-flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium no-underline shadow-lg"
      style={{
        background: dark ? 'rgb(10 9 8 / 0.94)' : 'rgb(255 255 255 / 0.97)',
        color: dark ? '#ede9e3' : '#0d0c0b',
        boxShadow: dark ? '0 0 0 1px rgb(255 107 26 / 0.45), 0 10px 30px -10px rgb(0 0 0 / 0.6)' : '0 0 0 1px rgb(0 0 0 / 0.1), 0 10px 30px -12px rgb(0 0 0 / 0.35)',
        fontFamily: "'Onest', system-ui, sans-serif",
      }}
    >
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: '#ff6b1a', display: 'inline-block', flex: 'none' }} />
      <span className="truncate">{PITCH ? `Первый экран для «${PITCH.brand}» · TURCH` : 'Демо-сайт · сделано в TURCH'}</span>
    </a>
  );
}

/** Lead form state: honest about being a demo (nothing is sent). */
export type LeadState = 'idle' | 'pending' | 'done' | 'error';

export function fakeSubmit(phone: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (phone.replace(/\D/g, '').length >= 10 ? resolve() : reject(new Error('phone'))), 700);
  });
}

export function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  const x = d.startsWith('7') ? d.slice(1) : d;
  let out = '+7';
  if (x.length) out += ' (' + x.slice(0, 3);
  if (x.length >= 3) out += ') ' + x.slice(3, 6);
  if (x.length >= 6) out += '-' + x.slice(6, 8);
  if (x.length >= 8) out += '-' + x.slice(8, 10);
  return out;
}

/** Money as shown on the demos; on a pitch page scaled to the lead's price level (pitch.json priceK). */
export const rub = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n * PRICE_K)) + ' ₽';
