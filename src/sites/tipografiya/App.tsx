import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED } from '@/shared/brand';

const BRAND = brandOr('Оттиск');
const CITY = cityOr('Москва');
const PHONE = '+7 (900) 000-00-00';

/* ───────────── products and prices ─────────────
   price = setup + unit × qty × (qty / q0)^-0.33 × options; numbers are a believable demo, not a quote. */
type P = 'cards' | 'flyers' | 'booklets' | 'catalogs' | 'stickers' | 'bags';
type Finish = 'none' | 'matte' | 'gloss' | 'soft' | 'foil';
const FINISH: Record<Finish, [string, number, number]> = {
  // label, price multiplier, extra days
  none: ['Без отделки', 1, 0],
  matte: ['Матовая ламинация', 1.25, 1],
  gloss: ['Глянцевая ламинация', 1.25, 1],
  soft: ['Софт-тач', 1.45, 1],
  foil: ['Тиснение фольгой', 1.6, 2],
};
type Prod = {
  t: string; short: string; setup: number; days: number; q0: number; qty: number[];
  formats: [string, number][]; papers: [string, number][]; sides: boolean; finishes: Finish[]; unit: number;
};
const PRODUCTS: Record<P, Prod> = {
  cards: { t: 'Визитки', short: 'визитки', setup: 300, days: 1, q0: 100, unit: 6, qty: [100, 200, 500, 1000, 2000, 5000], formats: [['90 × 50 мм', 1], ['85 × 55 мм', 1]], papers: [['Мелованная 300 г', 1], ['Дизайнерская 350 г', 1.6]], sides: true, finishes: ['none', 'matte', 'gloss', 'soft', 'foil'] },
  flyers: { t: 'Листовки', short: 'листовки', setup: 400, days: 2, q0: 100, unit: 5, qty: [100, 500, 1000, 2000, 5000, 10000], formats: [['А6', 1], ['А5', 1.5], ['А4', 2.6]], papers: [['Мелованная 130 г', 1], ['Мелованная 170 г', 1.2]], sides: true, finishes: ['none', 'gloss'] },
  booklets: { t: 'Буклеты', short: 'буклеты', setup: 600, days: 3, q0: 100, unit: 22, qty: [100, 300, 500, 1000, 2000, 5000], formats: [['Евробуклет, 2 сгиба', 1], ['А4, 1 сгиб', 1.1]], papers: [['Мелованная 150 г', 1], ['Мелованная 200 г', 1.2]], sides: false, finishes: ['none', 'matte', 'gloss'] },
  catalogs: { t: 'Каталоги', short: 'каталоги', setup: 1500, days: 5, q0: 50, unit: 4, qty: [50, 100, 200, 500, 1000, 2000], formats: [['А4', 1], ['А5', 0.62]], papers: [['Мелованная 130 г', 1], ['Мелованная 170 г', 1.18]], sides: false, finishes: ['none', 'matte', 'soft', 'foil'] },
  stickers: { t: 'Наклейки', short: 'наклейки', setup: 500, days: 2, q0: 100, unit: 8, qty: [100, 300, 500, 1000, 3000, 5000], formats: [['5 × 5 см', 1], ['8 × 8 см', 1.7], ['10 × 10 см', 2.4]], papers: [['Бумага', 1], ['Плёнка, влагостойкая', 1.45]], sides: false, finishes: ['none', 'gloss'] },
  bags: { t: 'Пакеты', short: 'пакеты', setup: 3000, days: 7, q0: 100, unit: 95, qty: [100, 200, 300, 500, 1000, 2000], formats: [['S, 18 × 22 см', 1], ['M, 25 × 32 см', 1.3], ['L, 32 × 40 см', 1.7]], papers: [['Крафт, ручки-верёвки', 1], ['Белый картон, ручки-ленты', 1.5]], sides: false, finishes: ['none', 'matte', 'foil'] },
};
const ORDER: P[] = ['cards', 'flyers', 'booklets', 'catalogs', 'stickers', 'bags'];

type Calc = { p: P; format: number; paper: number; both: boolean; finish: Finish; qi: number; pages: number; urgent: boolean };
const DEFAULT: Calc = { p: 'cards', format: 0, paper: 0, both: true, finish: 'soft', qi: 3, pages: 16, urgent: false };

