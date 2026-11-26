import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import '@/shared/kit/interaction-kit.js';

/* Private helper for outreach: builds a personalised portfolio link and a first message. */
const NICHES: [string, string][] = [
  ['remont', 'Ремонт квартир'],
  ['doma', 'Строительство домов'],
  ['potolki', 'Натяжные потолки'],
  ['kuhni', 'Кухни на заказ'],
  ['mebel', 'Мебель на заказ'],
];

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-a ui-press ui-focus"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const t = document.createElement('textarea');
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          t.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? 'Скопировано ✓' : label}
    </button>
  );
}

function App() {
  const [n, setN] = useState('potolki');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const link = useMemo(() => {
    const p = new URLSearchParams({ n });
    if (name.trim()) p.set('name', name.trim());
    if (city.trim()) p.set('city', city.trim());
    return `${window.location.origin}/?${p.toString()}`;
  }, [n, name, city]);
  const msg = `Здравствуйте! Нашёл ${name.trim() ? `«${name.trim()}»` : 'вашу компанию'} на Яндекс Картах и заметил, что у вас нет сайта. Показал, каким он мог бы быть — там уже ваше название: ${link}\n\nЕсли интересно, за 24 часа бесплатно сделаю первый экран сайта под вас.`;
  const field = 'w-full h-[52px] rounded-[12px] px-4 text-[16px] bg-[var(--bg-2)] text-[var(--tx)] outline-none';
  return (
    <main className="wrap max-w-[760px] py-12">
      <div className="font-display text-[19px] font-extrabold tracking-[0.1em]">TURCH</div>
      <h1 className="h2 m-0 mt-8">Ссылка для лида</h1>
      <p className="lead mt-3">Лид откроет главную, где уже будут его название, город и пример сайта его ниши.</p>
      <div className="mt-8 grid gap-4">
        <label className="grid gap-2 text-[15px] text-tx-2">
          Ниша
          <select className={field} style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} value={n} onChange={(e) => setN(e.target.value)}>
            {NICHES.map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-[15px] text-tx-2">
          Название компании
          <input className={field} style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} value={name} maxLength={42} placeholder="Потолки Люкс" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="grid gap-2 text-[15px] text-tx-2">
          Город
          <input className={field} style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} value={city} maxLength={42} placeholder="Барнаул" onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <div className="mt-8 rounded-[16px] bg-[var(--bg-2)] p-5" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
        <div className="text-[14px] text-tx-3">Ссылка</div>
        <div className="mt-2 text-[15px] [overflow-wrap:anywhere]">{link}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Copy text={link} label="Скопировать ссылку" />
          <a className="btn btn-b ui-press ui-press--on-dark ui-focus" href={link} target="_blank" rel="noopener">Открыть как лид ↗</a>
        </div>
      </div>
      <div className="mt-5 rounded-[16px] bg-[var(--bg-2)] p-5" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
        <div className="text-[14px] text-tx-3">Первое сообщение</div>
        <p className="mb-0 mt-2 whitespace-pre-wrap text-[15px] leading-relaxed [overflow-wrap:anywhere]">{msg}</p>
        <div className="mt-4">
          <Copy text={msg} label="Скопировать сообщение" />
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
(window as unknown as { BetterUI?: { init: (d: Document) => void } }).BetterUI?.init(document);
