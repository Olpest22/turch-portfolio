import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import CountUp from '@/shared/rb/CountUp';
import FlowingMenu from '@/shared/rb/FlowingMenu';
import BlurText from '@/shared/rb/BlurText';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED } from '@/shared/brand';
import { BASE } from '@/lib/base';

const BRAND = brandOr('КЛЮЧ');
const CITY = cityOr('Москва и область');

const PHONE = '+7 (900) 000-00-00';
const IMG = (n: string) => `${BASE}img/remont/${n}.webp`;
const MD = (n: string) => `${BASE}img/remont/${n}-md.webp`;

/* ───────────────────────── decode label (Monolith) ───────────────────────── */
const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789/+';
function Decode({ text, className, trigger = 0 }: { text: string; className?: string; trigger?: number }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setOut(text);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 400);
      const n = Math.floor(p * text.length);
      setOut(text.slice(0, n) + [...text.slice(n)].map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, trigger]);
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}

/* ───────────────────────── hero chapters ───────────────────────── */
const CHAPTERS = [
  { key: 'ЗАМЕР', img: 'hero', h: ['Ремонт под ключ', 'без вашего участия'], p: 'Смета до начала работ, фиксированная цена в договоре и фотоотчёт каждую неделю. Вы приезжаете, когда пора забирать ключи.' },
  { key: 'ДИЗАЙН', img: 'living', h: ['Проект, где учтена', 'каждая розетка'], p: 'Планировка, развёртки стен, свет и мебель. Рабочие чертежи, по которым бригада работает без звонков вам.' },
  { key: 'ЧЕРНОВЫЕ', img: 'raw', h: ['Стены ровнее,', 'чем требует СНиП'], p: 'Демонтаж, электрика, сантехника, стяжка и штукатурка по маякам. Скрытые работы сдаём по фото и актам.' },
  { key: 'ЧИСТОВЫЕ', img: 'kitchen', h: ['Отделка, которую', 'хочется трогать'], p: 'Плитка с совпадением швов, покраска в три слоя, двери скрытого монтажа. Материалы закупаем сами по оптовым ценам.' },
  { key: 'СДАЧА', img: 'bedroom', h: ['Чистая квартира', 'и ключи в руках'], p: 'Клининг, проверка по чек-листу из 120 пунктов и гарантия 5 лет на все работы, прописанная в договоре.' },
];

