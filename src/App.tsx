import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CH, CHANNELS, isChannel, type Channel } from './lib/contact';
import { NICHES, type Demo } from './lib/niches';
import { BASE } from '@/lib/base';

/* ───────────────────────── lead personalisation ─────────────────────────
   Outreach links look like  /?n=potolki&name=Потолки%20Люкс&city=Барнаул   (see /link/) */
const q = new URLSearchParams(window.location.search);
const clean = (v: string | null) => (v || '').replace(/\s+/g, ' ').trim().slice(0, 42);
const LEAD = {
  name: clean(q.get('name')),
  city: clean(q.get('city')),
  niche: NICHES[clean(q.get('n'))] ? clean(q.get('n')) : 'remont',
};
const NICHE = NICHES[LEAD.niche];
const named = !!LEAD.name;
const quoted = named ? `«${LEAD.name}»` : '';

const FREE_TEXT = named
  ? `Здравствуйте! Пишу из ${quoted}${LEAD.city ? `, ${LEAD.city}` : ''}. Хочу бесплатно посмотреть первый экран сайта.`
  : 'Здравствуйте! Хочу бесплатно посмотреть первый экран сайта для своего бизнеса.';
/* the lead answers in the messenger the link came in (?c=whatsapp from the tracker), else the first configured one */
const cParam = q.get('c') || '';
const PRIMARY: Channel = isChannel(cParam) ? cParam : CHANNELS[0];
const chUrl = (c: Channel) => CH[c].url(FREE_TEXT);
const CTA = chUrl(PRIMARY);

const DEMOS: Record<Demo, { title: string; niche: string; points: string[] }> = {
  remont: { title: 'Ремонт квартир', niche: 'remont', points: ['Этапы ремонта прямо на первом экране', 'Калькулятор сметы: площадь, тип ремонта, опции', 'Фото объектов с фильтром', 'Заявка на замер сразу вам в мессенджер'] },
  potolki: { title: 'Натяжные потолки', niche: 'potolki', points: ['Полотно «разглаживается» при прокрутке', '3D-примерка: фактура, цвет и подсветка', 'Цена считается сразу', 'Вызов замерщика в один клик'] },
  mebel: { title: 'Мебель на заказ', niche: 'mebel', points: ['Лента работ, которую можно листать пальцем', 'Конфигуратор шкафа с ценой', 'Комнаты: гардеробные, кухни, гостиные', 'Запись в шоурум в один клик'] },
  kuhni: { title: 'Кухни на заказ', niche: 'kuhni', points: ['Конструктор кухни: планировка, фасады, столешница', 'Кухня рисуется вживую, цена считается сразу', 'Стили и фото готовых кухонь', 'Запись на замер в один клик'] },
  vyveski: { title: 'Вывески и реклама', niche: 'vyveski', points: ['Название клиента горит неоном на первом экране', 'Конструктор вывески: текст, тип, цвет, размер', 'Цена с монтажом сразу', 'Заявка на визуализацию в один клик'] },
  kuzov: { title: 'Кузовной ремонт', niche: 'kuzov', points: ['Схема машины: нажмите на деталь — увидите цену', 'Оценка по фото с загрузкой снимков', 'Услуги цеха с ценами', 'Заявка сразу с фото'] },
};
const demoUrl = (d: Demo, embed = false) => {
  const p = new URLSearchParams();
  if (embed) p.set('embed', '1');
  if (LEAD.name) p.set('brand', LEAD.name);
  if (LEAD.city) p.set('city', LEAD.city);
  const s = p.toString();
  return `${BASE}${d}/${s ? `?${s}` : ''}`;
};