function price(c: Calc) {
  const pr = PRODUCTS[c.p];
  const qty = pr.qty[Math.min(c.qi, pr.qty.length - 1)];
  const fin = FINISH[pr.finishes.includes(c.finish) ? c.finish : 'none'];
  let unit = pr.unit * pr.formats[c.format][1] * pr.papers[c.paper][1] * fin[1];
  if (pr.sides && c.both) unit *= 1.35;
  if (c.p === 'catalogs') unit *= c.pages;
  unit *= Math.pow(qty / pr.q0, -0.33);
  let total = pr.setup + (fin === FINISH.foil ? 1500 : 0) + unit * qty;
  let days = pr.days + fin[2] + (qty >= 2000 ? 1 : 0) + (c.p === 'catalogs' && c.pages > 32 ? 1 : 0);
  if (c.urgent) { total *= 1.5; days = Math.max(1, Math.ceil(days / 2)); }
  total = Math.ceil(total / 10) * 10;
  return { qty, total, per: total / qty, days, ready: readyDate(days) };
}
function readyDate(days: number) {
  const d = new Date();
  let left = days;
  while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) left--; }
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}
const minPrice = (p: P) => price({ ...DEFAULT, p, format: 0, paper: 0, both: false, finish: 'none', qi: 0, pages: 8 }).total;

/* ───────────── CSS mockups ───────────── */
function Mark({ size = 18 }: { size?: number }) {
  return (
    <span className="inline-grid shrink-0 grid-cols-2 gap-[2px]" style={{ width: size, height: size }} aria-hidden="true">
      <i className="block rounded-[1px] bg-c" /><i className="block rounded-[1px] bg-m" />
      <i className="block rounded-[1px] bg-y" /><i className="block rounded-[1px] bg-[var(--k)]" />
    </span>
  );
}
const finCls = (f: Finish) => (f === 'gloss' ? 'fin-gloss' : f === 'soft' ? 'fin-soft' : '');

