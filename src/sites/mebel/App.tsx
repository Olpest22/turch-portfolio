import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Masonry from '@/shared/rb/Masonry';
import Magnet from '@/shared/rb/Magnet';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED, imgOr, phoneOr, telOf } from '@/shared/brand';
import { PitchLogo } from '@/shared/PitchLogo';
import { BASE } from '@/lib/base';

const BRAND = brandOr('Форма и шпон');
const CITY = cityOr('Москва и область');

const IMG = (n: string) => imgOr(n, `${BASE}img/mebel/${n}.webp`);
const MD = (n: string) => imgOr(n, `${BASE}img/mebel/${n}-md.webp`);
const PHONE = phoneOr('+7 (900) 000-00-00');
const TEL = telOf(PHONE);

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M3 3h22v6H10v4h12v6H10v6H3z" fill="#1a1a1a" />
    </svg>
  );
}

/* ───────────── navbar + drawer (Custom Spaces) ───────────── */
const MENU: [string, string][] = [
  ['Комнаты', '#rooms'],
  ['Конфигуратор', '#config'],
  ['Материалы', '#materials'],
  ['Работы', '#works'],
  ['Шоурум', '#showroom'],
];
function Nav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
    };
  }, [open]);
  const ease = 'cubic-bezier(0.16,1,0.3,1)';
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/95 px-4 py-4 sm:px-6 sm:py-5 md:px-10" aria-label="Главное меню">
        <a href="#" className="ui-dim ui-focus flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em] text-ink no-underline" aria-label={`${BRAND}, наверх`}>
          <PitchLogo><Logo /></PitchLogo>
          <span className="block max-w-[34vw] truncate sm:max-w-none">{BRAND}</span>
        </a>
        <button type="button" aria-label="Открыть меню" aria-expanded={open} onClick={() => setOpen(true)} className="group ui-press ui-focus absolute left-1/2 flex h-10 w-10 -translate-x-1/2 flex-col items-center justify-center gap-[5px] rounded-full">
          <span className="h-[1.5px] w-6 rounded-full bg-neutral-900 transition-all duration-300 group-hover:w-5" />
          <span className="h-[1.5px] w-6 rounded-full bg-neutral-900 transition-all duration-300 group-hover:w-5" />
        </button>
        <a href="#showroom" className="pill ui-press ui-press--on-dark ui-focus hidden sm:inline-flex" style={{ height: 42, fontSize: 14 }}>Записаться в шоурум</a>
        <span className="w-7 sm:hidden" />
      </nav>
      <div onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: `opacity 500ms ${ease}` }} />
      <aside
        aria-hidden={!open}
        inert={!open}
        className="fixed inset-0 z-[70] flex flex-col bg-white p-6 sm:left-auto sm:w-full sm:max-w-sm"
        style={{ opacity: open ? 1 : 0, transform: open ? 'none' : typeof window !== 'undefined' && window.innerWidth >= 640 ? 'translateX(100%)' : 'translateY(100%)', transition: `opacity 500ms ${ease}, transform 500ms ${ease}` }}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} className="ui-press ui-focus relative h-10 w-10 rounded-full hover:bg-neutral-100">
            <span className="absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 rounded-full bg-neutral-900" style={{ transform: `translate(-50%,-50%) rotate(${open ? 45 : 0}deg) translateY(${open ? 0 : -3}px)`, transition: `transform 500ms ${ease}` }} />
            <span className="absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 rounded-full bg-neutral-900" style={{ transform: `translate(-50%,-50%) rotate(${open ? -45 : 0}deg) translateY(${open ? 0 : 3}px)`, transition: `transform 500ms ${ease}` }} />
          </button>
        </div>
        <ul className="mt-12 flex-1">
          {MENU.map(([t, h], i) => (
            <li key={t}>
              <a href={h} onClick={() => setOpen(false)} className="drawer-link ui-dim ui-focus block py-3 text-3xl font-medium tracking-[-0.03em] text-neutral-900 no-underline hover:text-neutral-500" style={{ opacity: open ? 1 : 0, transform: open ? 'none' : 'translateX(32px)', transitionDelay: open ? `${150 + i * 60}ms` : '0ms' }}>
                {t}
              </a>
            </li>
          ))}
        </ul>
        <a href="#showroom" onClick={() => setOpen(false)} className="pill ui-press ui-press--on-dark ui-focus self-start" style={{ opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(16px)', transition: `opacity 500ms ${ease} ${open ? 400 : 0}ms, transform 500ms ${ease} ${open ? 400 : 0}ms` }}>
          Записаться в шоурум
        </a>
      </aside>
    </>
  );
}