/* ───────────────────────── small helpers ───────────────────────── */
const CH_ICON: Record<Channel, string> = {
  telegram: 'M21.5 3.6 2.9 10.8c-1.3.5-1.2 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.7.4.9.9.9.4 0 .6-.2.9-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.1c.3-1.3-.5-1.9-1.4-1.6ZM9.6 14.4l9-5.7c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3-1.6-4.7Z',
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z',
  max: 'M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm-4 7h8M8 13h5',
  instagram: 'M7.5 2.5h9a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5Zm4.5 5.2a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Zm5.3-1.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
};
function ChIcon({ c }: { c: Channel }) {
  const line = c === 'max' || c === 'instagram';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={line ? 'none' : 'currentColor'} stroke={line ? 'currentColor' : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={CH_ICON[c]} />
    </svg>
  );
}
/** Every configured messenger, for the final block. */
function Channels({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {CHANNELS.map((c) => (
        <a key={c} href={chUrl(c)} target="_blank" rel="noopener" className={`btn ${c === PRIMARY ? 'btn-a' : 'btn-b ui-press--on-dark'} ui-press ui-focus`}>
          <ChIcon c={c} />
          {CH[c].label}
        </a>
      ))}
    </div>
  );
}
function Ico({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a919c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const I_PIN = 'M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z';
const I_CLOCK = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2';
const I_GLOBE = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z';
const I_PHONE = 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z';

/* ───────────────────────── "now": the lead's map listing ───────────────────────── */
function MapListing({ phone }: { phone: boolean }) {
  const name = LEAD.name || 'Ваша компания';
  const rivals = [0, 1, 2];
  const card = (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((k) => (
          <div key={k} className="grid place-items-center rounded-lg bg-[#eef0f3]" style={{ height: phone ? 64 : 96 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b6bcc6" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6" /></svg>
          </div>
        ))}
      </div>
      <div className="mt-4 truncate font-bold leading-tight" style={{ fontSize: phone ? 22 : 26 }}>{name}</div>
      <div className="mt-1 text-[15px] text-[#6b7280]">{NICHE.label}</div>
      <div className="mt-2 flex items-center gap-2 text-[15px]"><span className="tracking-[2px] text-[#f5a623]">★★★★★</span><span className="text-[#6b7280]">отзывы</span></div>
      <div className="mt-4 flex gap-2">
        <span className="flex-1 rounded-xl bg-[#2d7ff9] py-3 text-center text-[15px] font-semibold text-white">Маршрут</span>
        <span className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-[#1f2328]" style={{ boxShadow: 'inset 0 0 0 1.5px #dde1e6' }}><Ico d={I_PHONE} />Позвонить</span>
      </div>
      <div className="mt-4 grid gap-3 border-t border-[#eceef1] pt-4 text-[15px]">
        <div className="flex items-center gap-3"><Ico d={I_PIN} />{LEAD.city ? <span className="truncate">{LEAD.city}</span> : <span className="sk w-40" />}</div>
        <div className="flex items-center gap-3"><Ico d={I_CLOCK} /><span className="sk w-32" /></div>
        <div className="flex items-center gap-3"><Ico d={I_GLOBE} /><span className="nosite">Сайт не указан</span></div>
      </div>
      {!phone && (
        <div className="mt-5 border-t border-[#eceef1] pt-4">
          <div className="text-[14px] font-semibold text-[#6b7280]">Похожие места рядом</div>
          {rivals.map((k) => (
            <div key={k} className="mt-3 flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-[#e3e6ea]" />
              <div className="min-w-0 flex-1">
                <span className="sk" style={{ width: [150, 120, 170][k] }} />
                <div className="mt-2 flex items-center gap-2"><span className="ad">Реклама</span><span className="site-yes">сайт ↗</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
  return (
    <div className="map">
      <svg className="roads" viewBox={phone ? '0 0 390 844' : '0 0 1440 900'} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {phone ? (
          <>
            <path d="M-20 140C120 120 200 210 410 180" stroke="#cfe3f3" strokeWidth="34" fill="none" />
            <rect x="230" y="250" width="140" height="110" rx="14" fill="#d7ead0" />
            <path d="M-10 300H400M120 -10V460M300 -10V460M-10 60L400 420" stroke="#fff" strokeWidth="16" fill="none" />
            <path d="M-10 230H400M60 -10V460M210 -10V460" stroke="#fff" strokeWidth="7" fill="none" />
          </>
        ) : (
          <>
            <path d="M-20 140C240 90 420 260 1060 200" stroke="#cfe3f3" strokeWidth="60" fill="none" />
            <rect x="560" y="520" width="260" height="190" rx="22" fill="#d7ead0" />
            <path d="M-20 420H1060M300 -20V920M600 -20V920M900 -20V920M-20 760L1060 300" stroke="#fff" strokeWidth="22" fill="none" />
            <path d="M-20 300H1060M-20 600H1060M160 -20V920M450 -20V920M750 -20V920" stroke="#fff" strokeWidth="9" fill="none" />
          </>
        )}
      </svg>
      {(phone ? [[60, 40], [300, 70], [230, 110]] : [[180, 230], [760, 320], [430, 690], [120, 820], [620, 560]]).map(([x, y], k) => (
        <span key={k} className="pin" style={{ left: x, top: y }} />
      ))}
      <span className="pin me" style={phone ? { left: 168, top: 72 } : { left: 470, top: 400 }} />
      <div className="sheet" style={phone ? { left: 0, right: 0, top: 150, bottom: 0, borderRadius: '22px 22px 0 0', padding: '14px 18px' } : { right: 18, top: 18, bottom: 18, width: 440, borderRadius: 18, padding: 22 }}>
        {phone && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d9dde2]" />}
        {card}
      </div>
    </div>
  );
}

/* ───────────────────────── before / after window ───────────────────────── */
function Compare() {
  const win = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const [phone, setPhone] = useState(() => window.innerWidth < 900);
  const [loadFrame, setLoadFrame] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const st = useRef({ x: 6, target: 6, raf: 0, touched: false, drag: false });
  const [xs, setXs] = useState(6);

  useEffect(() => {
    const el = win.current!;
    const fit = () => {
      const p = window.innerWidth < 900;
      setPhone(p);
      const [cw] = p ? [390] : [1440];
      el.style.setProperty('--s', String(el.clientWidth / cw));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    // Paint the page first; the live example loads right after.
    const t = window.setTimeout(() => setLoadFrame(true), 500);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const set = (v: number) => {
    st.current.x = v;
    win.current?.style.setProperty('--x', `${v}%`);
    setXs(Math.round(v));
    handle.current?.setAttribute('aria-valuenow', String(Math.round(v)));
  };
  const go = (v: number) => {
    const s = st.current;
    s.target = Math.max(2, Math.min(98, v));
    const loop = () => {
      s.x += (s.target - s.x) * 0.16;
      set(s.x);
      s.raf = Math.abs(s.target - s.x) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    if (!s.raf) s.raf = requestAnimationFrame(loop);
  };

  // Intro: the lead first sees their own listing, then the site slides in.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return set(50);
    const t = window.setTimeout(() => !st.current.touched && go(phone ? 62 : 56), frameReady ? 500 : 2600);
    return () => window.clearTimeout(t);
  }, [frameReady]);

  const pos = (e: React.PointerEvent) => {
    const r = win.current!.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  const [cw, ch] = phone ? [390, 844] : [1440, 900];
  return (
    <div
      ref={win}
      className="win"
      style={{ ['--ar' as string]: phone ? '390 / 540' : '1440 / 900', ['--x' as string]: '6%' }}
      onPointerDown={(e) => {
        st.current.drag = st.current.touched = true;
        handle.current?.classList.add('drag');
        win.current!.setPointerCapture(e.pointerId);
        go(pos(e));
      }}
      onPointerMove={(e) => st.current.drag && go(pos(e))}
      onPointerUp={() => {
        st.current.drag = false;
        handle.current?.classList.remove('drag');
      }}
      onPointerCancel={() => {
        st.current.drag = false;
        handle.current?.classList.remove('drag');
      }}
    >
      <div className="canvas" style={{ ['--cw' as string]: `${cw}px`, ['--ch' as string]: `${ch}px` }}>
        <div className="layer-after" style={{ backgroundImage: `url(${BASE}shots/${NICHE.demo}-hero${phone ? '-m' : ''}.webp)` }}>
          {loadFrame && (
            <iframe
              key={phone ? 'p' : 'd'}
              src={demoUrl(NICHE.demo, true)}
              title={`Пример сайта: ${NICHE.label}`}
              tabIndex={-1}
              aria-hidden="true"
              className={frameReady ? 'ready' : ''}
              onLoad={() => window.setTimeout(() => setFrameReady(true), 900)}
            />
          )}
        </div>
        <div className="layer-before" aria-hidden="true">
          <MapListing phone={phone} />
        </div>
      </div>
      <span className={`wtag l ${xs < 22 ? 'hide' : ''}`}>С сайтом</span>
      <span className={`wtag r ${xs > 70 ? 'hide' : ''}`}>Сейчас<span className="hidden sm:inline">: только Карты</span></span>
      <div className="divider">
        <button
          ref={handle}
          className="handle"
          type="button"
          role="slider"
          aria-label="Сравнить: карточка на Картах и сайт"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={6}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              st.current.touched = true;
              go(st.current.target + (e.key === 'ArrowLeft' ? -6 : 6));
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M9 7 3 13l6 6M17 7l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── sections ───────────────────────── */
function Header() {
  return (
    <header className="wrap flex h-[72px] items-center justify-between">
      <a href="#" className="ui-dim ui-focus font-display text-[19px] font-extrabold tracking-[0.1em] text-tx no-underline" aria-label="TURCH, наверх">TURCH</a>
      <a href={CTA} target="_blank" rel="noopener" className="btn btn-a ui-press ui-focus" style={{ height: 42, padding: '0 16px', fontSize: 15 }}>
        <ChIcon c={PRIMARY} />
        Написать
      </a>
    </header>
  );
}

function Hero() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <section className="wrap grid items-center gap-x-12 gap-y-7 pb-16 pt-2 lg:grid-cols-12 lg:pb-24" aria-labelledby="hero-title">
      <div className={`rise lg:col-span-5 lg:row-start-1 lg:self-end ${shown ? 'in' : ''}`}>
        {named && (
          <div className="chip mb-5">
            Для {quoted}
            {LEAD.city ? ` · ${LEAD.city}` : ''}
          </div>
        )}
        <h1 id="hero-title" className={`h1 m-0 ${named ? 'text-[clamp(32px,3.4vw,50px)]' : ''}`}>
          {named ? (
            <>
              {quoted}, вот каким может быть <span className="text-accent">ваш сайт</span>
            </>
          ) : (
            <>
              Вас нашли на Картах. Дальше нужен <span className="text-accent">сайт</span>
            </>
          )}
        </h1>
      </div>
      <div className={`rise lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 ${shown ? 'in' : ''}`} style={{ transitionDelay: '120ms' }}>
        <Compare />
      </div>
      <div className={`rise lg:col-span-5 lg:row-start-2 lg:self-start ${shown ? 'in' : ''}`} style={{ transitionDelay: '60ms' }}>
        <p className="lead m-0 max-w-[30rem]">Потяните ползунок: справа то, что клиент видит сейчас, слева — сайт с ценами, работами и заявкой в один клик.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={CTA} target="_blank" rel="noopener" className="btn btn-a ui-press ui-focus">
            <ChIcon c={PRIMARY} />
            Получить первый экран бесплатно
          </a>
        </div>
        <p className="mb-0 mt-4 text-[15px] text-tx-3">Пришлю за 24 часа. Весь сайт — от 15 000 ₽ за 5–7 дней.</p>
      </div>
    </section>
  );
}

const WHY: [string, string][] = [
  ['На карточке показывают конкурентов', 'Под вашей карточкой — «похожие места» и реклама соседей. На своём сайте клиент видит только вас.'],
  ['Сайт отвечает на вопросы до звонка', 'Цены, сроки, фото работ. Клиент приходит уже готовым заказать, а не «просто узнать».'],
  ['Заявки приходят, пока вы на объекте', 'Заявка с расчётом приходит вам в мессенджер или на почту круглосуточно, без пропущенных звонков.'],
  ['Свой сайт выглядит солиднее', 'Когда клиент выбирает между двумя компаниями, аккуратный сайт часто решает в вашу пользу.'],
];
function Why() {
  return (
    <section className="rule py-20 md:py-28" aria-labelledby="why-title">
      <div className="wrap">
        <h2 id="why-title" className="h2 m-0 max-w-[20ch]">Зачем сайт, если есть Карты</h2>
        <ol className="m-0 mt-12 grid list-none gap-x-12 gap-y-10 p-0 md:grid-cols-2">
          {WHY.map(([t, d], k) => (
            <li key={t} className="grid grid-cols-[auto_1fr] gap-5">
              <span className="font-display text-[40px] font-extrabold leading-none text-accent tabular-nums">{k + 1}</span>
              <div>
                <h3 className="h3 m-0">{t}</h3>
                <p className="mb-0 mt-2 text-tx-2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Examples() {
  const order: Demo[] = [NICHE.demo, ...(['remont', 'potolki', 'kuhni', 'mebel', 'vyveski', 'kuzov'] as Demo[]).filter((d) => d !== NICHE.demo)];
  const [tab, setTab] = useState<Demo>(order[0]);
  const d = DEMOS[tab];
  return (
    <section id="examples" className="rule bg-bg-2 py-20 md:py-28" aria-labelledby="ex-title">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="ex-title" className="h2 m-0">Примеры сайтов для вашей ниши</h2>
            <p className="lead mb-0 mt-4 max-w-[36rem]">Это демо-сайты: их можно открыть и полистать. Ваш будет сделан под ваши услуги, цены и фото.</p>
          </div>
          <div className="tabbar" role="tablist" aria-label="Ниши">
            {order.map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="ui-press ui-focus">
                {DEMOS[k].title}
              </button>
            ))}
          </div>
        </div>
        <div key={tab} className="fade-swap mt-12 grid items-center gap-10 lg:grid-cols-12">
          <div className="relative lg:col-span-8">
            <a href={demoUrl(tab)} target="_blank" rel="noopener" className="device ui-press ui-press--surface ui-press--on-dark ui-focus block" aria-label={`Открыть пример: ${d.title}`}>
              <img src={`${BASE}shots/${tab}-hero.webp`} alt={`Первый экран примера: ${d.title}`} loading="lazy" className="block aspect-[16/10] w-full object-cover object-top" />
            </a>
            <div className="phone absolute -bottom-8 right-4 hidden w-[150px] sm:block md:w-[190px]" aria-hidden="true">
              <div style={{ backgroundImage: `url(${BASE}shots/${tab}-hero-m.webp)` }} />
            </div>
          </div>
          <div className="lg:col-span-4">
            <h3 className="h3 m-0 text-[26px]">{d.title}</h3>
            <ul className="m-0 mt-5 grid list-none gap-3 p-0">
              {d.points.map((p) => (
                <li key={p} className="flex gap-3 text-[17px]">
                  <span aria-hidden="true" className="mt-[10px] h-2 w-2 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <a href={demoUrl(tab)} target="_blank" rel="noopener" className="btn btn-b ui-press ui-press--on-dark ui-focus mt-8">
              Открыть пример целиком ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const INCLUDED = [
  'Дизайн под вашу нишу и ваш город',
  'Версия для телефона — с него зайдёт большинство клиентов',
  'Ваши услуги, цены, фото работ и контакты',
  'Заявки с сайта сразу вам: в мессенджер или на почту',
  'Размещение в интернете и подключение домена',
  'Базовая настройка для Яндекса и Google',
];
function Offer() {
  return (
    <section id="price" className="rule py-20 md:py-28" aria-labelledby="offer-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-[22px] bg-bg-3 p-7 md:p-9" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <div className="text-[15px] text-tx-2">Сайт под ключ</div>
            <h2 id="offer-title" className="m-0 mt-2 font-display text-[44px] font-extrabold leading-none tracking-[-0.03em] md:text-[56px]">от 15 000 ₽</h2>
            <div className="mt-3 text-[17px]">Готов за 5–7 дней</div>
            <div className="mt-6 rounded-2xl bg-[rgb(255_107_26_/_0.1)] p-4 text-[15px] leading-snug text-[#ffc4a3]">
              Сначала бесплатно пришлю первый экран вашего сайта. Не понравится — ничего не платите.
            </div>
            <a href={CTA} target="_blank" rel="noopener" className="btn btn-a ui-press ui-focus mt-6 w-full">
              <ChIcon c={PRIMARY} />
              Получить первый экран
            </a>
          </div>
        </div>
        <div className="lg:col-span-7">
          <h3 className="h3 m-0 text-tx-2">Что входит</h3>
          <ul className="m-0 mt-4 list-none p-0">
            {INCLUDED.map((t) => (
              <li key={t} className="flex items-baseline gap-4 border-b border-[var(--line)] py-4 text-[18px]">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 translate-y-[3px]"><path d="m4 12.5 5 5L20 6.5" fill="none" stroke="#ff6b1a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ['Пишете мне', 'В WhatsApp, Telegram или где удобно: пара слов о бизнесе, чем занимаетесь и где.'],
  ['Первый экран за 24 часа', 'Присылаю, как будет выглядеть ваш сайт. Бесплатно.'],
  ['Сайт за 5–7 дней', 'Понравилось — собираю все блоки, тексты и мобильную версию.'],
  ['Запуск', 'Размещаю, подключаю домен и присылаю заявки туда, где вам удобно их получать.'],
];
function Steps() {
  return (
    <section className="rule bg-bg-2 py-20 md:py-28" aria-labelledby="steps-title">
      <div className="wrap">
        <h2 id="steps-title" className="h2 m-0 max-w-[18ch]">Как это работает</h2>
        <ol className="m-0 mt-12 grid list-none gap-8 p-0 md:grid-cols-4 md:gap-6">
          {STEPS.map(([t, d], k) => (
            <li key={t}>
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[20px] font-bold" style={{ background: k === 1 ? 'var(--accent)' : 'transparent', color: k === 1 ? 'var(--accent-ink)' : 'var(--tx)', boxShadow: k === 1 ? 'none' : 'inset 0 0 0 1.5px rgb(244 241 234 / 0.35)' }}>{k + 1}</span>
                {k < STEPS.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-[var(--line)] md:block" />}
              </div>
              <h3 className="h3 m-0 mt-5">{t}</h3>
              <p className="mb-0 mt-2 text-tx-2">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ['Сколько стоит сайт?', 'От 15 000 ₽. Точную цену назову после первого экрана — она зависит от количества блоков и функций.'],
  ['Что, если первый экран не понравится?', 'Ничего не платите. Первый экран бесплатный и ни к чему не обязывает.'],
  ['Что нужно от меня?', 'Название, телефон, список услуг и цены. Если есть фото работ — пришлите, если нет, подберу.'],
  ['Сколько стоит содержание сайта?', 'Размещение — без абонентской платы. Домен в зоне .ru обычно стоит несколько сотен рублей в год.'],
  ['Можно потом поменять цены и тексты?', 'Да. Напишите мне, что поменять, и я внесу правки.'],
];
function Faq() {
  return (
    <section className="rule py-20 md:py-28" aria-labelledby="faq-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <h2 id="faq-title" className="h2 m-0 lg:col-span-4">Частые вопросы</h2>
        <div className="border-t border-[var(--line)] lg:col-span-8">
          {FAQ.map(([qq, a]) => (
            <details key={qq} className="faq border-b border-[var(--line)]">
              <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[18px] font-semibold">
                {qq}
                <span aria-hidden="true" className="plus text-[26px] font-normal text-accent">+</span>
              </summary>
              <p className="m-0 pb-6 text-tx-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section className="rule py-24 md:py-32" aria-labelledby="final-title">
      <div className="wrap text-center">
        <h2 id="final-title" className="h2 mx-auto m-0 max-w-[22ch]">
          {named ? `${quoted}, пришлю первый экран вашего сайта завтра` : 'Пришлю первый экран вашего сайта завтра'}
        </h2>
        <p className="lead mx-auto mb-0 mt-5 max-w-[32rem]">Без предоплаты и обязательств. Напишите пару слов о бизнесе — остальное сделаю сам.</p>
        <Channels className="mt-8" />
        <div className="mt-4 text-[15px] text-tx-3">{CHANNELS.filter((c) => c !== 'max').map((c) => `${CH[c].label} ${CH[c].handle}`).join(' · ')}</div>
      </div>
    </section>
  );
}

function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="rule py-8 pb-28 sm:pb-8">
      <div className="wrap flex flex-col gap-2 text-[14px] text-tx-3 md:flex-row md:justify-between">
        <span className="font-display font-extrabold tracking-[0.1em] text-tx">TURCH</span>
        <span>Примеры на сайте — демо-сайты, компании в них вымышлены. Фото: Pexels.</span>
        {children}
      </div>
    </footer>
  );
}

/* Sticky call to action on phones once the hero is out of view. */
function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.9);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:hidden" style={{ transform: show ? 'none' : 'translateY(120%)', transition: 'transform .35s var(--ease)', background: 'linear-gradient(0deg, rgb(14 13 12 / .96) 60%, transparent)' }} aria-hidden={!show}>
      <a href={CTA} target="_blank" rel="noopener" tabIndex={show ? 0 : -1} className="btn btn-a ui-press ui-focus w-full">
        <ChIcon c={PRIMARY} />
        Первый экран бесплатно
      </a>
    </div>
  );
}

export default function App() {
  useMemo(() => {
    if (named) document.title = `${quoted} — каким может быть ваш сайт · TURCH`;
  }, []);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Why />
        <Examples />
        <Offer />
        <Steps />
        <Faq />
        <Final />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
