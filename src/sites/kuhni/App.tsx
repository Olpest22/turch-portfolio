import { useMemo, useState, type FormEvent } from 'react';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED } from '@/shared/brand';
import { BASE } from '@/lib/base';

const BRAND = brandOr('Ольха');
const CITY = cityOr('Москва и область');
const IMG = (n: string) => `${BASE}img/kuhni/${n}.webp`;
const MD = (n: string) => `${BASE}img/kuhni/${n}-md.webp`;
const PHONE = '+7 (900) 000-00-00';

/* ───────────── constructor data ───────────── */
type Layout = 'line' | 'corner' | 'u' | 'island';
const LAYOUTS: [Layout, string, number][] = [
  ['line', 'Прямая', 0],
  ['corner', 'Угловая', 1.6],
  ['u', 'П-образная', 3.2],
  ['island', 'С островом', 1.8],
];
const FACADES = [
  { id: 'enamel', name: 'Эмаль, белая', fill: '#f3f0ea', price: 42000, dark: false },
  { id: 'sage', name: 'Эмаль, шалфей', fill: '#9aa58a', price: 45000, dark: false },
  { id: 'graphite', name: 'Эмаль, графит', fill: '#3d3f42', price: 44000, dark: true },
  { id: 'oak', name: 'Шпон дуба', fill: 'url(#oak)', price: 52000, dark: false, sw: 'repeating-linear-gradient(95deg,#c9a57c 0 3px,#bf9a70 3px 7px)' },
  { id: 'walnut', name: 'Шпон ореха', fill: 'url(#walnut)', price: 58000, dark: true, sw: 'repeating-linear-gradient(95deg,#6e4a33 0 3px,#5d3d2a 3px 7px)' },
];
const TOPS = [
  { id: 'quartz', name: 'Кварц', fill: 'url(#quartz)', price: 14000, sw: '#ece8e2' },
  { id: 'stone', name: 'Тёмный камень', fill: '#2b2b2c', price: 18000, sw: '#2b2b2c' },
  { id: 'wood', name: 'Массив дуба', fill: 'url(#oak)', price: 9000, sw: 'repeating-linear-gradient(95deg,#c9a57c 0 3px,#bf9a70 3px 7px)' },
];