function CardMock({ finish = 'none', paper = 0, back = false, className = '', style }: { finish?: Finish; paper?: number; back?: boolean; className?: string; style?: CSSProperties }) {
  const name = <span className={finish === 'foil' ? 'foil' : ''}>{BRAND}</span>;
  return (
    <div className={`mk mk-card ${finCls(finish)} ${className}`} data-paper={paper === 1 ? 'design' : 'coated'} style={style}>
      {back ? (
        <div className="flex h-full flex-col justify-between bg-[var(--k)] p-[7%] text-white [container-type:inline-size]">
          <Mark size={22} />
          <div className="unb text-[5.2cqw] font-semibold leading-tight">{PHONE}<br /><span className="opacity-70">{CITY}</span></div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between p-[7%] [container-type:inline-size]">
          <div className="flex items-center gap-[4%]"><Mark size={20} /><span className="unb truncate text-[7.5cqw] font-bold leading-none tracking-[-0.03em]">{name}</span></div>
          <div className="flex items-end justify-between gap-2 text-[4.6cqw] leading-tight text-tx-2">
            <span>Типография<br />{CITY}</span>
            <span className="text-right">{PHONE}</span>
          </div>
        </div>
      )}
    </div>
  );
}
function SheetMock({ ratio = '1 / 1.414', finish = 'none', tone = 'c', children, className = '', style }: { ratio?: string; finish?: Finish; tone?: 'c' | 'm' | 'y' | 'k'; children?: ReactNode; className?: string; style?: CSSProperties }) {
  const bg = { c: 'var(--c)', m: 'var(--m)', y: 'var(--y)', k: 'var(--k)' }[tone];
  return (
    <div className={`mk mk-sheet ${finCls(finish)} ${className}`} style={{ aspectRatio: ratio, ...style }}>
      <div className="flex h-full flex-col [container-type:inline-size]">
        <div className="relative h-[46%] overflow-hidden" style={{ background: bg }}>
          <div className="absolute -bottom-[30%] -right-[18%] aspect-square w-[70%] rounded-full bg-white/25" />
          <div className="absolute -top-[25%] left-[10%] aspect-square w-[40%] rounded-full bg-black/10" />
        </div>
        <div className="flex flex-1 flex-col gap-[4%] p-[8%]">
          <div className="flex items-center gap-[4%]"><Mark size={12} /><span className={`unb truncate text-[8cqw] font-bold leading-none tracking-[-0.03em] ${finish === 'foil' ? 'foil' : ''}`}>{BRAND}</span></div>
          {children ?? (<><i className="block h-[5%] w-[85%] rounded bg-black/10" /><i className="block h-[5%] w-[70%] rounded bg-black/10" /><i className="block h-[5%] w-[78%] rounded bg-black/10" /></>)}
        </div>
      </div>
    </div>
  );
}
function BookletMock({ finish = 'none', className = '' }: { finish?: Finish; className?: string }) {
  return (
    <div className={`mk flex [perspective:900px] ${className}`}>
      <SheetMock ratio="1 / 2.05" tone="m" finish={finish} className="w-1/3 origin-right [transform:rotateY(22deg)]" />
      <SheetMock ratio="1 / 2.05" tone="c" finish={finish} className="w-1/3" />
      <SheetMock ratio="1 / 2.05" tone="y" finish={finish} className="w-1/3 origin-left [transform:rotateY(-22deg)]" />
    </div>
  );
}
function CatalogMock({ finish = 'none', className = '' }: { finish?: Finish; className?: string }) {
  return (
    <div className={`mk [perspective:1000px] ${className}`}>
      <div className="relative [transform:rotateY(-18deg)]" style={{ transformStyle: 'preserve-3d' }}>
        <SheetMock ratio="1 / 1.38" tone="k" finish={finish}>
          <span className="unb text-[6cqw] font-bold text-tx-2">Каталог 2027</span>
        </SheetMock>
        <div className="absolute inset-y-0 left-0 w-[4%] bg-black/25" />
      </div>
    </div>
  );
}
function StickerMock({ className = '', film = false }: { className?: string; film?: boolean }) {
  return (
    <div className={`mk aspect-square rounded-full bg-white shadow-[0_16px_34px_-16px_rgb(20_20_22/.5)] ${className}`}>
      <div className="absolute inset-[6%] grid place-items-center rounded-full text-center [container-type:inline-size]" style={{ background: film ? 'conic-gradient(from 200deg, var(--c), var(--m), var(--y), var(--c))' : 'var(--m)' }}>
        <div className="unb px-[10%] font-bold leading-[1.05] text-white" style={{ fontSize: `${Math.min(13, 92 / Math.max(6, BRAND.length))}cqw` }}>{BRAND}</div>
      </div>
    </div>
  );
}
function BagMock({ className = '', kraft = true, finish = 'none' }: { className?: string; kraft?: boolean; finish?: Finish }) {
  const paper = kraft ? '#c9a575' : '#fbfaf7';
  return (
    <div className={`mk ${className}`} style={{ aspectRatio: '1 / 1.12' }}>
      <svg viewBox="0 0 100 40" className="absolute inset-x-[22%] top-0 h-[22%] w-[56%] overflow-visible" aria-hidden="true">
        <path d="M5 40 C5 0 95 0 95 40" fill="none" stroke={kraft ? '#8b6a3e' : '#141416'} strokeWidth="5" />
      </svg>
      <div className="mk-bag absolute inset-0 grid place-items-center shadow-[0_20px_40px_-20px_rgb(20_20_22/.5)] [container-type:inline-size]" style={{ background: `linear-gradient(90deg, rgb(0 0 0 / .08), transparent 18%, transparent 82%, rgb(0 0 0 / .1)), ${paper}` }}>
        <div className="mt-[12%] flex flex-col items-center gap-[3cqw]">
          <Mark size={24} />
          <span className={`unb text-[10cqw] font-bold tracking-[-0.03em] ${finish === 'foil' ? 'foil' : ''}`} style={{ color: finish === 'foil' ? undefined : kraft ? '#3b2a14' : '#141416' }}>{BRAND}</span>
        </div>
      </div>
    </div>
  );
}
function Preview({ c }: { c: Calc }) {
  const [flip, setFlip] = useState(false);
  const f = PRODUCTS[c.p].finishes.includes(c.finish) ? c.finish : 'none';
  if (c.p === 'cards') {
    return (
      <div className="grid w-full place-items-center gap-5">
        <CardMock key={`${f}${c.paper}${flip}`} finish={f} paper={c.paper} back={flip && c.both} className="w-[min(100%,420px)]" style={{ transform: 'rotate(-4deg)' }} />
        {c.both && (
          <button type="button" className="ui-dim ui-focus text-[14px] font-semibold underline underline-offset-4" onClick={() => setFlip((x) => !x)}>
            {flip ? 'Показать лицо' : 'Показать оборот'}
          </button>
        )}
      </div>
    );
  }
  if (c.p === 'flyers') return <SheetMock tone="c" finish={f} className="w-[min(62%,260px)] -rotate-3" />;
  if (c.p === 'booklets') return <BookletMock finish={f} className="w-[min(100%,420px)]" />;
  if (c.p === 'catalogs') return <CatalogMock finish={f} className="w-[min(64%,280px)]" />;
  if (c.p === 'stickers') return <StickerMock film={c.paper === 1} className="w-[min(60%,240px)]" />;
  return <BagMock kraft={c.paper === 0} finish={f} className="w-[min(64%,280px)]" />;
}

