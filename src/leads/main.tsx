import { StrictMode, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import '@/shared/kit/interaction-kit.js';
import { NICHES } from '@/lib/niches';
import { CopyBtn, copyText } from './ui';
import Radar, { freshCount, useRadar } from './Radar';
import { forgetKey, open as openBlob, recallKey, rememberKey, seal, unlock } from './vault';
import {
  SOURCES, STEP_LABEL, WAIT, fmtPhone, leadLink, message, normPhone, objections, tgUrl, waUrl, type Source,
} from '@/lib/outreach';

/* Private outreach tracker. Data lives only in this browser (localStorage); export a CSV to back it up
   or move to another device. Messages are sent by hand: this page only prepares them. */

type Via = 'whatsapp' | 'telegram' | 'instagram';
const VIA_LABEL: Record<Via, string> = { whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram' };
const igHandle = (s = '') => s.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
const igUrl = (s?: string) => (igHandle(s) && /^[a-z0-9._]{2,30}$/i.test(igHandle(s)) ? `https://ig.me/m/${igHandle(s)}` : '');
type Status = 'todo' | 'sent' | 'reply' | 'deal' | 'no';
type Lead = {
  id: string;
  niche: string;
  name: string;
  city: string;
  phone: string;
  tg: string;
  /** Instagram username, if the lead has one */
  ig?: string;
  /** messenger the last message went to */
  via?: Via;
  card: string;
  source: Source;
  note: string;
  status: Status;
  /** how many of the 3 messages were sent */
  step: number;
  lastAt: number;
  created: number;
  log: { t: number; s: string }[];
};

const PLAIN_KEY = 'turch-leads-v1'; // before the password: migrated on first unlock, then removed
const KEY = 'turch-leads-v2'; // AES-GCM, see vault.ts
const GOAL_KEY = 'turch-leads-goal';
const DAY = 86_400_000;
const STATUS: Record<Status, string> = { todo: 'Новый', sent: 'Ждём ответа', reply: 'Ответил', deal: 'Сделка', no: 'Отказ' };
const STATUS_TONE: Record<Status, string> = {
  todo: 'bg-[rgb(244_241_234/0.08)] text-tx-2',
  sent: 'bg-[rgb(120_160_255/0.14)] text-[#b9caff]',
  reply: 'bg-[rgb(255_107_26/0.16)] text-[#ffb48a]',
  deal: 'bg-[rgb(80_200_120/0.16)] text-[#9be3b4]',
  no: 'bg-[rgb(244_241_234/0.05)] text-tx-3',
};

const parseLeads = (json: string): Lead[] => {
  const v = JSON.parse(json || '[]');
  return Array.isArray(v) ? v : [];
};
const lsGet = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};

/** Decrypts the base; moves the old unencrypted v1 list in on first unlock. */
async function loadVault(key: CryptoKey): Promise<{ leads: Lead[]; notice: string }> {
  const blob = lsGet(KEY);
  let leads: Lead[] = [];
  let notice = '';
  if (blob) {
    try {
      leads = parseLeads(await openBlob(key, blob));
    } catch {
      // saved under an older password: keep it aside instead of overwriting
      try { localStorage.setItem(`${KEY}-old-${Date.now()}`, blob); localStorage.removeItem(KEY); } catch { /* nothing else to do */ }
      notice = 'Сохранённый список был зашифрован старым паролем и не открылся. Загрузите последний CSV.';
    }
  }
  const plain = lsGet(PLAIN_KEY);
  if (plain) {
    try {
      const old = parseLeads(plain);
      const ids = new Set(leads.map((l) => l.id));
      leads = [...leads, ...old.filter((l) => !ids.has(l.id))];
      localStorage.setItem(KEY, await seal(key, JSON.stringify(leads)));
      localStorage.removeItem(PLAIN_KEY);
    } catch { /* leave v1 in place, try again next time */ }
  }
  return { leads, notice };
}
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const startOfDay = (t = Date.now()) => new Date(t).setHours(0, 0, 0, 0);
const sourceFromUrl = (u: string): Source | '' => (/2gis/i.test(u) ? '2gis' : /yandex|ya\.ru/i.test(u) ? 'yandex' : '');

/** When the next message is due (ms), or null when nothing is left to send. */
function dueAt(l: Lead): number | null {
  if (l.status === 'reply' || l.status === 'deal' || l.status === 'no') return null;
  if (l.step === 0) return l.created;
  if (l.step >= 3) return null;
  return startOfDay(l.lastAt) + WAIT[l.step - 1] * DAY;
}
function nextLabel(l: Lead): string {
  if (l.status === 'reply') return 'Ответил: ответьте ему';
  if (l.status === 'deal') return 'Сделка';
  if (l.status === 'no') return 'Закрыт';
  if (l.step >= 3) return 'Не ответил на 3 сообщения: можно закрыть';
  const d = dueAt(l)!;
  const days = Math.round((startOfDay(d) - startOfDay()) / DAY);
  const what = STEP_LABEL[l.step];
  if (days <= 0) return `${what}: ${days < 0 ? `просрочено на ${-days} дн.` : 'сегодня'}`;
  return `${what}: ${days === 1 ? 'завтра' : `через ${days} дн.`}`;
}
const isDue = (l: Lead) => {
  const d = dueAt(l);
  return d !== null && d < startOfDay() + DAY;
};

/* ─── CSV ─── */
const COLS = ['Название', 'Ниша', 'Город', 'Телефон', 'Telegram', 'Instagram', 'Карточка', 'Источник', 'Статус', 'Отправлено', 'Последнее', 'Заметка'] as const;
const csvCell = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
function toCsv(ls: Lead[]) {
  const rows = ls.map((l) =>
    [l.name, l.niche, l.city, l.phone, l.tg, l.ig ?? '', l.card, l.source, l.status, String(l.step), l.lastAt ? new Date(l.lastAt).toISOString() : '', l.note].map(csvCell).join(';'),
  );
  return '﻿' + [COLS.join(';'), ...rows].join('\r\n');
}
function parseCsv(text: string, sep: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim())) out.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) out.push(row);
  return out;
}