function Patterns() {
  return (
    <defs>
      <pattern id="oak" width="14" height="40" patternUnits="userSpaceOnUse">
        <rect width="14" height="40" fill="#c9a57c" />
        <path d="M3 0v40M9 0c1 10-1 20 0 40" stroke="#b48d63" strokeWidth="1.4" fill="none" opacity=".7" />
      </pattern>
      <pattern id="walnut" width="14" height="40" patternUnits="userSpaceOnUse">
        <rect width="14" height="40" fill="#6b4731" />
        <path d="M4 0c1 12-1 24 0 40M10 0v40" stroke="#57392a" strokeWidth="1.6" fill="none" opacity=".8" />
      </pattern>
      <pattern id="quartz" width="22" height="10" patternUnits="userSpaceOnUse">
        <rect width="22" height="10" fill="#ece8e2" />
        <circle cx="4" cy="3" r=".9" fill="#b9b2a8" />
        <circle cx="15" cy="7" r=".7" fill="#a79f94" />
      </pattern>
      <linearGradient id="led" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd9a0" stopOpacity=".95" />
        <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* Front elevation of the main wall. */
function Elevation({ len, layout, facade, top, led, tall }: { len: number; layout: Layout; facade: (typeof FACADES)[number]; top: (typeof TOPS)[number]; led: boolean; tall: boolean }) {
  const W = 150 + ((len - 1.8) / 3.2) * 400;
  const x0 = (640 - W) / 2;
  const n = Math.max(3, Math.round(len / 0.6));
  const mw = W / n;
  const handle = facade.dark ? '#c9a35b' : '#3a3a3a';
  const hood = Math.min(n - 1, 1);
  const sink = Math.max(0, n - 2);
  const upTop = tall ? 26 : 72;
  const side = layout === 'corner' || layout === 'u';
  return (
    <svg viewBox="0 0 640 360" className="kit h-auto w-full" role="img" aria-label={`Кухня ${LAYOUTS.find((l) => l[0] === layout)![1].toLowerCase()}, длина ${len.toFixed(1)} м, фасады: ${facade.name}, столешница: ${top.name}`}>
      <Patterns />
      <rect width="640" height="360" fill="#f6f1ea" />
      <rect y="330" width="640" height="30" fill="#d8ccbb" />
      {/* side returns for corner and U layouts, drawn in shade as if turning towards the viewer */}
      {side && (
        <g opacity=".78">
          <path d={`M${x0 - 46} 230 L${x0} 222 L${x0} 330 L${x0 - 46} 338 Z`} fill={facade.fill} stroke="#00000022" />
          <path d={`M${x0 - 46} 222 L${x0} 212 L${x0} 222 L${x0 - 46} 232 Z`} fill={top.fill} />
        </g>
      )}
      {layout === 'u' && (
        <g opacity=".78">
          <path d={`M${x0 + W + 46} 230 L${x0 + W} 222 L${x0 + W} 330 L${x0 + W + 46} 338 Z`} fill={facade.fill} stroke="#00000022" />
          <path d={`M${x0 + W + 46} 222 L${x0 + W} 212 L${x0 + W} 222 L${x0 + W + 46} 232 Z`} fill={top.fill} />
        </g>
      )}
      {/* uppers */}
      {Array.from({ length: n }).map((_, i) =>
        i === hood ? (
          <g key={'u' + i}>
            <path d={`M${x0 + i * mw + mw * 0.32} ${upTop} h${mw * 0.36} v${118 - upTop} h${mw * 0.18} l-6 30 h${-mw * 0.72 + 12} l-6 -30 h${mw * 0.18} Z`} fill="#c7c9cc" stroke="#9fa3a8" />
          </g>
        ) : (
          <g key={'u' + i}>
            <rect x={x0 + i * mw + 1.5} y={upTop} width={mw - 3} height={160 - upTop} rx="2" fill={facade.fill} stroke="#00000026" />
            <rect x={x0 + i * mw + mw / 2 - 9} y={150} width="18" height="3" rx="1.5" fill={handle} />
          </g>
        ),
      )}
      {led && <rect x={x0 + 4} y="160" width={W - 8} height="34" fill="url(#led)" />}
      {/* countertop */}
      <rect x={x0 - 4} y="212" width={W + 8} height="11" rx="2" fill={top.fill} stroke="#00000030" />
      {/* cooktop and sink */}
      <rect x={x0 + hood * mw + mw * 0.16} y="209" width={mw * 0.68} height="4" rx="1" fill="#1d1d1f" />
      <path d={`M${x0 + sink * mw + mw * 0.22} 212 q${mw * 0.28} 8 ${mw * 0.56} 0`} fill="none" stroke="#8d8f93" strokeWidth="2" />
      <path d={`M${x0 + sink * mw + mw * 0.5} 212 v-22 q0 -7 8 -7 h6`} fill="none" stroke="#8d8f93" strokeWidth="3" strokeLinecap="round" />
      {/* lowers */}
      {Array.from({ length: n }).map((_, i) => (
        <g key={'l' + i}>
          <rect x={x0 + i * mw + 1.5} y="224" width={mw - 3} height="94" rx="2" fill={facade.fill} stroke="#00000026" />
          {i === 0 ? (
            [0, 1, 2].map((k) => <line key={k} x1={x0 + 3} x2={x0 + mw - 3} y1={224 + 31 * (k + 1)} y2={224 + 31 * (k + 1)} stroke="#00000030" />)
          ) : null}
          {i === 0 ? (
            [0, 1, 2].map((k) => <rect key={'h' + k} x={x0 + mw / 2 - 10} y={236 + 31 * k} width="20" height="3" rx="1.5" fill={handle} />)
          ) : (
            <rect x={x0 + i * mw + mw / 2 - 10} y="232" width="20" height="3" rx="1.5" fill={handle} />
          )}
        </g>
      ))}
      <rect x={x0} y="318" width={W} height="12" fill="#2a2522" />
      {/* island in front */}
      {layout === 'island' && (
        <g>
          <rect x={320 - W * 0.28} y="262" width={W * 0.56} height="9" rx="2" fill={top.fill} stroke="#00000030" />
          <rect x={320 - W * 0.27} y="271" width={W * 0.54} height="59" fill={facade.fill} stroke="#00000030" />
          <rect x={320 - W * 0.27} y="328" width={W * 0.54} height="6" fill="#2a2522" />
        </g>
      )}
      {/* dimension */}
      <g fill="#8a8075" fontFamily="IBM Plex Sans" fontSize="13">
        <path d={`M${x0} 346 H${x0 + W}`} stroke="#8a8075" />
        <path d={`M${x0} 340 v12 M${x0 + W} 340 v12`} stroke="#8a8075" />
        <text x="320" y="342" textAnchor="middle" fill="#5e554b" style={{ paintOrder: 'stroke' }} stroke="#d8ccbb" strokeWidth="5">{len.toFixed(1).replace('.', ',')} м</text>
      </g>
    </svg>
  );
}

function Plan({ layout, active }: { layout: Layout; active?: boolean }) {
  const c = active ? '#56603b' : '#8a8075';
  return (
    <svg viewBox="0 0 60 44" width="60" height="44" aria-hidden="true">
      <rect x="2" y="2" width="56" height="40" rx="3" fill="none" stroke="#cbbfaf" />
      <rect x="6" y="6" width="48" height="8" rx="1.5" fill={c} />
      {(layout === 'corner' || layout === 'u') && <rect x="6" y="6" width="8" height="32" rx="1.5" fill={c} />}
      {layout === 'u' && <rect x="46" y="6" width="8" height="32" rx="1.5" fill={c} />}
      {layout === 'island' && <rect x="18" y="26" width="24" height="9" rx="1.5" fill={c} />}
    </svg>
  );
}

function Builder() {
  const [layout, setLayout] = useState<Layout>('corner');
  const [len, setLen] = useState(3.2);
  const [facade, setFacade] = useState(FACADES[1]);
  const [top, setTop] = useState(TOPS[0]);
  const [led, setLed] = useState(true);
  const [tall, setTall] = useState(false);
  const run = len + LAYOUTS.find((l) => l[0] === layout)![2];
  const price = useMemo(() => {
    let p = run * facade.price * (tall ? 1.12 : 1) + run * top.price + (led ? 18000 : 0);
    if (layout === 'island') p += 1.8 * top.price * 0.6;
    return Math.round(p / 1000) * 1000;
  }, [run, facade, top, led, tall, layout]);
  return (
    <section id="build" className="py-20 md:py-28" aria-labelledby="build-title">
      <div className="wrap">
        <div className="grid gap-5 md:grid-cols-12 md:items-end">
          <h2 id="build-title" className="h2 m-0 md:col-span-7">Соберите кухню и узнайте цену</h2>
          <p className="lead m-0 md:col-span-5">Планировка, длина стены, фасады и столешница. Дизайнер доработает проект в 3D после бесплатного замера.</p>
        </div>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
          <div className="min-w-0 overflow-hidden rounded-[22px] bg-card p-3 md:p-6 lg:col-span-7" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <Elevation len={len} layout={layout} facade={facade} top={top} led={led} tall={tall} />
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-4 text-[14px] text-ink-2">
              <span>Погонных метров: {run.toFixed(1).replace('.', ',')}</span>
              <span>{facade.name} · {top.name.toLowerCase()}</span>
            </div>
          </div>
          <div className="rounded-[22px] bg-card p-6 md:p-8 lg:col-span-5" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <div className="cap">Планировка</div>
            <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Планировка">
              {LAYOUTS.map(([id, t]) => (
                <button key={id} type="button" role="radio" aria-checked={layout === id} onClick={() => setLayout(id)} className="opt ui-press ui-focus flex flex-col items-center gap-1.5 px-1 py-2.5 text-[13px]">
                  <Plan layout={id} active={layout === id} />
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-baseline justify-between">
              <label htmlFor="len" className="cap">Длина основной стены</label>
              <span className="font-semibold tabular-nums">{len.toFixed(1).replace('.', ',')} м</span>
            </div>
            <input id="len" className="rng" type="range" min={1.8} max={5} step={0.1} value={len} onChange={(e) => setLen(+e.target.value)} style={{ ['--p' as string]: `${((len - 1.8) / 3.2) * 100}%` }} />
            <div className="cap mt-5">Фасады · {facade.name.toLowerCase()}</div>
            <div className="mt-2 flex flex-wrap gap-3" role="radiogroup" aria-label="Фасады">
              {FACADES.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={facade.id === f.id} aria-label={f.name} title={f.name} onClick={() => setFacade(f)} className="sw ui-press ui-focus" style={{ background: f.sw || f.fill }} />
              ))}
            </div>
            <div className="cap mt-5">Столешница</div>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Столешница">
              {TOPS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={top.id === t.id} onClick={() => setTop(t)} className="opt ui-press ui-focus flex items-center gap-2 px-3 py-2.5">
                  <span aria-hidden="true" className="h-4 w-4 rounded-full" style={{ background: t.sw, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / .15)' }} />
                  {t.name}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                ['Подсветка рабочей зоны', led, setLed],
                ['Шкафы до потолка', tall, setTall],
              ].map(([t, v, set]) => (
                <button key={t as string} type="button" role="checkbox" aria-checked={v as boolean} onClick={() => (set as (b: boolean) => void)(!(v as boolean))} className="opt ui-press ui-focus flex items-center gap-3 px-3 py-3 text-left text-[14px]">
                  <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-[6px]" style={{ background: v ? 'var(--olive)' : '#fff', boxShadow: v ? 'none' : 'inset 0 0 0 1.5px var(--line)' }}>
                    {(v as boolean) && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5 5 9l5-6" stroke="#fff" strokeWidth="2" fill="none" /></svg>}
                  </span>
                  {t as string}
                </button>
              ))}
            </div>
            <div className="mt-7 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-6">
              <div>
                <div className="cap">С монтажом, без техники</div>
                <div className="mt-1 font-serif text-[40px] font-semibold leading-none tracking-[-0.02em] tabular-nums" aria-live="polite">{rub(price)}</div>
              </div>
              <div className="text-right text-[14px] text-ink-2">25–35 дней</div>
            </div>
            <a href="#lead" className="btn btn-a ui-press ui-press--on-dark ui-focus mt-6 w-full">Получить 3D-проект бесплатно</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── page sections ───────────── */
function Hero() {
  return (
    <section className="relative" aria-label="Главный экран">
      <header className="wrap flex h-[76px] items-center justify-between gap-4">
        <a href="#" className="ui-dim ui-focus flex min-w-0 items-center gap-2.5 text-ink no-underline" aria-label={`${BRAND}, наверх`}>
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#56603b" /><path d="M16 7c5 4 5 13 0 18-5-5-5-14 0-18z" fill="#efe9df" /></svg>
          <span className="truncate font-serif text-[22px] font-semibold">{BRAND}</span>
        </a>
        <nav className="hidden items-center gap-7 text-[15px] text-ink-2 md:flex" aria-label="Разделы">
          <a className="ui-dim ui-focus text-inherit no-underline hover:text-ink" href="#build">Конструктор</a>
          <a className="ui-dim ui-focus text-inherit no-underline hover:text-ink" href="#styles">Стили</a>
          <a className="ui-dim ui-focus text-inherit no-underline hover:text-ink" href="#works">Работы</a>
          <a className="ui-dim ui-focus text-inherit no-underline hover:text-ink" href="#faq">Вопросы</a>
        </nav>
        <a href="#lead" className="btn btn-a ui-press ui-press--on-dark ui-focus" style={{ height: 44, padding: '0 18px', fontSize: 15 }}>Замер</a>
      </header>
      <div className="wrap grid items-center gap-10 pb-14 pt-6 lg:grid-cols-12 lg:pb-20">
        <div className="lg:col-span-5">
          <h1 className="h1 m-0">Кухня, которую не захочется менять</h1>
          <p className="lead mb-0 mt-6 max-w-[30rem]">Проектируем под размеры комнаты и ваши привычки, делаем в своём цехе и собираем за один день.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#build" className="btn btn-a ui-press ui-press--on-dark ui-focus">Собрать кухню</a>
            <a href="#lead" className="btn btn-b ui-press ui-focus">Записаться на замер</a>
          </div>
        </div>
        <div className="relative lg:col-span-7">
          <div className="overflow-hidden rounded-[28px]" style={{ aspectRatio: '4 / 3' }}>
            <img src={IMG('hero')} alt="Кухня с островом, деревянные фасады и тёплая подсветка" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-[16px] bg-card px-4 py-3 shadow-[0_20px_40px_-20px_rgb(0_0_0_/_.35)]">
            {['#9aa58a', '#3d3f42', 'repeating-linear-gradient(95deg,#c9a57c 0 3px,#bf9a70 3px 7px)', '#f3f0ea'].map((c) => (
              <span key={c} aria-hidden="true" className="h-8 w-8 rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / .12)' }} />
            ))}
            <span className="pl-1 text-[14px] text-ink-2">40+ цветов фасадов</span>
          </div>
        </div>
      </div>
      <div className="border-y border-[var(--line)] bg-bg-2">
        <div className="wrap grid grid-cols-2 gap-y-3 py-5 text-[15px] md:grid-cols-4">
          <span>3D-проект за 2 дня</span>
          <span>Своё производство</span>
          <span>Монтаж за 1 день</span>
          <span>Гарантия 3 года</span>
        </div>
      </div>
    </section>
  );
}

const STYLES = [
  { img: 'minimal', t: 'Современная', d: 'Шпон, скрытые ручки, техника в колоннах' },
  { img: 'black', t: 'Тёмная', d: 'Графит, камень и мягкая подсветка' },
  { img: 'white', t: 'Светлая', d: 'Белая эмаль, остров и много света' },
  { img: 'farm', t: 'Неоклассика', d: 'Фрезерованные фасады и открытые полки' },
];
function Styles() {
  return (
    <section id="styles" className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="st-title">
      <div className="wrap">
        <h2 id="st-title" className="h2 m-0 max-w-[16ch]">Под любой интерьер</h2>
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STYLES.map((s) => (
            <article key={s.t} className="style-card">
              <div className="overflow-hidden rounded-[18px]" style={{ aspectRatio: '3 / 4' }}>
                <img src={MD(s.img)} alt={`Кухня в стиле «${s.t}»`} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <h3 className="h3 m-0 mt-4 text-[21px]">{s.t}</h3>
              <p className="mb-0 mt-1 text-[15px] text-ink-2">{s.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Works() {
  const items: [string, string, string][] = [
    ['walnut', 'Кухня-гостиная из ореха', '4,2 м · остров'],
    ['marble', 'Светлая кухня с островом', '5,1 м · кварц'],
    ['blue', 'Кухня с открытыми полками', '3,4 м · угловая'],
  ];
  return (
    <section id="works" className="py-20 md:py-28" aria-labelledby="w-title">
      <div className="wrap">
        <h2 id="w-title" className="h2 m-0">Кухни, которые мы собрали</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map(([img, t, m], k) => (
            <figure key={img} className={`m-0 ${k === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
              <div className="overflow-hidden rounded-[20px]" style={{ aspectRatio: k === 0 ? '4 / 3' : '4 / 3' }}>
                <img src={k === 0 ? IMG(img) : MD(img)} alt={t} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-medium">{t}</span>
                <span className="cap shrink-0">{m}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ['Замер', 'Дизайнер приезжает с образцами фасадов и столешниц.'],
  ['3D-проект за 2 дня', 'Показываем кухню в вашей комнате и фиксируем цену.'],
  ['Производство', 'Изготавливаем в своём цехе за 25–35 дней.'],
  ['Монтаж за день', 'Собираем, подключаем технику и убираем за собой.'],
];
function Process() {
  return (
    <section className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="p-title">
      <div className="wrap">
        <h2 id="p-title" className="h2 m-0">Как появится ваша кухня</h2>
        <ol className="m-0 mt-12 grid list-none gap-8 p-0 md:grid-cols-4">
          {STEPS.map(([t, d], k) => (
            <li key={t} className="border-t-2 pt-5" style={{ borderColor: k === 0 ? 'var(--olive)' : 'var(--line)' }}>
              <div className="font-serif text-[15px] text-olive">Шаг {k + 1}</div>
              <h3 className="h3 m-0 mt-2 text-[22px]">{t}</h3>
              <p className="mb-0 mt-2 text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ['Входит ли техника в цену?', 'Нет, считаем корпус, фасады, столешницу и монтаж. Технику можем подобрать и встроить — по вашему списку.'],
  ['Сколько стоит замер?', 'Бесплатно. Дизайнер приедет с образцами и сделает 3D-проект за 2 дня.'],
  ['Какая фурнитура?', 'Петли и ящики с доводчиками, держат до 50 кг. Гарантия на всю кухню — 3 года.'],
  ['Можно ли в рассрочку?', 'Да, без переплаты на 6 месяцев через банк-партнёр.'],
];
function Lead() {
  const [st, setSt] = useState<LeadState>('idle');
  const [phone, setPhone] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (st === 'pending') return;
    setSt('pending');
    try {
      await fakeSubmit(phone);
      setSt('done');
    } catch {
      setSt('error');
    }
  };
  return (
    <section id="faq" className="border-t border-[var(--line)] py-20 md:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 className="h2 m-0">Частые вопросы</h2>
          <div className="mt-8 border-t border-[var(--line)]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq border-b border-[var(--line)]">
                <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[18px] font-semibold">
                  {q}
                  <span aria-hidden="true" className="plus text-[26px] font-normal text-olive">+</span>
                </summary>
                <p className="m-0 pb-6 text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="lead" className="lg:col-span-6">
          <div className="rounded-[24px] bg-card p-7 md:p-10" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <h2 className="h2 m-0">Бесплатный замер и 3D-проект</h2>
            <p className="lead mt-4">Оставьте телефон — дизайнер позвонит, договорится о времени и привезёт образцы.</p>
            {st === 'done' ? (
              <div className="mt-8 rounded-2xl bg-white p-6" style={{ boxShadow: 'inset 0 0 0 1.5px var(--olive)' }} role="status">
                <div className="h3 m-0">Заявка принята</div>
                <p className="mb-0 mt-2 text-ink-2">Это демо-сайт студии TURCH: заявка никуда не отправилась. На вашем сайте она придёт в Telegram.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-8 grid gap-3">
                <label htmlFor="kh" className="sr-only">Телефон</label>
                <input id="kh" className="field" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'kh-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
                {st === 'error' && <p id="kh-e" className="m-0 text-[14px] text-[#b3261e]">Нужно 10 цифр после +7.</p>}
                <button type="submit" className="btn btn-a ui-press ui-press--on-dark ui-focus w-full" aria-busy={st === 'pending'}>{st === 'pending' ? 'Отправляем…' : 'Записаться на замер'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10 pb-24 text-[14px] text-ink-3">
      <div className="wrap flex flex-col gap-2 md:flex-row md:justify-between">
        <span><span className="font-serif font-semibold text-ink">{BRAND}</span> · кухни на заказ · {CITY}</span>
        <a href="tel:+79000000000" className="ui-dim ui-focus text-ink no-underline">{PHONE}</a>
      </div>
    </footer>
  );
}

export default function App() {
  useMemo(() => {
    document.title = `${BRAND} — кухни на заказ по вашим размерам`;
  }, []);
  return (
    <>
      <Hero />
      <main>
        <Builder />
        <Styles />
        <Works />
        <Process />
        <Lead />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="light" />}
    </>
  );
}