/* ───────────── header / hero ───────────── */
function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="wrap flex h-[76px] items-center justify-between gap-4">
        <a href="#" className="ui-dim ui-focus flex min-w-0 items-center gap-3 text-tx no-underline" aria-label={`${BRAND}, наверх`}>
          <Mark size={22} />
          <span className="unb truncate text-[18px] font-bold tracking-[-0.02em]">{BRAND}</span>
        </a>
        <nav className="hidden items-center gap-7 text-[15px] font-semibold text-tx-2 md:flex" aria-label="Разделы">
          <a href="#calc" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Калькулятор</a>
          <a href="#products" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Продукция</a>
          <a href="#layout" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Макеты</a>
          <a href="#faq" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Вопросы</a>
        </nav>
        <a href="#order" className="btn btn-k ui-press ui-focus" style={{ height: 44, padding: '0 20px', fontSize: 15 }}>Заказать</a>
      </div>
    </header>
  );
}
function Hero() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const a = window.setTimeout(() => setOn(1), 250);
    const b = window.setTimeout(() => setOn(2), 2100);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);
  const title = 'Печатаем для бизнеса';
  return (
    <section className="relative overflow-hidden pb-16 pt-[110px] md:pb-24 md:pt-[140px]" aria-label="Главный экран">
      <div className="wrap grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="flex items-center gap-3"><span className="reg" aria-hidden="true" /><span className="lbl">Типография · {CITY}</span></div>
          <h1 className={`h1 press m-0 mt-6 ${on ? 'on' : ''} ${on === 2 ? 'done' : ''}`}>
            <span className="key">{title}</span>
            <span className="ink c" aria-hidden="true">{title}</span>
            <span className="ink m" aria-hidden="true">{title}</span>
            <span className="ink y" aria-hidden="true">{title}</span>
          </h1>
          <p className="lead mb-0 mt-6 max-w-[34rem]">Визитки за сутки, листовки, буклеты, каталоги, наклейки и пакеты с логотипом. Цену и срок видно сразу, макет проверим бесплатно.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#calc" className="btn btn-k ui-press ui-focus">Рассчитать тираж</a>
            <a href="#order" className="btn btn-l ui-press ui-focus">Загрузить макет</a>
          </div>
          <dl className="m-0 mt-10 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">
            {[['от 1 дня', 'визитки'], ['от 50 шт', 'тираж'], ['0 ₽', 'проверка макета']].map(([a, b]) => (
              <div key={b}><dt className="unb text-[clamp(17px,1.8vw,22px)] font-bold">{a}</dt><dd className="m-0 text-[14px] text-tx-3">{b}</dd></div>
            ))}
          </dl>
        </div>
        <div className="relative aspect-[1/0.86] w-full lg:col-span-6" aria-label={`Продукция с логотипом ${BRAND}`} role="img">
          <CatalogMock finish="soft" className="absolute left-[3%] top-[2%] w-[34%] -rotate-3" />
          <BagMock className="absolute right-[3%] top-0 w-[34%] rotate-2" />
          <SheetMock tone="m" className="absolute left-[38%] top-[16%] w-[22%] rotate-6" />
          <StickerMock className="absolute right-[6%] top-[47%] w-[19%]" />
          <CardMock back className="absolute bottom-[10%] right-[8%] w-[42%] rotate-[5deg]" />
          <CardMock finish="foil" paper={1} className="absolute bottom-[3%] left-[2%] w-[50%] -rotate-[4deg]" />
        </div>
      </div>
    </section>
  );
}