function Hero() {
  const [i, setI] = useState(0);
  const [swap, setSwap] = useState(false);
  const [shown, setShown] = useState(0);
  const [touched, setTouched] = useState(false);
  const bg = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const go = (n: number) => {
    if (n === i) return;
    setI(n);
    setSwap(true);
    window.setTimeout(() => {
      setShown(n);
      setSwap(false);
    }, reduced ? 0 : 480);
  };

  useEffect(() => {
    if (touched || reduced) return;
    const t = window.setTimeout(() => go((i + 1) % CHAPTERS.length), 6500);
    return () => window.clearTimeout(t);
  }, [i, touched]);

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const tgt = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const loop = () => {
      cur.x += (tgt.x - cur.x) * 0.045;
      cur.y += (tgt.y - cur.y) * 0.045;
      if (bg.current) bg.current.style.transform = `translate3d(${-cur.x * 1.6}%, ${-cur.y * 1.5}%, 0) scale(1.06)`;
      if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.0004) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const move = (e: PointerEvent) => {
      tgt.x = (e.clientX / window.innerWidth) * 2 - 1;
      tgt.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const c = CHAPTERS[shown];
  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden" aria-label="Главный экран">
      <div ref={bg} className="absolute inset-0" style={{ transform: 'scale(1.06)' }}>
        {CHAPTERS.map((ch, n) => (
          <div key={ch.key} className={`hero-img ${n === i ? 'on' : ''}`} style={{ backgroundImage: `url(${IMG(ch.img)})` }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(4,7,13,.72) 0%, rgba(4,7,13,.18) 34%, rgba(4,7,13,.35) 60%, rgba(4,7,13,.94) 100%), linear-gradient(90deg, rgba(4,7,13,.7) 0%, rgba(4,7,13,0) 30%)' }} />

      {/* chamfered frame */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[14px] md:inset-[28px]">
        <span className="frame-x absolute left-[26px] right-[26px] top-0 h-px bg-[var(--line-2)]" />
        <span className="frame-x-r absolute bottom-0 left-[26px] right-[26px] h-px bg-[var(--line-2)]" />
        <span className="frame-y absolute bottom-[26px] left-0 top-[26px] w-px bg-[var(--line-2)]" />
        <span className="frame-y-r absolute bottom-[26px] right-0 top-[26px] w-px bg-[var(--line-2)]" />
        {['left-0 top-0 rotate-[-45deg] origin-top-left translate-x-[0px] translate-y-[26px]', 'right-0 top-0 rotate-[45deg] origin-top-right translate-y-[26px]', 'left-0 bottom-0 rotate-[45deg] origin-bottom-left -translate-y-[26px]', 'right-0 bottom-0 rotate-[-45deg] origin-bottom-right -translate-y-[26px]'].map((p) => (
          <span key={p} className={`anim-fade absolute h-px w-[36.8px] bg-[var(--line-2)] ${p}`} style={{ animationDelay: '550ms' }} />
        ))}
      </div>

      {/* masthead */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 md:px-14 md:pt-12">
          <a href="#" className="ui-dim ui-focus anim-mask flex items-center gap-3 text-tx no-underline" aria-label={`${BRAND}, наверх`}>
            <span className="flex items-center gap-3" style={{ animationDelay: '160ms' }}>
              <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
                <circle cx="9" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
                <path d="M15.5 10H28v6M22.5 10v4" fill="none" stroke="currentColor" strokeWidth="2.4" />
              </svg>
              <span className="block max-w-[46vw] truncate font-head text-[19px] font-bold uppercase tracking-[0.22em]">{BRAND}</span>
            </span>
          </a>
          <nav className="anim-fade hidden items-center gap-6 lg:flex" style={{ animationDelay: '340ms' }} aria-label="Разделы">
            {[
              ['УСЛУГИ', '#services'],
              ['ЦЕНЫ', '#calc'],
              ['ОБЪЕКТЫ', '#works'],
              ['ЭТАПЫ', '#steps'],
              ['ОТЗЫВЫ', '#reviews'],
            ].map(([t, h]) => (
              <a key={t} href={h} className="lbl ui-dim ui-focus text-[#e3e8f2] no-underline opacity-90">
                {t}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#calc" className="btn btn-glass ui-press ui-press--on-dark ui-focus anim-settle hidden sm:inline-flex" style={{ animationDelay: '300ms' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><rect x="0" y="8" width="4" height="4" /><rect x="5" y="4" width="4" height="8" /><rect x="10" y="0" width="4" height="12" /></svg>
              Смета
            </a>
            <a href="#lead" className="btn btn-cream ui-press ui-focus anim-settle" style={{ animationDelay: '360ms' }}>
              Замер
            </a>
          </div>
        </div>
      </header>

      {/* index rail */}
      <ol className="anim-fade absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 md:left-14 md:block" style={{ animationDelay: '600ms' }} aria-label="Этапы">
        {CHAPTERS.map((ch, n) => (
          <li key={ch.key} className="relative">
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                go(n);
              }}
              aria-current={n === i ? 'step' : undefined}
              className="lbl ui-dim ui-focus block py-[9px] pl-6 text-left"
              style={{ color: n === i ? '#e6eaf5' : 'rgba(232,238,250,.34)', transition: 'color .3s' }}
            >
              <span aria-hidden="true" className="absolute left-0 top-1/2 h-[7px] w-[6px] -translate-y-1/2 bg-white" style={{ transform: `translateY(-50%) scaleX(${n === i ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .42s var(--e-soft)' }} />
              <span className="mr-3 opacity-50">0{n + 1}</span>
              {n === i ? <Decode text={ch.key} trigger={n} /> : ch.key}
            </button>
          </li>
        ))}
      </ol>

      {/* hero copy */}
      <div className={`absolute inset-x-0 bottom-[118px] z-10 px-6 md:bottom-[150px] ${swap ? 'swap-out' : ''}`}>
        <div className="mx-auto max-w-[760px] text-center">
          <h1 className="h-xl text-white">
            <span className="anim-mask"><span style={{ animationDelay: '420ms' }}>{c.h[0]}</span></span>
            <span className="anim-mask"><span style={{ animationDelay: '520ms' }}>{c.h[1]}</span></span>
          </h1>
          <p className="swap-fade anim-settle mx-auto mt-6 max-w-[560px] text-[15px] leading-[1.75] text-tx-2 md:text-[16px]" style={{ animationDelay: '700ms' }}>
            {c.p}
          </p>
          <div className="anim-settle mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '860ms' }}>
            <a href="#calc" className="btn btn-cream ui-press ui-focus">
              Рассчитать стоимость
            </a>
            <a href="#works" className="btn btn-glass ui-press ui-press--on-dark ui-focus">
              Смотреть объекты
            </a>
          </div>
        </div>
      </div>

      {/* chapter switch on mobile */}
      <div className="absolute inset-x-0 bottom-[78px] z-20 flex justify-center gap-2 md:hidden" role="group" aria-label="Этапы">
        {CHAPTERS.map((ch, n) => (
          <button key={ch.key} type="button" aria-label={ch.key} aria-current={n === i ? 'step' : undefined} onClick={() => { setTouched(true); go(n); }} className="ui-focus h-8 w-8">
            <span className="mx-auto block h-[3px] w-6" style={{ background: n === i ? '#fff' : 'rgba(255,255,255,.3)', transition: 'background .3s' }} />
          </button>
        ))}
      </div>

      {/* dock */}
      <div className="absolute inset-x-[14px] bottom-[14px] z-20 md:inset-x-[28px] md:bottom-[28px]">
        <span className="frame-x absolute left-[26px] right-[26px] top-0 h-px bg-[var(--line)]" style={{ animationDelay: '920ms' }} />
        <div className="grid grid-cols-3 items-center px-6 py-5 md:px-10">
          <span className="lbl anim-settle text-tx-3" style={{ animationDelay: '960ms' }}>
            Гарантия 5 лет
          </span>
          <a href="#services" className="lbl ui-dim ui-focus anim-settle justify-self-center text-[#e3e8f2] no-underline" style={{ animationDelay: '1020ms' }}>
            Листайте ↓
          </a>
          <a href="tel:+79000000000" className="lbl ui-dim ui-focus anim-settle justify-self-end text-[#e3e8f2] no-underline" style={{ animationDelay: '1080ms' }}>
            <span className="hidden sm:inline">{PHONE}</span>
            <span className="sm:hidden">Позвонить</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */
function SectionHead({ label, title, children, full }: { label: string; title: string; children?: ReactNode; full?: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <div className={full ? 'md:col-span-12' : 'md:col-span-7'}>
        <div className="lbl mb-5 flex items-center gap-3 text-cream">
          <span aria-hidden="true" className="inline-block h-[7px] w-[6px] bg-cream" />
          {label}
        </div>
        <BlurText text={title} className="h-lg text-white" animateBy="words" effect="focus" delay={60} stepDuration={0.4} />
      </div>
      {children && <div className="text-[16px] text-tx-2 md:col-span-5 md:pb-1">{children}</div>}
    </div>
  );
}

/* ───────────────────────── stats ───────────────────────── */
function Stats() {
  const items: [number, string, string][] = [
    [12, ' лет', 'на рынке ремонта'],
    [640, '+', 'квартир сдали под ключ'],
    [5, ' лет', 'гарантия по договору'],
    [0, ' ₽', 'смета и выезд инженера'],
  ];
  return (
    <section className="border-y border-[var(--line)] bg-bg-2">
      <div className="wrap grid grid-cols-2 md:grid-cols-4">
        {items.map(([n, suf, t], k) => (
          <div key={t} className={`py-10 md:py-14 ${k % 2 ? 'pl-6' : ''} ${k > 0 ? 'md:border-l md:border-[var(--line)] md:pl-8' : ''} ${k > 1 ? 'border-t border-[var(--line)] md:border-t-0' : ''}`}>
            <div className="font-head text-[44px] font-bold leading-none tabular-nums text-white md:text-[56px]">
              <CountUp to={n} duration={1.6} separator=" " suffix={suf} />
            </div>
            <div className="lbl mt-4 text-tx-3">{t}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── services (React Bits FlowingMenu) ───────────────────────── */
function Services() {
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="wrap">
        <SectionHead label="Что делаем" title="Квартира целиком или одна комната">
          Ведём объект от замера до клининга. Наведите на услугу, чтобы увидеть, как это выглядит.
        </SectionHead>
      </div>
      <div className="mt-14 h-[420px] md:h-[520px]">
        <FlowingMenu
          items={[
            { text: 'Ремонт под ключ', image: MD('hero'), marquee: 'от замера до клининга', meta: 'от 12 900 ₽/м²' },
            { text: 'Дизайн-проект', image: MD('living'), marquee: 'планировка · свет · мебель', meta: 'от 1 900 ₽/м²' },
            { text: 'Черновые работы', image: MD('raw'), marquee: 'электрика · стяжка · штукатурка', meta: 'от 6 400 ₽/м²' },
            { text: 'Санузел и кухня', image: MD('kitchen'), marquee: 'плитка · сантехника · фартук', meta: 'от 290 000 ₽' },
          ]}
          textColor="#f2f4f8"
          bgColor="#04070d"
          marqueeBgColor="#e8d1cb"
          marqueeTextColor="#15131b"
          borderColor="rgba(255,255,255,0.13)"
        />
      </div>
    </section>
  );
}

/* ───────────────────────── calculator ───────────────────────── */
const PACKS = [
  { id: 'cosm', name: 'Косметический', price: 6900, k: 0.45, note: 'обои или покраска, полы, двери' },
  { id: 'cap', name: 'Капитальный', price: 12900, k: 1.15, note: 'с заменой электрики и сантехники' },
  { id: 'des', name: 'Дизайнерский', price: 19900, k: 1.7, note: 'по дизайн-проекту, сложная отделка' },
] as const;
const OPTS = [
  { id: 'floor', name: 'Тёплый пол', add: (a: number) => 35000 + a * 0 },
  { id: 'noise', name: 'Шумоизоляция стен', add: (a: number) => a * 900 },
  { id: 'ac', name: 'Кондиционирование', add: () => 48000 },
  { id: 'smart', name: 'Умный дом', add: () => 65000 },
];

function Calc() {
  const [area, setArea] = useState(54);
  const [pack, setPack] = useState<(typeof PACKS)[number]['id']>('cap');
  const [old, setOld] = useState(false);
  const [opts, setOpts] = useState<string[]>(['floor']);
  const p = PACKS.find((x) => x.id === pack)!;
  const total = useMemo(() => {
    const base = area * p.price * (old ? 1.15 : 1);
    return base + OPTS.filter((o) => opts.includes(o.id)).reduce((s, o) => s + o.add(area), 0);
  }, [area, pack, old, opts]);
  const weeks = Math.max(3, Math.round((area * p.k + 10 + (old ? 8 : 0)) / 7));

  return (
    <section id="calc" className="relative border-y border-[var(--line)] bg-bg-2 py-24 md:py-32">
      <div className="wrap">
        <SectionHead label="Калькулятор" title="Стоимость за минуту, точная — после замера">
          Цена считается по площади и типу ремонта. Инженер приезжает бесплатно и фиксирует смету в договоре.
        </SectionHead>
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div className="chamfer-line lg:col-span-7">
            <div className="chamfer-in p-6 md:p-10">
              <div className="flex items-baseline justify-between">
                <label htmlFor="area" className="lbl text-tx-2">Площадь квартиры</label>
                <span className="font-head text-[28px] font-bold tabular-nums">{area} м²</span>
              </div>
              <input id="area" className="rng mt-4" type="range" min={20} max={200} step={1} value={area} onChange={(e) => setArea(+e.target.value)} style={{ ['--p' as string]: `${((area - 20) / 180) * 100}%` }} />
              <div className="lbl mt-2 flex justify-between text-tx-3"><span>20</span><span>200 м²</span></div>

              <div className="lbl mt-10 text-tx-2">Тип ремонта</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Тип ремонта">
                {PACKS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={pack === x.id}
                    onClick={() => setPack(x.id)}
                    className="ui-press ui-press--surface ui-press--on-dark ui-focus p-4 text-left"
                    style={{ background: pack === x.id ? 'var(--cream)' : 'rgba(255,255,255,.04)', color: pack === x.id ? 'var(--ink)' : 'var(--text)', boxShadow: pack === x.id ? 'none' : 'inset 0 0 0 1px var(--line-2)' }}
                  >
                    <div className="font-head text-[17px] font-bold">{x.name}</div>
                    <div className="mt-1 text-[13px] opacity-70">{x.note}</div>
                    <div className="lbl mt-3">{new Intl.NumberFormat('ru-RU').format(x.price)} ₽/м²</div>
                  </button>
                ))}
              </div>

              <div className="lbl mt-10 text-tx-2">Дом</div>
              <div className="mt-4 inline-flex p-1" style={{ boxShadow: 'inset 0 0 0 1px var(--line-2)' }} role="radiogroup" aria-label="Тип дома">
                {[
                  ['Новостройка', false],
                  ['Вторичка', true],
                ].map(([t, v]) => (
                  <button key={String(t)} type="button" role="radio" aria-checked={old === v} onClick={() => setOld(v as boolean)} className="lbl ui-press ui-press--on-dark ui-focus px-5 py-3" style={{ background: old === v ? 'rgba(255,255,255,.12)' : 'transparent', color: old === v ? '#fff' : 'var(--text-2)' }}>
                    {t as string}
                  </button>
                ))}
              </div>

              <div className="lbl mt-10 text-tx-2">Дополнительно</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {OPTS.map((o) => {
                  const on = opts.includes(o.id);
                  return (
                    <button key={o.id} type="button" role="checkbox" aria-checked={on} onClick={() => setOpts((s) => (on ? s.filter((x) => x !== o.id) : [...s, o.id]))} className="ui-press ui-press--surface ui-press--on-dark ui-focus flex items-center gap-3 px-4 py-3.5 text-left text-[15px]" style={{ boxShadow: `inset 0 0 0 1px ${on ? 'var(--cream)' : 'var(--line)'}`, background: on ? 'rgba(232,209,203,.08)' : 'transparent' }}>
                      <span aria-hidden="true" className="grid h-5 w-5 place-items-center" style={{ background: on ? 'var(--cream)' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--line-2)', transition: 'background .2s' }}>
                        {on && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5 5 9l5-6" stroke="#15131b" strokeWidth="2" fill="none" /></svg>}
                      </span>
                      {o.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="chamfer-line lg:col-span-5">
            <div className="chamfer-in flex flex-col p-6 md:p-10" style={{ background: 'linear-gradient(160deg, #121a28, #0a0f18)' }}>
              <div className="lbl text-tx-3">Предварительно</div>
              <div className="mt-4 font-head text-[44px] font-bold leading-none tabular-nums text-white md:text-[52px]" aria-live="polite">
                {rub(total)}
              </div>
              <div className="mt-3 text-tx-2">≈ {new Intl.NumberFormat('ru-RU').format(Math.round(total / area))} ₽ за м² с материалами</div>
              <div className="mt-8 grid grid-cols-2 gap-px bg-[var(--line)]">
                <div className="bg-bg-2 p-4"><div className="lbl text-tx-3">Срок</div><div className="mt-2 text-[20px] font-bold">{weeks} недель</div></div>
                <div className="bg-bg-2 p-4"><div className="lbl text-tx-3">Оплата</div><div className="mt-2 text-[20px] font-bold">5 этапов</div></div>
              </div>
              <ul className="mt-8 space-y-3 text-[15px] text-tx-2">
                {['Черновые и чистовые материалы', 'Вывоз мусора и уборка', 'Технадзор и фотоотчёты', 'Гарантия 5 лет в договоре'].map((t) => (
                  <li key={t} className="flex gap-3"><span aria-hidden="true" className="mt-[9px] h-[6px] w-[6px] shrink-0 bg-cream" />{t}</li>
                ))}
              </ul>
              <a href="#lead" className="btn btn-cream ui-press ui-focus mt-auto w-full translate-y-0 pt-0" style={{ marginTop: 40 }}>
                Зафиксировать смету
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── works ───────────────────────── */
const WORKS = [
  { img: 'hero', type: 'new', title: 'Двушка в Раменках', area: 64, pack: 'Капитальный', days: 78 },
  { img: 'living', type: 'old', title: 'Сталинка на Соколе', area: 92, pack: 'Дизайнерский', days: 124 },
  { img: 'bedroom2', type: 'studio', title: 'Студия в Хорошёво', area: 32, pack: 'Дизайнерский', days: 61 },
  { img: 'kitchen', type: 'new', title: 'Кухня-гостиная в Химках', area: 71, pack: 'Капитальный', days: 84 },
  { img: 'dining', type: 'old', title: 'Трёшка на Профсоюзной', area: 87, pack: 'Капитальный', days: 96 },
  { img: 'bedroom', type: 'new', title: 'Спальня с гардеробной', area: 58, pack: 'Дизайнерский', days: 90 },
];
const FILTERS = [
  ['all', 'Все'],
  ['new', 'Новостройки'],
  ['old', 'Вторичка'],
  ['studio', 'Студии'],
] as const;

function Works() {
  const [f, setF] = useState<(typeof FILTERS)[number][0]>('all');
  const list = WORKS.filter((w) => f === 'all' || w.type === f);
  return (
    <section id="works" className="py-24 md:py-32">
      <div className="wrap">
        <SectionHead label="Объекты" title="Квартиры, которые мы уже отдали ключами" />
        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр объектов">
          {FILTERS.map(([id, t]) => (
            <button key={id} type="button" role="tab" aria-selected={f === id} onClick={() => setF(id)} className="lbl ui-press ui-press--on-dark ui-focus px-5 py-3" style={{ background: f === id ? 'var(--cream)' : 'transparent', color: f === id ? 'var(--ink)' : 'var(--text-2)', boxShadow: f === id ? 'none' : 'inset 0 0 0 1px var(--line-2)' }}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {list.map((w, k) => (
            <article key={w.title} tabIndex={0} className={`proj-card ui-focus relative overflow-hidden bg-bg-3 ${k === 0 && list.length > 2 ? 'md:col-span-2 md:row-span-2' : ''}`} style={{ aspectRatio: k === 0 && list.length > 2 ? undefined : '4 / 3.4', minHeight: 280 }}>
              <img src={k === 0 && list.length > 2 ? IMG(w.img) : MD(w.img)} alt={w.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="meta absolute inset-x-0 bottom-0 p-5" style={{ background: 'linear-gradient(0deg, rgba(4,7,13,.96), rgba(4,7,13,.82))' }}>
                <div className="flex h-[24px] items-center justify-between gap-3">
                  <h3 className="truncate text-[18px] font-bold">{w.title}</h3>
                  <span className="lbl shrink-0 text-cream">{w.area} м²</span>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-[14px]">
                  <div><dt className="lbl text-tx-3">Ремонт</dt><dd className="mt-1.5">{w.pack}</dd></div>
                  <div><dt className="lbl text-tx-3">Срок</dt><dd className="mt-1.5">{w.days} дней</dd></div>
                  <div><dt className="lbl text-tx-3">Гарантия</dt><dd className="mt-1.5">5 лет</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── steps (scroll-linked timeline) ───────────────────────── */
const STEPS = [
  ['Замер и смета', 'Инженер приезжает в удобное время, делает обмеры и в тот же день присылает подробную смету.', '1 день'],
  ['Договор', 'Фиксируем цену, сроки и штрафы за просрочку. Оплата по этапам, никаких 100% предоплаты.', '1 день'],
  ['Черновые работы', 'Демонтаж, перегородки, электрика, сантехника, стяжка и штукатурка. Скрытые работы — по актам.', '3–6 недель'],
  ['Чистовая отделка', 'Плитка, покраска, полы, двери, свет. Технадзор проверяет каждый этап по чек-листу.', '3–5 недель'],
  ['Сдача и гарантия', 'Клининг, приёмка по 120 пунктам и гарантийный талон на 5 лет.', '2 дня'],
];

function Steps() {
  const box = useRef<HTMLOListElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = (window.innerHeight * 0.6 - r.top) / r.height;
      setP(Math.min(1, Math.max(0, v)));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return (
    <section id="steps" className="border-y border-[var(--line)] bg-bg-2 py-24 md:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <SectionHead label="Этапы" title="От замера до ключей" full />
            <img src={MD('worker')} alt="Мастер выравнивает стену" loading="lazy" className="mt-10 hidden aspect-[4/5] w-full object-cover lg:block" style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))' }} />
          </div>
        </div>
        <ol ref={box} className="relative lg:col-span-7">
          <span aria-hidden="true" className="absolute bottom-2 left-[11px] top-2 w-px bg-[var(--line-2)]" />
          <span aria-hidden="true" className="absolute left-[11px] top-2 w-px bg-cream" style={{ height: `calc(${p * 100}% - 16px)` }} />
          {STEPS.map(([t, d, dur], k) => {
            const on = p >= k / STEPS.length;
            return (
              <li key={t} className="relative pb-14 pl-14 last:pb-0">
                <span aria-hidden="true" className="absolute left-[5px] top-[6px] h-[13px] w-[13px] rotate-45" style={{ background: on ? 'var(--cream)' : 'var(--bg-2)', boxShadow: on ? '0 0 0 6px rgba(232,209,203,.12)' : 'inset 0 0 0 1.5px var(--line-2)', transition: 'background .4s, box-shadow .4s' }} />
                <div className="lbl text-tx-3">Этап 0{k + 1} · {dur}</div>
                <h3 className="mt-3 text-[26px] font-bold leading-tight" style={{ color: on ? '#fff' : 'var(--text-2)', transition: 'color .4s' }}>{t}</h3>
                <p className="mt-3 max-w-[520px] text-tx-2">{d}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── reviews ───────────────────────── */
const REVIEWS = [
  ['Анна и Дмитрий', 'Двушка в Раменках', 'Жили в другом городе и приехали только на приёмку. Фото каждую пятницу, смета не выросла ни на рубль.'],
  ['Ольга', 'Сталинка на Соколе', 'Старый дом, кривые стены и проводка из пятидесятых. Сделали всё, что обещали, и уложились в срок.'],
  ['Игорь', 'Кухня-гостиная в Химках', 'Понравилось, что материалы закупали сами и показывали чеки. Через год вызвал по гарантии — приехали на следующий день.'],
];
function Reviews() {
  return (
    <section id="reviews" className="py-24 md:py-32">
      <div className="wrap">
        <SectionHead label="Отзывы" title="Что говорят после приёмки" />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {REVIEWS.map(([n, o, t]) => (
            <figure key={n} className="chamfer-line m-0">
              <div className="chamfer-in flex h-full flex-col p-7">
                <div aria-label="Оценка 5 из 5" className="lbl text-cream">★★★★★</div>
                <blockquote className="m-0 mt-5 flex-1 text-[17px] leading-[1.65] text-tx">{t}</blockquote>
                <figcaption className="mt-7 border-t border-[var(--line)] pt-5">
                  <div className="font-bold">{n}</div>
                  <div className="lbl mt-2 text-tx-3">{o}</div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── faq + lead ───────────────────────── */
const FAQ = [
  ['Может ли смета вырасти во время ремонта?', 'Нет. Цена работ фиксируется в договоре. Меняется только если вы сами решите добавить работы — тогда подписываем допсоглашение.'],
  ['Нужно ли мне приезжать на объект?', 'Нет. Ключи у прораба, отчёты с фото и видео приходят в чат каждую неделю. Вы приезжаете на приёмку этапов, если хотите.'],
  ['Кто закупает материалы?', 'Мы, по оптовым ценам партнёров, с чеками. Можно купить что-то самостоятельно — учтём это в смете.'],
  ['Работаете со вторичкой и старым фондом?', 'Да. В старых домах закладываем больше времени на демонтаж и выравнивание, это видно в калькуляторе.'],
  ['Как устроена гарантия?', '5 лет на все работы. Если что-то случилось, мастер приезжает в течение 48 часов и устраняет за наш счёт.'],
];

function Lead() {
  const [st, setSt] = useState<LeadState>('idle');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
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
    <section id="lead" className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
      <img src={MD('dining')} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #04070d 30%, rgba(4,7,13,.75))' }} />
      <div className="wrap relative grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHead label="Вопросы" title="Частые вопросы" full />
          <div className="mt-10 border-t border-[var(--line)]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq border-b border-[var(--line)]">
                <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[17px] font-bold">
                  {q}
                  <span aria-hidden="true" className="chev text-[22px] font-normal text-cream">+</span>
                </summary>
                <p className="m-0 pb-6 text-tx-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 lg:pl-10">
          <div className="chamfer-line">
            <div className="chamfer-in p-7 md:p-10">
              <div className="lbl text-cream">Бесплатный замер</div>
              <h2 className="h-lg mt-5">Инженер приедет завтра</h2>
              <p className="mt-4 text-tx-2">Оставьте телефон — перезвоним в течение 15 минут и согласуем время замера.</p>
              {st === 'done' ? (
                <div className="mt-8 p-6" style={{ boxShadow: 'inset 0 0 0 1px var(--cream)' }} role="status">
                  <div className="text-[20px] font-bold">Заявка принята</div>
                  <p className="mt-2 text-tx-2">Это демо-сайт студии TURCH: заявка никуда не отправилась. На вашем сайте она придёт в Telegram или CRM.</p>
                </div>
              ) : (
                <form className="mt-8 grid gap-3" onSubmit={submit} noValidate>
                  <label className="sr-only" htmlFor="ln">Имя</label>
                  <input id="ln" className="field" placeholder="Как к вам обращаться" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <label className="sr-only" htmlFor="lp">Телефон</label>
                  <input id="lp" className="field" inputMode="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'lp-err' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} autoComplete="tel" />
                  {st === 'error' && <p id="lp-err" className="m-0 text-[14px] text-[#ff8a7a]">Проверьте номер: нужно 10 цифр после +7.</p>}
                  <button type="submit" className="btn btn-cream ui-press ui-focus mt-2 w-full" aria-busy={st === 'pending'}>
                    {st === 'pending' ? 'Отправляем…' : 'Вызвать инженера'}
                  </button>
                  <p className="m-0 mt-1 text-[13px] text-tx-3">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-12 pb-24">
      <div className="wrap flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-head text-[17px] font-bold uppercase tracking-[0.22em]">{BRAND}</span>
          <span className="lbl text-tx-3">Ремонт квартир · {CITY}</span>
        </div>
        <div className="lbl flex flex-wrap gap-6 text-tx-2">
          <a className="ui-dim ui-focus text-inherit no-underline" href="tel:+79000000000">{PHONE}</a>
          <span>Ежедневно 9:00–21:00</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Hero />
      <main>
        <Stats />
        <Services />
        <Calc />
        <Works />
        <Steps />
        <Reviews />
        <Lead />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="dark" />}
    </>
  );
}