/* ─── tables: our CSV export, GisFind and other 2GIS exports ─── */
const norm = (h: string) => h.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
/** Column finders, checked in this order; each column is used once. */
const FIELDS: [string, RegExp][] = [
  ['status', /^статус$/],
  ['sent', /^отправлено$/],
  ['last', /^последнее$/],
  ['source', /^источник$/],
  ['niche', /^ниша$/],
  ['whatsapp', /whatsapp|ватсап|вотсап|^wa$/],
  ['tg', /telegram|телеграм|^tg$/],
  ['instagram', /instagram|инстаграм|^inst/],
  ['site', /сайт|website|^site|^web$|^www/],
  ['card', /карточк|2gis|2гис|ссылк|link|url|яндекс/],
  ['name', /^(название|наименование|компания|организация|имя|name|title|firm|company)/],
  ['category', /рубрик|категори|сфера|деятельност|category|rubric/],
  ['city', /^(город|населенный пункт|city)/],
  ['address', /адрес|address/],
  ['phone', /телефон|phone|номер|^тел/],
  ['rating', /рейтинг|rating|оценка/],
  ['reviews', /отзыв|review/],
  ['note', /заметк|комментари|note/],
];
/** Rubric text from 2GIS → our niche key. */
const NICHE_WORDS: [RegExp, string][] = [
  [/потол/, 'potolki'],
  [/кухн/, 'kuhni'],
  [/мебел|шкаф|гардероб/, 'mebel'],
  [/вывеск|наружн|реклам|неон|полиграф/, 'vyveski'],
  [/кузов|покраск|автосервис|сто\b|авторемонт|рихтов/, 'kuzov'],
  [/строит|домов|дом под ключ|каркас|сруб/, 'doma'],
  [/ремонт квартир|отделоч|ремонт помещ|ремонтн/, 'remont'],
];
const nicheFromText = (t: string) => {
  const x = t.toLowerCase();
  return NICHE_WORDS.find(([re]) => re.test(x))?.[1] ?? '';
};
/** Real websites only: social pages, maps and messengers don't count. */
const isRealSite = (u: string) =>
  !!u.trim() && !/^(-|нет|no|—)$/i.test(u.trim()) && !/(vk\.com|instagram|taplink|2gis|yandex\.|avito|wa\.me|whatsapp|t\.me|ok\.ru|facebook|tiktok|youtube)/i.test(u);

function fromTable(rows: string[][], defaults: { niche: string; city: string; source: Source }, base: () => Lead) {
  if (rows.length < 2) return null;
  const head = rows[0].map(norm);
  const col: Record<string, number> = {};
  const used = new Set<number>();
  for (const [f, re] of FIELDS) {
    const i = head.findIndex((h, k) => !used.has(k) && re.test(h));
    if (i >= 0) { col[f] = i; used.add(i); }
  }
  if (col.name === undefined || (col.phone === undefined && col.whatsapp === undefined && col.card === undefined)) return null;
  let withSite = 0;
  const leads: Lead[] = [];
  for (const r of rows.slice(1)) {
    const g = (f: string) => (col[f] !== undefined ? String(r[col[f]] ?? '').trim() : '');
    if (isRealSite(g('site'))) { withSite++; continue; }
    const l = base();
    l.name = g('name').slice(0, 60);
    const nicheKey = g('niche');
    l.niche = NICHES[nicheKey] ? nicheKey : nicheFromText(`${g('category')} ${l.name}`) || defaults.niche;
    const addr = g('address');
    l.city = g('city') || (addr.split(',')[0].match(/^[А-ЯЁа-яё -]{3,30}$/)?.[0]?.trim() ?? '') || defaults.city;
    // phones: a cell may hold several; WhatsApp wins because the «Написать» button opens WhatsApp
    const phones = g('phone').split(/[,;\n]| или /).map((x) => x.trim()).filter((x) => normPhone(x));
    const wa = normPhone(g('whatsapp').replace(/^https?:\/\/(wa\.me|api\.whatsapp\.com\/send\?phone=)\/?/i, ''));
    const mobile = phones.find((x) => /^79/.test(normPhone(x)));
    l.phone = wa ? `+${wa}` : mobile || phones[0] || '';
    const others = phones.filter((x) => normPhone(x) !== normPhone(l.phone));
    l.tg = g('tg');
    l.ig = igHandle(g('instagram'));
    l.card = g('card');
    const src = g('source');
    l.source = src === 'yandex' || src === '2gis' ? src : sourceFromUrl(l.card) || defaults.source;
    const st = g('status') as Status;
    if (st in STATUS) l.status = st;
    l.step = Math.min(3, Math.max(0, parseInt(g('sent'), 10) || 0));
    const last = Date.parse(g('last'));
    l.lastAt = Number.isFinite(last) ? last : 0;
    const extra = [
      g('category') && `Рубрика: ${g('category')}`,
      g('rating') && `Рейтинг ${g('rating')}${g('reviews') ? `, отзывы: ${g('reviews')}` : ''}`,
      others.length ? `Ещё телефоны: ${others.join(', ')}` : '',
      addr && `Адрес: ${addr}`,
    ].filter(Boolean);
    l.note = [g('note'), ...extra].filter(Boolean).join('\n');
    if (l.name || l.phone) leads.push(l);
  }
  return { leads, withSite };
}