/* ───────────── hero + inertial marquee (Custom Spaces) ───────────── */
const STRIP = ['closet-dark', 'kitchen', 'living', 'closet-light', 'dining', 'closet-room', 'table', 'closet-white'];
function Marquee() {
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const st = useRef({ off: 0, v: 0, dragging: false, sx: 0, so: 0, lx: 0, lt: 0 });
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = reduced ? 0 : 0.8;
    let raf = 0;
    const loop = () => {
      const s = st.current;
      const el = track.current;
      if (el) {
        const half = el.scrollWidth / 2;
        if (!s.dragging) {
          if (Math.abs(s.v) > 0.1) {
            s.off += s.v;
            s.v *= 0.95;
          } else {
            s.v = 0;
            s.off -= SPEED;
          }
        }
        if (half > 0) {
          if (s.off <= -half) s.off += half;
          if (s.off > 0) s.off -= half;
        }
        el.style.transform = `translate3d(${s.off}px,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const down = (e: React.PointerEvent) => {
    const s = st.current;
    s.dragging = true;
    s.v = 0;
    s.sx = e.clientX;
    s.so = s.off;
    s.lx = e.clientX;
    s.lt = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - s.lt);
    s.v = ((e.clientX - s.lx) / dt) * 16;
    s.lx = e.clientX;
    s.lt = now;
    s.off = s.so + (e.clientX - s.sx);
  };
  const up = () => {
    st.current.dragging = false;
    setDrag(false);
  };
  return (
    <section className="relative overflow-hidden py-4" aria-label="Наши работы, лента">
      <svg className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-[80px] w-full sm:h-[100px]" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H1440V50C1440 50 1200 100 720 100C240 100 0 50 0 50V0Z" fill="white" />
      </svg>
      <svg className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[80px] w-full sm:h-[100px]" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100H1440V50C1440 50 1200 0 720 0C240 0 0 50 0 50V100Z" fill="white" />
      </svg>
      <div ref={track} className={`marq flex w-max select-none gap-3 py-4 sm:gap-4 ${drag ? 'drag' : ''}`} style={{ willChange: 'transform' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {[...STRIP, ...STRIP].map((n, k) => (
          <div key={k} className="h-80 w-60 shrink-0 overflow-hidden rounded-2xl sm:h-[32rem] sm:w-80">
            <img src={MD(n)} alt="" draggable={false} loading={k < 6 ? 'eager' : 'lazy'} className="pointer-events-none h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Hero() {
  return (
    <>
      <section className="px-4 pb-1 pt-28 text-center sm:px-6 sm:pt-32">
        <h1 className="mx-auto max-w-4xl text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-neutral-900 sm:text-6xl md:text-7xl lg:text-[5.6rem]">
          Мебель по вашим
          <br />
          размерам
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-900 sm:mt-6 sm:text-lg md:text-xl">Шкафы, гардеробные и кухни, которые встают в ваш дом как влитые.</p>
      </section>
      <Marquee />
      <section className="mx-auto max-w-2xl px-4 pb-16 pt-2 text-center sm:px-6">
        <p className="text-base leading-relaxed text-neutral-900 sm:text-lg md:text-xl">Проектируем под ваши стены, делаем в своём цехе и собираем за один визит. Без типовых модулей и заглушек на полсантиметра.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <a href="#showroom" className="ulink ui-dim ui-focus">Записаться в шоурум</a>
          <a href="#config" className="ulink ui-dim ui-focus">Собрать шкаф онлайн</a>
        </div>
      </section>
    </>
  );
}

/* ───────────── shop by room ───────────── */
const ROOMS: [string, string, string][] = [
  ['Гардеробные', 'closet-dark', 'Системы хранения с подсветкой полок'],
  ['Шкафы', 'closet-light', 'Встроенные, распашные и купе'],
  ['Кухни', 'kitchen', 'Острова, пеналы, столешницы из камня'],
  ['Столовые', 'dining', 'Столы из массива и буфеты'],
  ['Гостиные', 'living', 'ТВ-зоны, стеллажи, книжные стены'],
];
function Rooms() {
  const [a, setA] = useState(0);
  return (
    <section id="rooms" className="border-t border-[var(--line)] py-24 md:py-32">
      <div className="wrap grid items-center gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
        <div>
          <div className="tag mb-4">Что делаем</div>
          <h2 className="h2">Для каждой комнаты</h2>
          <ul className="mt-10">
            {ROOMS.map(([t, , d], i) => (
              <li key={t} className="border-b border-[var(--line)]">
                <button type="button" onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)} aria-pressed={a === i} className="ui-press ui-press--surface ui-focus group flex w-full items-baseline justify-between gap-4 rounded-lg px-1 py-5 text-left">
                  <span className="text-[28px] font-medium tracking-[-0.03em] md:text-[34px]" style={{ color: a === i ? '#1a1a1a' : '#a3a3a3', transition: 'color .35s' }}>{t}</span>
                  <span className="hidden text-[15px] text-ink-2 sm:block" style={{ opacity: a === i ? 1 : 0, transform: a === i ? 'none' : 'translateX(-8px)', transition: 'opacity .35s, transform .35s' }}>{d} →</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-soft" style={{ aspectRatio: '4 / 4.6' }}>
          {ROOMS.map(([t, img], i) => (
            <img key={t} src={MD(img)} alt={t} loading="lazy" className={`room-img h-full w-full object-cover ${a === i ? 'on' : ''}`} />
          ))}
          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-[14px] font-medium backdrop-blur">{ROOMS[a][0]} · по вашим размерам</div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── wardrobe configurator ───────────── */
const FINISH = [
  { id: 'oak', name: 'Дуб натуральный', price: 18900, css: 'repeating-linear-gradient(93deg, rgba(110,70,30,.10) 0 2px, transparent 2px 7px), repeating-linear-gradient(88deg, rgba(255,255,255,.08) 0 1px, transparent 1px 13px), linear-gradient(180deg,#cfa77c,#bf9467)' },
  { id: 'walnut', name: 'Орех', price: 22400, css: 'repeating-linear-gradient(92deg, rgba(30,15,5,.18) 0 2px, transparent 2px 8px), repeating-linear-gradient(87deg, rgba(255,220,180,.06) 0 1px, transparent 1px 15px), linear-gradient(180deg,#77523a,#5f412d)' },
  { id: 'graphite', name: 'Графит матовый', price: 15600, css: 'linear-gradient(180deg,#45474a,#38393c)' },
  { id: 'silk', name: 'Белый шёлк', price: 13900, css: 'linear-gradient(180deg,#f6f3ee,#ebe7e0)' },
];
const HANDLES = [
  { id: 'none', name: 'Без ручек', color: '' },
  { id: 'brass', name: 'Латунь', color: 'linear-gradient(90deg,#b8914a,#e3c27e,#a9823e)' },
  { id: 'black', name: 'Чёрные', color: '#151515' },
];
const FILL = [
  { id: 'rail', name: 'Штанги', price: 3500 },
  { id: 'shelf', name: 'Полки', price: 2200 },
  { id: 'drawer', name: 'Ящики', price: 7800 },
  { id: 'light', name: 'Подсветка', price: 4900 },
];

function Wardrobe({ width, height, finish, handle, fill, open }: { width: number; height: number; finish: string; handle: string; fill: string[]; open: boolean }) {
  const n = Math.max(2, Math.min(6, Math.round(width / 55)));
  const f = FINISH.find((x) => x.id === finish)!;
  const h = HANDLES.find((x) => x.id === handle)!;
  const ratio = height / width;
  const lit = fill.includes('light');
  return (
    <div className="flex h-full w-full items-end justify-center">
      <div className={`wardrobe relative ${open ? 'open' : ''}`} style={{ width: `min(100%, ${Math.min(1, 1.15 / ratio) * 100}%)`, aspectRatio: `${width} / ${height}`, maxHeight: '100%', transition: 'aspect-ratio .5s, width .5s' }}>
        {/* carcass + interior */}
        <div className="absolute inset-0 grid gap-[3px] rounded-[6px] p-[3px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, background: '#2a2622' }}>
          {Array.from({ length: n }).map((_, k) => (
            <div key={k} className="relative flex flex-col justify-end gap-[6%] overflow-hidden rounded-[3px] p-[8%]" style={{ background: lit ? 'linear-gradient(180deg,#fff4e0,#e9dccb)' : '#e9e4dc', boxShadow: lit ? 'inset 0 8px 18px -6px rgba(255,190,110,.75)' : 'inset 0 2px 8px rgba(0,0,0,.18)' }}>
              {fill.includes('rail') && k % 2 === 0 && <div className="absolute left-[8%] right-[8%] top-[16%] h-[3px] rounded bg-neutral-500" />}
              {fill.includes('rail') && k % 2 === 0 && <div className="absolute left-[18%] right-[18%] top-[18%] h-[38%] rounded-b-[30%] opacity-70" style={{ background: 'repeating-linear-gradient(90deg,#8a7c6b 0 6px,#a8998a 6px 11px,#6f6355 11px 16px)' }} />}
              {fill.includes('shelf') && k % 2 === 1 && [0, 1, 2].map((s) => <div key={s} className="h-[3px] w-full rounded bg-neutral-400" />)}
              {fill.includes('drawer') && [0, 1].map((s) => <div key={s} className="h-[9%] min-h-[8px] w-full rounded-[2px] bg-[#d6cfc4] shadow-[inset_0_-2px_0_rgba(0,0,0,.12)]" />)}
            </div>
          ))}
        </div>
        {/* doors */}
        <div className="absolute inset-0 grid gap-[2px] p-[3px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, perspective: 1200 }}>
          {Array.from({ length: n }).map((_, k) => {
            const right = k % 2 === 1;
            return (
              <div key={k} className={`door relative rounded-[3px] ${right ? 'r' : ''}`} style={{ background: f.css, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08), inset -6px 0 12px -10px rgba(0,0,0,.4)', transitionDelay: `${k * 40}ms` } as CSSProperties}>
                {h.color && <span className="absolute top-1/2 h-[18%] w-[5px] -translate-y-1/2 rounded-full" style={{ background: h.color, [right ? 'left' : 'right']: '10%' }} />}
                {!h.color && <span className="absolute inset-x-0 top-0 h-[6px] bg-black/25" />}
              </div>
            );
          })}
        </div>
        <div className="absolute -bottom-3 left-[2%] right-[2%] h-3 rounded-full bg-black/20 blur-md" />
      </div>
    </div>
  );
}

function Configurator() {
  const [width, setWidth] = useState(240);
  const [height, setHeight] = useState(260);
  const [finish, setFinish] = useState('oak');
  const [handle, setHandle] = useState('brass');
  const [fill, setFill] = useState<string[]>(['rail', 'shelf', 'drawer']);
  const [open, setOpen] = useState(false);
  const n = Math.max(2, Math.min(6, Math.round(width / 55)));
  const price = useMemo(() => {
    const f = FINISH.find((x) => x.id === finish)!;
    const area = (width / 100) * (height / 100);
    const extras = FILL.filter((x) => fill.includes(x.id)).reduce((s, x) => s + x.price * Math.ceil(n / 2), 0);
    return area * f.price + extras + (handle === 'brass' ? 2400 * n : handle === 'black' ? 1200 * n : 0);
  }, [width, height, finish, handle, fill, n]);

  return (
    <section id="config" className="bg-soft py-24 md:py-32">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="tag mb-4">Конфигуратор</div>
            <h2 className="h2">Соберите шкаф и узнайте цену за минуту</h2>
          </div>
          <p className="lead md:col-span-5">Размер, фасады, ручки и наполнение. Дизайнер доработает проект и пришлёт 3D-визуализацию.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <div className="relative flex flex-col rounded-3xl bg-white p-6 md:p-10 lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="tag">{width} × {height} см · {n} {n < 5 ? 'двери' : 'дверей'}</span>
              <button type="button" onClick={() => setOpen((o) => !o)} aria-pressed={open} className="pill pill-o ui-press ui-focus" style={{ height: 38, fontSize: 14 }}>
                {open ? 'Закрыть двери' : 'Открыть двери'}
              </button>
            </div>
            <div className="mt-6 flex-1" style={{ minHeight: 360 }}>
              <Wardrobe width={width} height={height} finish={finish} handle={handle} fill={fill} open={open} />
            </div>
            <div className="mt-6 h-px bg-[var(--line)]" />
            <div className="mt-3 text-center text-[13px] text-ink-3">Схема для примерки. Точный проект — после бесплатного замера.</div>
          </div>
          <div className="rounded-3xl bg-white p-6 md:p-8 lg:col-span-5">
            <div className="flex items-baseline justify-between"><label htmlFor="w" className="tag">Ширина</label><span className="text-[18px] font-semibold tabular-nums">{width} см</span></div>
            <input id="w" className="rng" type="range" min={100} max={360} step={10} value={width} onChange={(e) => setWidth(+e.target.value)} style={{ ['--p' as string]: `${((width - 100) / 260) * 100}%` }} />
            <div className="mt-4 flex items-baseline justify-between"><label htmlFor="h" className="tag">Высота</label><span className="text-[18px] font-semibold tabular-nums">{height} см</span></div>
            <input id="h" className="rng" type="range" min={200} max={300} step={10} value={height} onChange={(e) => setHeight(+e.target.value)} style={{ ['--p' as string]: `${((height - 200) / 100) * 100}%` }} />

            <div className="tag mt-6">Фасады</div>
            <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Фасады">
              {FINISH.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={finish === x.id} onClick={() => setFinish(x.id)} className="ui-press ui-focus flex flex-col items-center gap-2 rounded-2xl p-2 text-center text-[12.5px] leading-tight text-ink-2" style={{ boxShadow: finish === x.id ? 'inset 0 0 0 1.5px #1a1a1a' : 'inset 0 0 0 1px var(--line)' }}>
                  <span className="block h-12 w-full rounded-xl" style={{ background: x.css }} />
                  {x.name}
                </button>
              ))}
            </div>

            <div className="tag mt-6">Ручки</div>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Ручки">
              {HANDLES.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={handle === x.id} onClick={() => setHandle(x.id)} className="ui-press ui-focus rounded-full px-4 py-2.5 text-[14px]" style={{ background: handle === x.id ? '#1a1a1a' : '#fff', color: handle === x.id ? '#fff' : '#1a1a1a', boxShadow: handle === x.id ? 'none' : 'inset 0 0 0 1px var(--line)' }}>
                  {x.name}
                </button>
              ))}
            </div>

            <div className="tag mt-6">Наполнение</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FILL.map((x) => {
                const on = fill.includes(x.id);
                return (
                  <button key={x.id} type="button" role="checkbox" aria-checked={on} onClick={() => { setFill((s) => (on ? s.filter((y) => y !== x.id) : [...s, x.id])); setOpen(true); }} className="ui-press ui-focus rounded-full px-4 py-2.5 text-[14px]" style={{ background: on ? '#1a1a1a' : '#fff', color: on ? '#fff' : '#1a1a1a', boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)' }}>
                    {on ? '✓ ' : '+ '}{x.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-6">
              <div>
                <div className="tag">Ориентировочно, с установкой</div>
                <div className="mt-1 text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums" aria-live="polite">{rub(price)}</div>
              </div>
            </div>
            <a href="#showroom" className="pill ui-press ui-press--on-dark ui-focus mt-6 w-full" style={{ height: 52 }}>Отправить проект дизайнеру</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── materials story ───────────── */
const STORY = [
  { img: 'craft', tag: 'Дерево', h: 'Шпон, который выбираем вручную', p: 'Подбираем листы шпона так, чтобы рисунок шёл через все фасады без разрывов. Покрываем маслом-воском — дерево дышит, а пятна не впитываются.', spec: ['Дуб, орех, ясень', 'Масло-воск Osmo', 'Подбор рисунка по фасадам'] },
  { img: 'closet-open', tag: 'Фурнитура', h: 'Петли, которые переживут ремонт', p: 'Ставим австрийскую фурнитуру с доводчиками. Ящики выдвигаются полностью и держат до 70 кг, двери закрываются без хлопка.', spec: ['Blum и Hettich', 'Гарантия 10 лет', 'Доводчики на всём'] },
  { img: 'table', tag: 'Сборка', h: 'Один визит — и всё стоит на месте', p: 'Привозим мебель уже собранными модулями, подгоняем под стены за день и уносим упаковку с собой.', spec: ['Сборка за 1 день', 'Подгонка под кривые стены', 'Вывоз упаковки'] },
];
function Materials() {
  return (
    <section id="materials" className="py-24 md:py-32">
      <div className="wrap">
        <div className="tag mb-4">Материалы</div>
        <h2 className="h2 max-w-[16ch]">Из чего сделана мебель</h2>
        <div className="mt-16 space-y-20 md:space-y-28">
          {STORY.map((s, k) => (
            <div key={s.tag} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={`overflow-hidden rounded-3xl ${k % 2 ? 'md:order-2' : ''}`} style={{ aspectRatio: '5 / 4' }}>
                <img src={MD(s.img)} alt={s.h} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="tag">{s.tag}</div>
                <h3 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[40px]">{s.h}</h3>
                <p className="lead mt-5">{s.p}</p>
                <ul className="mt-7 grid gap-2.5">
                  {s.spec.map((x) => (
                    <li key={x} className="flex items-center gap-3 text-[15px]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-walnut" />{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── works (React Bits Masonry) ───────────── */
function Works() {
  const items = [
    { id: 1, img: MD('closet-dark'), height: 620, title: 'Гардеробная с подсветкой', description: 'Графит и дуб · 9 м²' },
    { id: 2, img: MD('kitchen'), height: 440, title: 'Кухня с островом', description: 'Шпон ореха · камень' },
    { id: 3, img: MD('closet-white'), height: 700, title: 'Встроенный шкаф', description: 'Белый шёлк · 2,7 м' },
    { id: 4, img: MD('dining'), height: 720, title: 'Столовая', description: 'Стол из массива дуба' },
    { id: 5, img: MD('closet-room'), height: 460, title: 'Гардероб-комната', description: 'Ясень · 12 м²' },
    { id: 6, img: MD('living'), height: 480, title: 'Гостиная со стеллажом', description: 'Орех · латунь' },
    { id: 7, img: MD('closet-light'), height: 520, title: 'Шкаф в спальню', description: 'Дуб натуральный' },
    { id: 8, img: MD('table'), height: 420, title: 'Обеденная зона', description: 'Массив · масло-воск' },
  ];
  return (
    <section id="works" className="border-t border-[var(--line)] py-24 md:py-32">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="tag mb-4">Работы</div>
            <h2 className="h2">Сделано и собрано</h2>
          </div>
          <p className="lead max-w-md">Каждая вещь — под конкретную комнату. Наведите на фото, чтобы узнать детали.</p>
        </div>
        <div className="mt-12">
          <Masonry items={items} columns="auto" gap={16} radius={20} animateFrom="bottom" hoverEffect="zoom" captions="hover" blurToFocus={false} />
        </div>
      </div>
    </section>
  );
}

/* ───────────── process ───────────── */
const PROC = [
  ['Замер', 'Дизайнер приезжает с образцами и замеряет комнату лазером.'],
  ['Проект в 3D', 'Через 3 дня присылаем визуализацию и точную смету.'],
  ['Цех', 'Изготавливаем за 3–5 недель. Присылаем фото с производства.'],
  ['Сборка', 'Привозим и собираем за один визит. Гарантия 5 лет.'],
];
function Process() {
  return (
    <section className="bg-neutral-900 py-24 text-white md:py-32">
      <div className="wrap">
        <div className="text-[13px] font-medium text-white/55">Как работаем</div>
        <h2 className="h2 mt-4 max-w-[18ch]">От замера до сборки — пять недель</h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-4">
          {PROC.map(([t, d], k) => (
            <li key={t} className="bg-neutral-900 p-7 md:p-8">
              <div className="text-[44px] font-semibold leading-none tracking-[-0.04em] text-white/25 tabular-nums">0{k + 1}</div>
              <h3 className="mt-8 text-[22px] font-semibold tracking-[-0.02em]">{t}</h3>
              <p className="mt-2 text-[15px] text-white/65">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── showroom + lead ───────────── */
function Showroom() {
  const [st, setSt] = useState<LeadState>('idle');
  const [phone, setPhone] = useState('');
  const [what, setWhat] = useState('Гардеробная');
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
    <section id="showroom" className="py-24 md:py-32">
      <div className="wrap grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 420 }}>
          <img src={IMG('closet-open')} alt="Шоурум с образцами фасадов" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
            <div className="text-[13px] font-medium text-white/70">Шоурум · {CITY}</div>
            <div className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em]">Потрогайте шпон, откройте ящики, выберите ручки</div>
            <div className="mt-4 text-[15px] text-white/80">Ежедневно 10:00–20:00 · 5 минут от метро · парковка</div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="tag">Запись в шоурум</div>
          <h2 className="h2 mt-4">Приходите с размерами — уйдёте с проектом</h2>
          <p className="lead mt-5">Дизайнер встретит, покажет образцы и прямо на встрече соберёт первый вариант.</p>
          {st === 'done' ? (
            <div className="mt-8 rounded-2xl bg-soft p-6" role="status">
              <div className="text-[20px] font-semibold">Вы записаны</div>
              <p className="mt-2 text-ink-2">Это демо-сайт студии TURCH: заявка никуда не отправилась. На вашем сайте она придёт в Telegram или CRM.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-8 grid gap-3">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Что нужно">
                {['Гардеробная', 'Шкаф', 'Кухня', 'Другое'].map((x) => (
                  <button key={x} type="button" role="radio" aria-checked={what === x} onClick={() => setWhat(x)} className="ui-press ui-focus rounded-full px-4 py-2.5 text-[14px]" style={{ background: what === x ? '#1a1a1a' : '#fff', color: what === x ? '#fff' : '#1a1a1a', boxShadow: what === x ? 'none' : 'inset 0 0 0 1px var(--line)' }}>{x}</button>
                ))}
              </div>
              <label htmlFor="mp" className="sr-only">Телефон</label>
              <input id="mp" className="field mt-2" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'mp-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
              {st === 'error' && <p id="mp-e" className="m-0 text-[14px] text-[#c0392b]">Нужно 10 цифр после +7.</p>}
              <Magnet padding={40} magnetStrength={6} wrapperClassName="w-full" innerClassName="w-full">
                <button type="submit" className="pill ui-press ui-press--on-dark ui-focus w-full" style={{ height: 54 }} aria-busy={st === 'pending'}>{st === 'pending' ? 'Записываем…' : 'Записаться'}</button>
              </Magnet>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10 pb-24">
      <div className="wrap flex flex-col gap-4 text-[14px] text-ink-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5 text-ink"><Logo size={22} /><span className="font-semibold">{BRAND}</span></div>
        <div>Мебель на заказ · {CITY}</div>
        <a href={TEL} className="ui-dim ui-focus text-ink no-underline">{PHONE}</a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Nav />
      <main>
        <Hero />
        <Rooms />
        <Configurator />
        <Materials />
        <Works />
        <Process />
        <Showroom />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="light" />}
    </div>
  );
}