/* ───────────── calculator ───────────── */
function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="lbl mb-2.5 p-0">{label}</legend>
      <div className="seg">
        {options.map(([v, t]) => (
          <button key={String(v)} type="button" aria-pressed={v === value} className="ui-press ui-focus" onClick={() => onChange(v)}>{t}</button>
        ))}
      </div>
    </fieldset>
  );
}
function Calculator({ c, set }: { c: Calc; set: (p: Partial<Calc>) => void }) {
  const pr = PRODUCTS[c.p];
  const r = price(c);
  const finishes = pr.finishes;
  return (
    <section id="calc" className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="calc-title">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="calc-title" className="h2 m-0 lg:col-span-7">Цена тиража за минуту</h2>
          <p className="lead m-0 lg:col-span-5">Выберите продукцию и параметры. Цена и дата готовности пересчитываются сразу, менеджер подтвердит их после проверки макета.</p>
        </div>
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Продукция">
          {ORDER.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={c.p === p} className={`ui-press ui-focus h-[46px] shrink-0 rounded-full px-5 text-[15px] font-bold ${c.p === p ? 'bg-[var(--k)] text-white' : 'bg-paper text-tx-2 shadow-[inset_0_0_0_1px_var(--line)]'}`}
              onClick={() => set({ p, format: 0, paper: 0, qi: Math.min(c.qi, PRODUCTS[p].qty.length - 1), finish: PRODUCTS[p].finishes.includes(c.finish) ? c.finish : 'none' })}>
              {PRODUCTS[p].t}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="card grid min-h-[380px] place-items-center p-8 lg:col-span-5 lg:row-span-2" style={{ background: 'radial-gradient(80% 70% at 50% 40%, #fff, var(--paper))' }}>
            <Preview c={c} />
          </div>
          <div className="card grid gap-6 p-6 md:p-8 lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <Seg label="Формат" value={c.format} options={pr.formats.map(([t], i) => [i, t])} onChange={(format) => set({ format })} />
              <Seg label={c.p === 'bags' ? 'Материал' : 'Бумага'} value={c.paper} options={pr.papers.map(([t], i) => [i, t])} onChange={(paper) => set({ paper })} />
            </div>
            {pr.sides && <Seg label="Печать" value={c.both ? 1 : 0} options={[[0, 'Одна сторона'], [1, 'Две стороны']]} onChange={(v) => set({ both: v === 1 })} />}
            {finishes.length > 1 && <Seg label="Отделка" value={finishes.includes(c.finish) ? c.finish : 'none'} options={finishes.map((f) => [f, FINISH[f][0]])} onChange={(finish) => set({ finish })} />}
            {c.p === 'catalogs' && (
              <label className="grid gap-2.5">
                <span className="flex justify-between"><span className="lbl">Страниц</span><span className="font-bold">{c.pages}</span></span>
                <input type="range" min={8} max={64} step={4} value={c.pages} onChange={(e) => set({ pages: Number(e.target.value) })} />
              </label>
            )}
            <label className="grid gap-2.5">
              <span className="flex justify-between"><span className="lbl">Тираж</span><span className="font-bold">{r.qty.toLocaleString('ru-RU')} шт</span></span>
              <input type="range" min={0} max={pr.qty.length - 1} step={1} value={Math.min(c.qi, pr.qty.length - 1)} onChange={(e) => set({ qi: Number(e.target.value) })} aria-valuetext={`${r.qty} штук`} />
              <span className="flex justify-between text-[13px] text-tx-3"><span>{pr.qty[0].toLocaleString('ru-RU')}</span><span>{pr.qty[pr.qty.length - 1].toLocaleString('ru-RU')}</span></span>
            </label>
            <label className="flex items-center gap-3 text-[15px] font-semibold">
              <input type="checkbox" className="size-[18px]" checked={c.urgent} onChange={(e) => set({ urgent: e.target.checked })} />
              Срочно: в два раза быстрее, +50% к цене
            </label>
          </div>
          <div className="card grid gap-5 p-6 md:p-8 lg:col-span-7 sm:grid-cols-[1fr_auto] sm:items-end" aria-live="polite">
            <div>
              <div className="lbl">{pr.t}, {r.qty.toLocaleString('ru-RU')} шт</div>
              <div className="unb mt-2 text-[clamp(38px,5vw,58px)] font-bold leading-none tracking-[-0.04em]">{rub(r.total)}</div>
              <div className="mt-3 text-[15px] text-tx-2">{r.per < 10 ? `${r.per.toFixed(2).replace('.', ',')} ₽` : rub(r.per)} за штуку · готово <b className="text-tx">{r.ready}</b></div>
            </div>
            <a href="#order" className="btn btn-k ui-press ui-focus">Заказать тираж</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── products ───────────── */
const SHOWCASE: { p: P; d: string; mock: ReactNode }[] = [
  { p: 'cards', d: 'Мелованная и дизайнерская бумага, софт-тач, фольга.', mock: <CardMock finish="soft" className="w-[72%] -rotate-3" /> },
  { p: 'flyers', d: 'Для раздачи, почтовых ящиков и прилавка.', mock: <SheetMock tone="y" className="w-[38%] rotate-2" /> },
  { p: 'booklets', d: 'Прайс, меню, буклет о компании.', mock: <BookletMock className="w-[70%]" /> },
  { p: 'catalogs', d: 'На скобе или пружине, от 8 до 64 страниц.', mock: <CatalogMock finish="matte" className="w-[44%]" /> },
  { p: 'stickers', d: 'Бумага или плёнка, с контурной резкой.', mock: <StickerMock film className="w-[36%]" /> },
  { p: 'bags', d: 'Крафт и картон, логотип, фольга.', mock: <BagMock className="w-[40%]" /> },
];
function Products({ pick }: { pick: (p: P) => void }) {
  return (
    <section id="products" className="py-20 md:py-28" aria-labelledby="pr-title">
      <div className="wrap">
        <h2 id="pr-title" className="h2 m-0">Что печатаем</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.map(({ p, d, mock }) => (
            <article key={p} className="card group flex flex-col overflow-hidden">
              <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(70%_60%_at_50%_45%,#fff,var(--bg-2))] transition-transform duration-500 group-hover:scale-[1.02]">{mock}</div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="unb m-0 text-[22px] font-bold tracking-[-0.02em]">{PRODUCTS[p].t}</h3>
                <p className="mb-0 mt-2 text-[15px] text-tx-2">{d}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="font-bold">от {rub(minPrice(p))} за тираж</span>
                  <a href="#calc" className="ui-dim ui-focus text-[15px] font-bold underline underline-offset-4" onClick={() => pick(p)}>Рассчитать</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── layout requirements ───────────── */
const RULES: [string, string][] = [
  ['Цвета в CMYK', 'RGB с экрана после печати становится тусклее. Переведём сами и покажем разницу.'],
  ['Вылеты 2 мм', 'Фон и картинки заходят за край на 2 мм, текст не ближе 3 мм к обрезу.'],
  ['300 dpi', 'Фото и логотипы в разрешении 300 точек на дюйм, иначе будут видны пиксели.'],
  ['Шрифты в кривых', 'Или приложите файлы шрифтов. Подходят PDF, AI, CDR, EPS, PSD, TIFF.'],
];
function Layout() {
  return (
    <section id="layout" className="border-t border-[var(--line)] bg-[var(--k)] py-20 text-white md:py-28" aria-labelledby="lay-title">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="lay-title" className="h2 m-0">Макет проверим бесплатно</h2>
          <p className="mb-0 mt-5 text-[18px] text-white/70">Перед печатью дизайнер смотрит каждый файл. Если что-то не так, исправим и согласуем с вами. Нет макета? Сделаем дизайн с нуля от 1 500 ₽.</p>
        </div>
        <ol className="m-0 grid list-none gap-px overflow-hidden rounded-[20px] bg-white/15 p-0 sm:grid-cols-2 lg:col-span-7">
          {RULES.map(([t, d], i) => (
            <li key={t} className="bg-[var(--k)] p-6 md:p-7">
              <span className="unb text-[15px] font-bold" style={{ color: ['var(--c)', 'var(--m)', 'var(--y)', '#fff'][i] }}>0{i + 1}</span>
              <h3 className="unb m-0 mt-4 text-[20px] font-bold">{t}</h3>
              <p className="mb-0 mt-2 text-[15px] text-white/65">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── order with layout upload ───────────── */
const OK_EXT = /\.(pdf|ai|cdr|eps|psd|tiff?|jpe?g|png|zip|rar)$/i;
function Order({ c }: { c: Calc }) {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [over, setOver] = useState<'no' | 'ok' | 'bad'>('no');
  const [err, setErr] = useState('');
  const [phone, setPhone] = useState('');
  const [design, setDesign] = useState(false);
  const [st, setSt] = useState<LeadState>('idle');
  const input = useRef<HTMLInputElement>(null);
  const r = price(c);
  const add = (list: FileList | null) => {
    if (!list) return;
    let bad = '';
    const ok = Array.from(list).filter((f) => {
      if (!OK_EXT.test(f.name)) { bad = `«${f.name}»: такой формат не откроем. Нужен PDF, AI, CDR, EPS, PSD, TIFF, JPG, PNG или архив.`; return false; }
      if (f.size > 200 * 1024 * 1024) { bad = `«${f.name}» больше 200 МБ: пришлите ссылку на облако в комментарии.`; return false; }
      return true;
    });
    setErr(bad);
    setFiles((s) => [...s, ...ok.map((f) => ({ name: f.name, size: f.size }))].slice(0, 10));
  };
  const dragType = (e: React.DragEvent) => {
    const items = Array.from(e.dataTransfer.items || []);
    return items.length && items.every((i) => i.kind === 'file') ? 'ok' : 'bad';
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (st === 'pending') return;
    setSt('pending');
    try { await fakeSubmit(phone); setSt('done'); } catch { setSt('error'); }
  };
  return (
    <section id="order" className="py-20 md:py-28" aria-labelledby="ord-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="ord-title" className="h2 m-0">Оформить заказ</h2>
          <p className="lead mt-5">Загрузите макет и оставьте телефон. Менеджер перезвонит в течение 15 минут в рабочее время, подтвердит цену и срок.</p>
          <div className="card mt-8 p-6">
            <div className="lbl">Ваш расчёт</div>
            <div className="mt-2 font-bold">{PRODUCTS[c.p].t}, {r.qty.toLocaleString('ru-RU')} шт · {PRODUCTS[c.p].formats[c.format][0]}</div>
            <div className="unb mt-1 text-[28px] font-bold tracking-[-0.03em]">{rub(r.total)}</div>
            <a href="#calc" className="ui-dim ui-focus mt-2 inline-block text-[14px] font-semibold underline underline-offset-4">Изменить</a>
          </div>
        </div>
        <form className="lg:col-span-7" onSubmit={submit} noValidate>
          {st === 'done' ? (
            <div className="card p-8" role="status">
              <div className="unb text-[26px] font-bold">Заказ принят</div>
              <p className="mb-0 mt-2 text-tx-2">Это демо-сайт студии TURCH: файлы и телефон никуда не отправились. На вашем сайте заявка с макетом сразу придёт вам.</p>
            </div>
          ) : (
            <>
              <div
                className="drop grid min-h-[220px] place-items-center p-6 text-center"
                data-over={over === 'ok'}
                data-reject={over === 'bad'}
                onDragEnter={(e) => { e.preventDefault(); setOver(dragType(e)); }}
                onDragOver={(e) => { e.preventDefault(); setOver(dragType(e)); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver('no'); }}
                onDrop={(e) => { e.preventDefault(); setOver('no'); add(e.dataTransfer.files); }}
              >
                <div>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M12 18v-6M9 15l3-3 3 3" /></svg>
                  <p className="m-0 mt-3 text-[17px] font-bold">
                    {over === 'bad' ? 'Сюда можно только файлы' : over === 'ok' ? 'Отпустите, чтобы добавить' : <><span className="hidden md:inline">Перетащите макет сюда или </span><span className="md:hidden">Добавьте макет: </span></>}
                    {over === 'no' && <button type="button" className="ui-dim ui-focus font-bold text-m underline underline-offset-4" onClick={() => input.current?.click()}>выберите файл</button>}
                  </p>
                  <p className="m-0 mt-1 text-[14px] text-tx-3">PDF, AI, CDR, EPS, PSD, TIFF, JPG, PNG или архив, до 200 МБ</p>
                  <input ref={input} type="file" multiple className="sr-only" tabIndex={-1} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
                </div>
              </div>
              {err && <p className="m-0 mt-3 text-[14px] text-[#d1243a]" role="alert">{err}</p>}
              {files.length > 0 && (
                <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                  {files.map((f, k) => (
                    <li key={f.name + k} className="flex items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3 text-[15px] shadow-[inset_0_0_0_1px_var(--line)]">
                      <span className="truncate font-semibold">{f.name}</span>
                      <span className="flex shrink-0 items-center gap-3 text-tx-3">
                        {(f.size / 1024 / 1024).toFixed(1).replace('.', ',')} МБ
                        <button type="button" aria-label={`Убрать ${f.name}`} className="ui-press ui-focus grid h-7 w-7 place-items-center rounded-full bg-black/5 text-tx" onClick={() => setFiles((s) => s.filter((_, i) => i !== k))}>×</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <label className="mt-4 flex items-center gap-3 text-[15px] font-semibold">
                <input type="checkbox" className="size-[18px]" checked={design} onChange={(e) => setDesign(e.target.checked)} />
                Макета нет, нужен дизайн (от 1 500 ₽)
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="tp" className="sr-only">Телефон</label>
                <input id="tp" className="field" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'tp-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
                <button type="submit" className="btn btn-k ui-press ui-focus" aria-busy={st === 'pending'}>{st === 'pending' ? 'Отправляем…' : 'Отправить заказ'}</button>
              </div>
              {st === 'error' && <p id="tp-e" className="m-0 mt-2 text-[14px] text-[#d1243a]">Нужно 10 цифр после +7.</p>}
            </>
          )}
        </form>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ['Можно увидеть, как будет выглядеть, до печати?', 'Да. Пришлём цифровую цветопробу или напечатаем пробный экземпляр. Тираж запускаем только после вашего «да».'],
  ['Сколько стоит доставка?', `По ${CITY.includes(' ') ? 'городу' : `городу ${CITY}`} доставка бесплатно от 5 000 ₽, в другие города отправляем СДЭК. Самовывоз из типографии.`],
  ['Работаете с юрлицами?', 'Да, по счёту с НДС или без. Закрывающие документы через ЭДО или с курьером.'],
  ['Что если цвет не совпадёт?', 'Если тираж не совпал с утверждённой цветопробой, перепечатаем за свой счёт.'],
];
function Faq() {
  return (
    <section id="faq" className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="faq-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <h2 id="faq-title" className="h2 m-0 lg:col-span-4">Частые вопросы</h2>
        <div className="border-t border-[var(--line)] lg:col-span-8">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq border-b border-[var(--line)]">
              <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[18px] font-bold">
                {q}
                <span aria-hidden="true" className="plus text-[26px] font-normal text-m">+</span>
              </summary>
              <p className="m-0 pb-6 text-tx-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10 pb-24 text-[14px] text-tx-3">
      <div className="wrap flex flex-col gap-2 md:flex-row md:justify-between">
        <span><span className="unb font-bold text-tx">{BRAND}</span> · типография · {CITY} · пн–сб 9:00–19:00</span>
        <a href="tel:+79000000000" className="ui-dim ui-focus font-semibold text-tx no-underline">{PHONE}</a>
      </div>
    </footer>
  );
}

export default function App() {
  const [c, setC] = useState<Calc>(DEFAULT);
  const set = (p: Partial<Calc>) => setC((x) => ({ ...x, ...p }));
  useMemo(() => { document.title = `${BRAND} — типография: визитки, буклеты, каталоги, пакеты`; }, []);
  return (
    <>
      <Header />
      <Hero />
      <main>
        <Calculator c={c} set={set} />
        <Products pick={(p) => set({ p, format: 0, paper: 0, finish: PRODUCTS[p].finishes.includes(c.finish) ? c.finish : 'none' })} />
        <Layout />
        <Order c={c} />
        <Faq />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="light" />}
    </>
  );
}