/** Turns pasted text (one company per line, or our own CSV export) into leads. */
function parsePaste(text: string, defaults: { niche: string; city: string; source: Source }): Lead[] {
  const t = text.replace(/^﻿/, '').trim();
  if (!t) return [];
  const first = t.split(/\r?\n/)[0];
  const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
  const rows = parseCsv(t, sep);
  const now = Date.now();
  const base = (): Lead => ({
    id: uid(), niche: defaults.niche, name: '', city: defaults.city, phone: '', tg: '', card: '', source: defaults.source,
    note: '', status: 'todo', step: 0, lastAt: 0, created: now, log: [],
  });
  // a table with a header row: our own export, a GisFind export, or any sheet with recognisable columns
  const table = fromTable(rows, defaults, base);
  if (table) return table.leads;
  // free-form: name; phone; city; link — in any order, each line split on its own separator
  const lines = t.split(/\r?\n/).filter((x) => x.trim());
  return lines.map((line) => line.split(/[\t;]/.test(line) ? /[\t;]/ : /,/)).map((cells) => {
    const l = base();
    const rest: string[] = [];
    for (const raw of cells) {
      const c = raw.trim();
      if (!c) continue;
      if (/^https?:\/\//i.test(c) || /2gis\.|yandex\./i.test(c)) {
        if (/t\.me\//i.test(c)) l.tg = c;
        else { l.card = c; l.source = sourceFromUrl(c) || l.source; }
      } else if (/^@[a-z0-9_]{4,}$/i.test(c)) l.tg = c;
      else if (!l.phone && normPhone(c)) l.phone = c;
      else rest.push(c);
    }
    l.name = rest[0] || '';
    if (rest[1]) l.city = rest[1];
    if (rest.length > 2) l.note = rest.slice(2).join(', ');
    return l;
  }).filter((l) => l.name || l.phone);
}

/* ─── small parts ─── */
const field = 'w-full h-[46px] rounded-[11px] px-3.5 text-[16px] bg-bg text-tx outline-none ui-focus';
const ring = { boxShadow: 'inset 0 0 0 1px var(--line)' };
function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-[14px] text-tx-3 ${className}`}>
      {label}
      {children}
    </label>
  );
}
function NicheSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className={field} style={ring} value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(NICHES).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  );
}
function SourceSelect({ value, onChange }: { value: Source; onChange: (v: Source) => void }) {
  return (
    <select className={field} style={ring} value={value} onChange={(e) => onChange(e.target.value as Source)}>
      <option value="2gis">2ГИС</option>
      <option value="yandex">Яндекс Карты</option>
    </select>
  );
}

/* ─── add form ─── */
function AddPanel({ onAdd }: { onAdd: (ls: Lead[]) => number }) {
  const [mode, setMode] = useState<'one' | 'list'>('one');
  const [niche, setNiche] = useState('potolki');
  const [source, setSource] = useState<Source>('2gis');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tg, setTg] = useState('');
  const [ig, setIg] = useState('');
  const [card, setCard] = useState('');
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const preview = useMemo(() => (mode === 'list' ? parsePaste(paste, { niche, city, source }) : []), [mode, paste, niche, city, source]);

  const addOne = () => {
    if (!name.trim() && !phone.trim()) { setMsg('Нужно название или телефон'); return; }
    const n = onAdd([{
      id: uid(), niche, name: name.trim(), city: city.trim(), phone: phone.trim(), tg: tg.trim(), ig: igHandle(ig), card: card.trim(),
      source: sourceFromUrl(card) || source, note: '', status: 'todo', step: 0, lastAt: 0, created: Date.now(), log: [],
    }]);
    setMsg(n ? `Добавлен «${name.trim() || fmtPhone(phone)}»` : 'Такой лид уже есть');
    if (n) { setName(''); setPhone(''); setTg(''); setIg(''); setCard(''); }
  };
  const addList = () => {
    const n = onAdd(preview);
    setMsg(`Добавлено: ${n}${preview.length - n ? `, пропущено повторов: ${preview.length - n}` : ''}`);
    if (n) setPaste('');
  };

  return (
    <section className="rounded-[18px] bg-bg-2 p-5 md:p-6" style={ring} aria-labelledby="add-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="add-title" className="h3 m-0">Добавить лидов</h2>
        <div className="flex rounded-[12px] bg-bg p-1" style={ring} role="tablist">
          {(['one', 'list'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`ui-press ui-focus h-[36px] rounded-[9px] px-4 text-[15px] font-medium ${mode === m ? 'bg-bg-3 text-tx' : 'text-tx-3'}`}
              onClick={() => { setMode(m); setMsg(''); }}
            >
              {m === 'one' ? 'По одному' : 'Списком'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Field label="Ниша"><NicheSelect value={niche} onChange={setNiche} /></Field>
        <Field label="Город"><input className={field} style={ring} value={city} maxLength={42} placeholder="Барнаул" onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Где нашли"><SourceSelect value={source} onChange={setSource} /></Field>
      </div>
      {mode === 'one' ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Название"><input className={field} style={ring} value={name} maxLength={42} placeholder="Потолки Люкс" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOne()} /></Field>
            <Field label="Телефон (для WhatsApp)"><input className={field} style={ring} value={phone} inputMode="tel" placeholder="+7 900 000-00-00" onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOne()} /></Field>
            <Field label="Telegram, если есть"><input className={field} style={ring} value={tg} placeholder="@username" onChange={(e) => setTg(e.target.value)} /></Field>
            <Field label="Instagram, если есть"><input className={field} style={ring} value={ig} placeholder="@username" onChange={(e) => setIg(e.target.value)} /></Field>
            <Field label="Ссылка на карточку"><input className={field} style={ring} value={card} inputMode="url" placeholder="https://2gis.ru/…" onChange={(e) => setCard(e.target.value)} /></Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-a ui-press ui-focus h-[46px]" onClick={addOne}>Добавить</button>
            <span className="text-[15px] text-tx-2" aria-live="polite">{msg}</span>
          </div>
        </>
      ) : (
        <>
          <Field label="Одна компания на строку: название; телефон; ссылка. Можно вставить столбцы из таблицы или CSV, выгруженный отсюда" className="mt-3">
            <textarea
              className="min-h-[150px] w-full rounded-[11px] bg-bg p-3.5 font-mono text-[14px] text-tx outline-none ui-focus"
              style={ring}
              value={paste}
              placeholder={'Потолки Люкс; +7 913 000-00-00; https://2gis.ru/barnaul/firm/…\nНебо Потолки; 8 (3852) 00-00-00'}
              onChange={(e) => setPaste(e.target.value)}
            />
          </Field>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-a ui-press ui-focus h-[46px]" disabled={!preview.length} onClick={addList}>
              {preview.length ? `Добавить ${preview.length}` : 'Добавить'}
            </button>
            <span className="text-[15px] text-tx-2" aria-live="polite">
              {msg || (preview.length ? `Первый: ${preview[0].name || '—'}${preview[0].phone ? `, ${fmtPhone(preview[0].phone)}` : ''}` : '')}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

/* ─── one lead ─── */
function LeadCard({ l, open, onToggle, update, remove, onSent }: {
  l: Lead; open: boolean; onToggle: () => void; update: (p: Partial<Lead>, log?: string) => void; remove: () => void; onSent: () => void;
}) {
  const stepNow = Math.min(l.step, 2);
  const [step, setStep] = useState(stepNow);
  const [opened, setOpened] = useState(false);
  const [obj, setObj] = useState<number | null>(null);
  useEffect(() => { setStep(stepNow); setOpened(false); }, [stepNow, open]);
  const tgu = tgUrl(l.tg, l.phone);
  const igu = igUrl(l.ig);
  const avail = ([['whatsapp', !!waUrl(l.phone, 'x')], ['telegram', !!tgu], ['instagram', !!igu]] as [Via, boolean][]).filter(([, ok]) => ok).map(([v]) => v);
  const [via, setVia] = useState<Via | undefined>(l.via && avail.includes(l.via) ? l.via : avail[0]);
  useEffect(() => { if (!via || !avail.includes(via)) setVia(avail[0]); }, [avail.join(), via]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = message(l, step, via);
  const wa = waUrl(l.phone, text);
  const openUrl = via === 'whatsapp' ? wa : via === 'telegram' ? tgu : via === 'instagram' ? igu : '';
  const due = isDue(l);
  const canSend = l.status === 'todo' || l.status === 'sent';

  const markSent = () => {
    const s = Math.max(l.step, step + 1);
    update({ step: s, lastAt: Date.now(), status: 'sent', via }, `msg${step}${via ? `:${via}` : ''}`);
    onSent();
  };

  return (
    <li className="rounded-[16px] bg-bg-2" style={{ boxShadow: `inset 0 0 0 1px ${open ? 'rgb(255 107 26 / 0.4)' : 'var(--line)'}` }}>
      <button type="button" className="ui-focus flex w-full items-center gap-4 rounded-[16px] p-4 text-left md:px-5" aria-expanded={open} onClick={onToggle}>
        <span className={`size-2.5 shrink-0 rounded-full ${due ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[17px] font-semibold">{l.name || fmtPhone(l.phone)}</span>
          <span className="truncate text-[14px] text-tx-3">
            {NICHES[l.niche]?.label ?? l.niche}{l.city ? ` · ${l.city}` : ''}{l.phone ? ` · ${fmtPhone(l.phone)}` : ''}
          </span>
        </span>
        <span className={`hidden text-[14px] sm:block ${due ? 'text-[#ffb48a]' : 'text-tx-3'}`}>{nextLabel(l)}</span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_TONE[l.status]}`}>{STATUS[l.status]}</span>
      </button>

      {open && (
        <div className="grid gap-5 border-t border-[var(--line)] p-4 md:p-5">
          <p className={`m-0 text-[14px] sm:hidden ${due ? 'text-[#ffb48a]' : 'text-tx-3'}`}>{nextLabel(l)}</p>

          <div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Сообщение">
              {STEP_LABEL.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={step === i}
                  className={`ui-press ui-focus h-[34px] rounded-full px-3.5 text-[14px] ${step === i ? 'bg-tx text-bg' : 'text-tx-2'}`}
                  style={step === i ? undefined : ring}
                  onClick={() => setStep(i)}
                >
                  {i < l.step ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
            {avail.length > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-tx-3">
                Пишу в
                {avail.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={via === v}
                    className={`ui-press ui-focus h-[32px] rounded-full px-3 text-[14px] ${via === v ? 'bg-[rgb(255_107_26/0.16)] font-semibold text-[#ffb48a]' : 'text-tx-2'}`}
                    style={via === v ? undefined : ring}
                    onClick={() => setVia(v)}
                  >
                    {VIA_LABEL[v]}
                  </button>
                ))}
              </div>
            )}
            {!avail.length && <p className="mb-0 mt-3 text-[14px] text-tx-3">Нет телефона, Telegram или Instagram: добавьте контакт ниже или скопируйте текст.</p>}
            <p className="mb-0 mt-3 whitespace-pre-wrap rounded-[12px] bg-bg p-4 text-[15px] leading-relaxed [overflow-wrap:anywhere]" style={ring}>{text}</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {via && openUrl && (
                <a
                  className="btn btn-a ui-press ui-focus h-[44px] px-4 text-[15px]"
                  href={openUrl}
                  target="_blank"
                  rel="noopener"
                  title={via === 'whatsapp' ? undefined : 'Текст скопируется, вставьте его в чат'}
                  onClick={() => { if (via !== 'whatsapp') void copyText(text); setOpened(true); }}
                >
                  {via === 'whatsapp' ? 'Открыть в WhatsApp' : `Открыть ${VIA_LABEL[via]} (текст скопирован)`}
                </a>
              )}
              <CopyBtn text={text} label="Скопировать" primary={!openUrl} />
              <a className="btn btn-b ui-press ui-press--on-dark ui-focus h-[44px] px-4 text-[15px]" href={leadLink(l, via)} target="_blank" rel="noopener">Как видит лид ↗</a>
              {l.card && <a className="btn btn-b ui-press ui-press--on-dark ui-focus h-[44px] px-4 text-[15px]" href={l.card} target="_blank" rel="noopener">Карточка ↗</a>}
            </div>
            {canSend && step >= l.step && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={`btn ui-press ui-focus h-[44px] px-4 text-[15px] ${opened ? 'btn-a' : 'btn-b ui-press--on-dark'}`}
                  onClick={markSent}
                >
                  Отправил ✓
                </button>
                <span className="text-[14px] text-tx-3">
                  {step < 2 ? `Следующее напоминание через ${WAIT[step]} дн.` : 'Это последнее сообщение'}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[14px] text-tx-3">Статус</span>
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={l.status === s}
                className={`ui-press ui-focus h-[34px] rounded-full px-3.5 text-[14px] ${l.status === s ? STATUS_TONE[s] + ' font-semibold' : 'text-tx-2'}`}
                style={l.status === s ? undefined : ring}
                onClick={() => update({ status: s }, `status:${s}`)}
              >
                {STATUS[s]}
              </button>
            ))}
          </div>

          <div>
            <div className="text-[14px] text-tx-3">Если ответил</div>
            <ul className="m-0 mt-2 grid list-none gap-2 p-0">
              {objections(l, via).map(([q, a], i) => (
                <li key={q} className="rounded-[12px] bg-bg" style={ring}>
                  <button type="button" className="ui-focus flex w-full items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left text-[15px] font-medium" aria-expanded={obj === i} onClick={() => setObj(obj === i ? null : i)}>
                    {q}
                    <span className={`text-tx-3 transition-transform ${obj === i ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                  </button>
                  {obj === i && (
                    <div className="px-4 pb-4">
                      <p className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-tx-2 [overflow-wrap:anywhere]">{a}</p>
                      <div className="mt-3"><CopyBtn text={a} label="Скопировать ответ" /></div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Название"><input className={field} style={ring} value={l.name} maxLength={42} onChange={(e) => update({ name: e.target.value })} /></Field>
            <Field label="Город"><input className={field} style={ring} value={l.city} maxLength={42} onChange={(e) => update({ city: e.target.value })} /></Field>
            <Field label="Ниша"><NicheSelect value={l.niche} onChange={(v) => update({ niche: v })} /></Field>
            <Field label="Телефон"><input className={field} style={ring} value={l.phone} inputMode="tel" onChange={(e) => update({ phone: e.target.value })} /></Field>
            <Field label="Telegram"><input className={field} style={ring} value={l.tg} placeholder="@username" onChange={(e) => update({ tg: e.target.value })} /></Field>
            <Field label="Instagram"><input className={field} style={ring} value={l.ig ?? ''} placeholder="@username" onChange={(e) => update({ ig: e.target.value })} /></Field>
            <Field label="Где нашли"><SourceSelect value={l.source} onChange={(v) => update({ source: v })} /></Field>
            <Field label="Ссылка на карточку" className="sm:col-span-2 lg:col-span-3"><input className={field} style={ring} value={l.card} inputMode="url" onChange={(e) => update({ card: e.target.value })} /></Field>
            <Field label="Заметка" className="sm:col-span-2 lg:col-span-3">
              <textarea className="min-h-[76px] w-full rounded-[11px] bg-bg p-3.5 text-[16px] text-tx outline-none ui-focus" style={ring} value={l.note} placeholder="Что ответил, когда перезвонить, что прислал" onChange={(e) => update({ note: e.target.value })} />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[14px] text-tx-3">
            <span>
              Добавлен {new Date(l.created).toLocaleDateString('ru-RU')}
              {l.lastAt ? ` · последнее сообщение ${new Date(l.lastAt).toLocaleDateString('ru-RU')}` : ''}
            </span>
            <button
              type="button"
              className="ui-press ui-focus h-[36px] rounded-[10px] px-3 text-[14px] text-tx-3 hover:text-[#ff8f8f]"
              onClick={() => { if (window.confirm(`Удалить «${l.name || l.phone}»?`)) remove(); }}
            >
              Удалить лида
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ─── page ─── */
type Tab = 'today' | 'wait' | 'reply' | 'deal' | 'no' | 'all';
const TABS: [Tab, string][] = [['today', 'На сегодня'], ['wait', 'Ждём ответа'], ['reply', 'Ответили'], ['deal', 'Сделки'], ['no', 'Отказ'], ['all', 'Все']];

function App({ vaultKey, initial, notice, onLock }: { vaultKey: CryptoKey; initial: Lead[]; notice: string; onLock: () => void }) {
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [tab, setTab] = useState<Tab>('today');
  const [view, setView] = useState<'leads' | 'radar'>(() => {
    try { return sessionStorage.getItem('turch-view') === 'radar' ? 'radar' : 'leads'; } catch { return 'leads'; }
  });
  useEffect(() => { try { sessionStorage.setItem('turch-view', view); } catch { /* convenience only */ } }, [view]);
  const radar = useRadar(vaultKey);
  const radarNew = freshCount(radar.data);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [goal, setGoal] = useState(() => {
    try { return Number(localStorage.getItem(GOAL_KEY)) || 25; } catch { return 25; }
  });
  const [saveErr, setSaveErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // encrypt on every change; a sequence number keeps a slow older write from landing after a newer one
  const seq = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const n = ++seq.current;
    seal(vaultKey, JSON.stringify(leads)).then((blob) => {
      if (n !== seq.current) return;
      try { localStorage.setItem(KEY, blob); setSaveErr(false); } catch { setSaveErr(true); }
    }, () => setSaveErr(true));
  }, [leads, vaultKey]);
  useEffect(() => { try { localStorage.setItem(GOAL_KEY, String(goal)); } catch { /* per-browser convenience only */ } }, [goal]);

  const add = (ls: Lead[]) => {
    const keyOf = (l: Lead) => normPhone(l.phone) || `${l.name.trim().toLowerCase()}|${l.city.trim().toLowerCase()}`;
    const seen = new Set(leads.map(keyOf));
    const fresh = ls.filter((l) => { const k = keyOf(l); if (seen.has(k)) return false; seen.add(k); return true; });
    if (fresh.length) setLeads((p) => [...fresh, ...p]);
    return fresh.length;
  };
  const update = (id: string) => (p: Partial<Lead>, log?: string) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...p, log: log ? [...l.log, { t: Date.now(), s: log }] : l.log } : l)));
  const remove = (id: string) => setLeads((ls) => ls.filter((l) => l.id !== id));

  const today = startOfDay();
  const sentToday = leads.reduce((n, l) => n + l.log.filter((e) => e.s.startsWith('msg') && e.t >= today).length, 0);
  const firstToday = leads.reduce((n, l) => n + l.log.filter((e) => e.s === 'msg0' && e.t >= today).length, 0);
  const count = {
    today: leads.filter(isDue).length,
    wait: leads.filter((l) => l.status === 'sent').length,
    reply: leads.filter((l) => l.status === 'reply').length,
    deal: leads.filter((l) => l.status === 'deal').length,
    no: leads.filter((l) => l.status === 'no').length,
    all: leads.length,
  };
  const followDue = leads.filter((l) => isDue(l) && l.step > 0).length;
  const contacted = leads.filter((l) => l.step > 0).length;
  const replied = leads.filter((l) => l.status === 'reply' || l.status === 'deal' || l.log.some((e) => e.s === 'status:reply')).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let ls = leads.filter((l) => {
      if (tab === 'today') return isDue(l);
      if (tab === 'wait') return l.status === 'sent';
      if (tab === 'all') return true;
      return l.status === tab;
    });
    if (q) ls = ls.filter((l) => `${l.name} ${l.city} ${l.phone} ${l.note}`.toLowerCase().includes(q));
    if (tab === 'today') {
      // follow-ups first (they go stale), then new leads in the order they were added
      ls = [...ls].sort((a, b) => (b.step > 0 ? 1 : 0) - (a.step > 0 ? 1 : 0) || (dueAt(a)! - dueAt(b)!) || a.created - b.created);
    } else if (tab === 'wait') {
      ls = [...ls].sort((a, b) => (dueAt(a) ?? Infinity) - (dueAt(b) ?? Infinity));
    }
    return ls;
  }, [leads, tab, query]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(leads)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const [importMsg, setImportMsg] = useState(notice);
  const importCsv = async (f: File) => {
    const defaults = { niche: 'potolki', city: '', source: '2gis' as Source };
    let rows: string[][];
    try {
      if (/\.xlsx$/i.test(f.name)) {
        const { readSheet } = await import('read-excel-file/browser');
        const data = await readSheet(f);
        rows = data.map((r) => r.map((c) => (c == null ? '' : c instanceof Date ? c.toISOString() : String(c))));
      } else {
        const text = (await f.text()).replace(/^\uFEFF/, '');
        const first = text.split(/\r?\n/)[0];
        rows = parseCsv(text, first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',');
      }
    } catch {
      setImportMsg('Не получилось прочитать файл. Нужен CSV или Excel (.xlsx).');
      return;
    }
    const base = (): Lead => ({
      id: uid(), niche: defaults.niche, name: '', city: '', phone: '', tg: '', card: '', source: defaults.source,
      note: '', status: 'todo', step: 0, lastAt: 0, created: Date.now(), log: [],
    });
    const t = fromTable(rows, defaults, base);
    if (!t) {
      setImportMsg('В файле не нашлись столбцы «Название» и «Телефон». Пришлите файл мне, я добавлю его формат.');
      return;
    }
    const n = add(t.leads);
    const dup = t.leads.length - n;
    setImportMsg(`Из файла добавлено: ${n}${dup ? `, уже были: ${dup}` : ''}${t.withSite ? `, пропущено с сайтом: ${t.withSite}` : ''}`);
  };

  const pct = Math.min(100, Math.round((sentToday / Math.max(1, goal)) * 100));

  return (
    <main className="wrap max-w-[1080px] pb-24 pt-8 md:pt-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <a href={import.meta.env.BASE_URL} className="font-display text-[19px] font-extrabold tracking-[0.1em] text-tx no-underline">TURCH</a>
          <span className="text-[15px] text-tx-3">лиды</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[42px] px-4 text-[15px]" onClick={exportCsv} disabled={!leads.length}>Скачать CSV</button>
          <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[42px] px-4 text-[15px]" onClick={() => fileRef.current?.click()}>Загрузить CSV / Excel</button>
          <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[42px] px-4 text-[15px]" onClick={onLock}>Выйти</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.txt,text/csv,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ''; }} />
        </div>
      </header>
      {(importMsg || saveErr) && (
        <p className="mb-0 mt-3 text-[15px] text-tx-2" aria-live="polite">
          {saveErr ? 'Браузер не даёт сохранять данные (приватный режим?). Скачайте CSV, чтобы ничего не потерять.' : importMsg}
        </p>
      )}

      <nav className="mt-7 flex gap-1 rounded-[14px] bg-bg-2 p-1 sm:w-max" style={ring} aria-label="Раздел">
        {([['leads', 'Лиды', leads.length], ['radar', 'Радар Threads', radarNew]] as const).map(([k, t, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={view === k}
            className={`ui-press ui-focus flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[11px] px-5 text-[15px] font-semibold sm:flex-none ${view === k ? 'bg-bg-3 text-tx' : 'text-tx-3'}`}
            onClick={() => setView(k)}
          >
            {t}
            {n > 0 && <span className={`rounded-full px-2 text-[13px] tabular-nums ${k === 'radar' ? 'bg-accent text-accent-ink' : 'bg-[rgb(244_241_234/0.1)] text-tx-2'}`}>{n}</span>}
          </button>
        ))}
      </nav>

      {view === 'radar' ? <Radar radar={radar} /> : (<>
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Сводка">
        <div className="rounded-[18px] bg-bg-2 p-5 sm:col-span-2" style={ring}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-tx-2">Отправлено сегодня</span>
            <label className="flex items-center gap-2 text-[14px] text-tx-3">
              цель
              <input
                type="number"
                min={1}
                max={60}
                className="ui-focus h-[30px] w-[58px] rounded-[8px] bg-bg px-2 text-[15px] text-tx outline-none"
                style={ring}
                value={goal}
                onChange={(e) => setGoal(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              />
            </label>
          </div>
          <div className="mt-2 font-display text-[40px] font-extrabold leading-none tabular-nums">
            {sentToday}<span className="text-[22px] text-tx-3"> / {goal}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuenow={sentToday} aria-valuemin={0} aria-valuemax={goal} aria-label="Прогресс за день">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mb-0 mt-3 text-[14px] text-tx-3">
            Новых {firstToday}, напоминаний {sentToday - firstToday}. Больше 30 в день с одного номера лучше не отправлять: WhatsApp может ограничить аккаунт.
          </p>
        </div>
        <div className="rounded-[18px] bg-bg-2 p-5" style={ring}>
          <div className="text-[15px] text-tx-2">Пора напомнить</div>
          <div className={`mt-2 font-display text-[40px] font-extrabold leading-none tabular-nums ${followDue ? 'text-accent' : ''}`}>{followDue}</div>
          <p className="mb-0 mt-3 text-[14px] text-tx-3">Напоминания через 2 и 5 дней</p>
        </div>
        <div className="rounded-[18px] bg-bg-2 p-5" style={ring}>
          <div className="text-[15px] text-tx-2">Ответили</div>
          <div className="mt-2 font-display text-[40px] font-extrabold leading-none tabular-nums">
            {replied}<span className="text-[22px] text-tx-3"> из {contacted}</span>
          </div>
          <p className="mb-0 mt-3 text-[14px] text-tx-3">Сделок: {count.deal}</p>
        </div>
      </section>

      <div className="mt-6">
        <AddPanel onAdd={add} />
      </div>

      <section className="mt-10" aria-labelledby="list-title">
        <h2 id="list-title" className="sr-only">Лиды</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Фильтр">
            {TABS.map(([k, t]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={`ui-press ui-focus h-[38px] shrink-0 rounded-full px-4 text-[15px] font-medium ${tab === k ? 'bg-tx text-bg' : 'text-tx-2'}`}
                onClick={() => setTab(k)}
              >
                {t} <span className={tab === k ? 'text-bg/60' : 'text-tx-3'}>{count[k]}</span>
              </button>
            ))}
          </div>
          <input
            className="ui-focus h-[40px] w-full rounded-full bg-bg-2 px-4 text-[15px] text-tx outline-none sm:w-[240px]"
            style={ring}
            type="search"
            placeholder="Поиск"
            aria-label="Поиск по лидам"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {list.length ? (
          <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
            {list.map((l) => (
              <LeadCard
                key={l.id}
                l={l}
                open={openId === l.id}
                onToggle={() => setOpenId(openId === l.id ? null : l.id)}
                update={update(l.id)}
                remove={() => remove(l.id)}
                onSent={() => {
                  // in «На сегодня» the sent lead leaves the list: open the next one right away
                  if (tab !== 'today') return;
                  const i = list.findIndex((x) => x.id === l.id);
                  setOpenId(list[i + 1]?.id ?? null);
                }}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-[16px] p-8 text-center text-[16px] text-tx-2" style={{ boxShadow: 'inset 0 0 0 1px var(--line)', borderStyle: 'dashed' }}>
            {!leads.length
              ? 'Пока пусто. Найдите в 2ГИС или на Яндекс Картах компании без сайта и добавьте их выше.'
              : tab === 'today'
                ? 'На сегодня всё отправлено. Добавьте новых лидов или загляните завтра.'
                : 'Здесь пока никого.'}
          </div>
        )}
      </section>

      <Guide />
      </>)}
    </main>
  );
}

function Guide() {
  const steps: [string, string][] = [
    ['Ищите', 'Соберите компании в GisFind или вручную в 2ГИС и Яндекс Картах: нужны те, где нет сайта, но есть отзывы и фото, то есть бизнес живой.'],
    ['Добавляйте', 'Выгрузку GisFind (CSV или Excel) загрузите кнопкой «Загрузить CSV / Excel»: ниша определится по рубрике, компании с сайтом пропустятся. Можно и вставить списком.'],
    ['Пишите', 'Откройте лида, нажмите WhatsApp: сообщение уже вставлено, там персональная ссылка с его названием. Отправьте и нажмите «Отправил».'],
    ['Напоминайте', 'Через 2 и 5 дней лид снова появится в «На сегодня» с готовым напоминанием. После третьего сообщения без ответа закройте его.'],
    ['Отвечайте', 'Когда ответят, отметьте «Ответил» и возьмите готовый ответ на возражение. Цель первого разговора: получить 3–5 фото и сделать бесплатный первый экран.'],
  ];
  return (
    <section className="mt-16 border-t border-[var(--line)] pt-10" aria-labelledby="guide-title">
      <h2 id="guide-title" className="h3 m-0">Как работать</h2>
      <ol className="m-0 mt-5 grid list-none gap-4 p-0 md:grid-cols-5">
        {steps.map(([t, d], i) => (
          <li key={t} className="grid content-start gap-2">
            <span className="font-display text-[15px] font-extrabold text-accent tabular-nums">0{i + 1}</span>
            <span className="text-[17px] font-semibold">{t}</span>
            <span className="text-[15px] leading-relaxed text-tx-2">{d}</span>
          </li>
        ))}
      </ol>
      <p className="mb-0 mt-8 max-w-[760px] text-[14px] leading-relaxed text-tx-3">
        Данные хранятся только в этом браузере и зашифрованы паролем. Раз в несколько дней скачивайте CSV: если почистить историю или открыть сайт на другом устройстве, список будет пустым, и его можно загрузить из файла.
      </p>
    </section>
  );
}

/* ─── password gate ─── */
type Gate = { s: 'boot' } | { s: 'locked' } | { s: 'open'; key: CryptoKey; leads: Lead[]; notice: string };

function Login({ onOpen }: { onOpen: (k: CryptoKey, remember: boolean) => void }) {
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pw.trim() || busy) return;
    setBusy(true);
    setErr('');
    try {
      const k = await unlock(pw);
      if (k) onOpen(k, remember);
      else setErr('Неверный пароль');
    } catch {
      setErr('Браузер не поддерживает шифрование. Откройте страницу в свежем Chrome, Яндекс Браузере или Safari.');
    }
    setBusy(false);
  };
  return (
    <main className="wrap grid min-h-[100svh] content-center py-12">
      <div className="mx-auto w-full max-w-[400px]">
      <div className="font-display text-[19px] font-extrabold tracking-[0.1em]">TURCH</div>
      <h1 className="h2 m-0 mt-6 text-[36px]">Вход в трекер</h1>
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <input type="text" name="username" autoComplete="username" value="turch" readOnly hidden />
        <label className="grid gap-2 text-[15px] text-tx-2">
          Пароль
          <input
            className={`${field} h-[52px]`}
            style={{ boxShadow: `inset 0 0 0 1px ${err ? '#ff6b6b' : 'var(--line)'}` }}
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            aria-invalid={!!err}
            aria-describedby="pw-err"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(''); }}
          />
        </label>
        <label className="flex items-center gap-3 text-[15px] text-tx-2">
          <input type="checkbox" className="size-[18px]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Запомнить на этом устройстве
        </label>
        <button type="submit" className="btn btn-a ui-press ui-focus mt-2" disabled={busy}>{busy ? 'Проверяю…' : 'Войти'}</button>
        <p id="pw-err" className="m-0 min-h-[24px] text-[15px] text-[#ff8f8f]" aria-live="polite">{err}</p>
      </form>
      </div>
    </main>
  );
}

function Root() {
  const [g, setG] = useState<Gate>({ s: 'boot' });
  const enter = async (key: CryptoKey) => {
    const { leads, notice } = await loadVault(key);
    setG({ s: 'open', key, leads, notice });
  };
  useEffect(() => {
    recallKey().then((k) => (k ? enter(k) : setG({ s: 'locked' })), () => setG({ s: 'locked' }));
  }, []);
  if (g.s === 'boot') return null;
  if (g.s === 'locked')
    return <Login onOpen={(k, remember) => { if (remember) void rememberKey(k); void enter(k); }} />;
  return (
    <App
      vaultKey={g.key}
      initial={g.leads}
      notice={g.notice}
      onLock={() => { void forgetKey(); setG({ s: 'locked' }); }}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
(window as unknown as { BetterUI?: { init: (d: Document) => void } }).BetterUI?.init(document);
