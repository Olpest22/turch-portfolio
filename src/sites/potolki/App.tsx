import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED, imgOr, phoneOr, telOf } from '@/shared/brand';
import { PitchLogo } from '@/shared/PitchLogo';

const BRAND = brandOr('Глянец');
const CITY = cityOr('Москва и область');
import type { Light, Texture } from './Room3D';
import ShinyText from '@/shared/rb/ShinyText';
import { BASE } from '@/lib/base';

const Room3D = lazy(() => import('./Room3D'));
const IMG = (n: string) => imgOr(n, `${BASE}img/potolki/${n}.webp`);
const MD = (n: string) => imgOr(n, `${BASE}img/potolki/${n}-md.webp`);
const VIDEO = `${BASE}video/surface.mp4`;
const PHONE = phoneOr('+7 (900) 000-00-00');
const TEL = telOf(PHONE);

/* ───────────── scroll-scrubbed surface hero (Cast & Render) ───────────── */
const CUES: [number, number, number, number][] = [
  [0.0, 0.0, 0.15, 0.23],
  [0.35, 0.43, 0.57, 0.65],
  [0.77, 0.85, 1.1, 1.2],
];
const DRIFT = 22;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const ramp = (p: number, a: number, b: number) => (b <= a ? (p >= b ? 1 : 0) : smooth(clamp((p - a) / (b - a), 0, 1)));

const PANELS = [
  { eyebrow: `Натяжные потолки · ${CITY}`, h: ['Ровный потолок', 'за один день.'], sub: 'Матовые, сатиновые и глянцевые полотна. Монтаж без пыли и без выноса мебели.', cta: ['Примерить потолок', '#config'] },
  { eyebrow: 'Полотно', h: ['Гладко.', 'Без единого шва.'], sub: 'Бесшовные полотна шириной до 5 метров. Немецкие и французские плёнки с сертификатами.', cta: ['Посмотреть цены', '#prices'] },
  { eyebrow: 'Свет', h: ['Свет, встроенный', 'в потолок.'], sub: 'Световые линии, парящие контуры и треки. Закладные и проводку делаем в тот же день.', cta: ['Вызвать замерщика', '#lead'] },
];

function ScrubHero() {
  const track = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const meter = useRef<HTMLElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [boot, setBoot] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = clip.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progress = 0;
    let duration = 0;
    let seekTo = 0;
    let seekAt = 0;
    let ok = false;
    let started = false;
    let attached = false;
    let raf = 0;
    let alive = true;

    const readScroll = () => {
      const el = track.current;
      if (!el) return;
      const max = el.offsetHeight - window.innerHeight;
      progress = max > 0 ? clamp(-el.getBoundingClientRect().top / max, 0, 1) : 0;
      if (duration) seekTo = progress * (duration - 0.05);
    };
    const paint = () => {
      if (meter.current) meter.current.style.transform = `scaleX(${progress})`;
      panels.current.forEach((el, i) => {
        if (!el) return;
        const c = CUES[i];
        const enter = ramp(progress, c[0], c[1]);
        const leave = ramp(progress, c[2], c[3]);
        const o = enter * (1 - leave);
        const y = reduced ? 0 : (1 - enter) * DRIFT - leave * DRIFT;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0,${y}px,0)`;
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
      });
    };
    // Frames are all-intra keyframes, so seeking lands exactly; easing currentTime turns a jumpy scrub into a smooth one.
    if (EMBED) {
      // Inside the portfolio comparison: show the first panel over a still frame, no 10 MB video.
      setReady(true);
      readScroll();
      paint();
      return;
    }
    let inView = true;
    let lastPainted = -1;
    const frame = () => {
      if (!alive) return;
      let moving = false;
      if (ok && duration) {
        const gap = seekTo - seekAt;
        if (Math.abs(gap) > 0.0008) {
          moving = true;
          seekAt += gap * 0.115;
          if (v.readyState >= 2 && !v.seeking) {
            try {
              v.currentTime = seekAt;
            } catch {
              /* ignore */
            }
          }
        }
      }
      if (progress !== lastPainted) {
        paint();
        lastPainted = progress;
      }
      // Sleep when the hero is off screen or the scrub has settled; scroll wakes it up.
      raf = inView && (moving || !ok) ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (!raf && alive && inView) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) wake();
    });
    if (track.current) io.observe(track.current);
    const start = () => {
      if (started) return;
      started = true;
      ok = true;
      setReady(true);
      readScroll();
      seekAt = seekTo;
      wake();
    };
    const attach = (src: string) => {
      if (attached) return;
      attached = true;
      v.addEventListener('loadedmetadata', () => {
        duration = v.duration || 0;
        v.pause();
        readScroll();
        seekAt = seekTo;
        try {
          v.currentTime = seekAt;
        } catch {
          /* ignore */
        }
      });
      v.addEventListener('loadeddata', start);
      v.addEventListener('canplaythrough', start);
      v.addEventListener('error', start);
      v.src = src;
      v.load();
      window.setTimeout(start, 9000);
    };
    // Fetch the whole clip as a blob first: seeking inside a buffered blob is instant, range requests are a slideshow.
    const ctrl = new AbortController();
    const bail = window.setTimeout(() => {
      if (!attached) {
        ctrl.abort();
        setBoot(1);
        attach(VIDEO);
      }
    }, 12000);
    fetch(VIDEO, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok || !res.body) throw new Error('fetch');
        const total = +(res.headers.get('content-length') || 0);
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let got = 0;
        for (;;) {
          const r = await reader.read();
          if (r.done) break;
          chunks.push(r.value);
          got += r.value.length;
          setBoot(total ? got / total : Math.min(got / 11e6, 0.95));
        }
        return new Blob(chunks, { type: 'video/mp4' });
      })
      .then((blob) => {
        window.clearTimeout(bail);
        setBoot(1);
        attach(URL.createObjectURL(blob));
      })
      .catch(() => {
        window.clearTimeout(bail);
        setBoot(1);
        attach(VIDEO);
      });
    // iOS paints no frame from a video that has never played: nudge once on first interaction.
    const unlock = () => {
      const p = v.play();
      if (p && p.then) p.then(() => v.pause()).catch(() => {});
      else v.pause();
    };
    ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { once: true, passive: true }));
    const onScroll = () => {
      readScroll();
      wake();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    readScroll();
    paint();
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(raf);
      ctrl.abort();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <div className={`boot ${ready ? 'done' : ''}`} aria-hidden={ready}>
        <div className="bar"><i style={{ transform: `scaleX(${boot})` }} /></div>
        <p>ЗАГРУЗКА {Math.round(boot * 100)}%</p>
      </div>
      <i ref={meter} className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left bg-fg opacity-55" style={{ transform: 'scaleX(0)' }} />
      <section ref={track} className="relative" style={{ height: '460vh', minHeight: 2800 }} aria-label="Главный экран">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <video ref={clip} muted playsInline preload="auto" poster={`${BASE}video/surface-poster.webp`} disablePictureInPicture className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 scale-[1.02] object-cover" style={{ filter: 'contrast(1.02)' }} />
          <div className="stage-veil" />
          <div className="grain" />
          {PANELS.map((p, i) => (
            <div key={i} ref={(el) => { panels.current[i] = el; }} className="panel">
              <div className="eyebrow mb-5">{p.eyebrow}</div>
              {i === 0 ? (
                <h1 className="d1 max-w-[15ch]">{p.h[0]}<br />{p.h[1]}</h1>
              ) : (
                <h2 className="d1 max-w-[15ch]">{p.h[0]}<br />{p.h[1]}</h2>
              )}
              <p className="sub mt-6 max-w-[46ch]">{p.sub}</p>
              <div className="mt-10">
                <a href={p.cta[1]} className="pill pill-lg ui-press ui-press--on-dark ui-focus">{p.cta[0]}</a>
              </div>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-6 text-center text-[12px] tracking-[0.04em] text-fg-faint">Листайте, чтобы разгладить полотно</div>
        </div>
      </section>
    </>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40" style={{ background: 'linear-gradient(to bottom, rgba(242,240,236,.94) 0%, rgba(242,240,236,.78) 72%, rgba(242,240,236,0) 100%)' }}>
      <div className="flex items-center justify-between gap-3 px-[clamp(16px,3.4vw,44px)] pb-4 pt-[max(14px,calc(env(safe-area-inset-top,0px)+12px))]">
        <a href="#" className="ui-dim ui-focus flex items-center gap-2.5 text-[17px] tracking-[-0.012em] text-fg no-underline">
          <PitchLogo size={26}><span aria-hidden="true" className="opacity-85">✵</span></PitchLogo>{BRAND}
        </a>
        <nav className="flex items-center gap-[clamp(14px,2.4vw,32px)]" aria-label="Разделы">
          {[
            ['Примерка', '#config'],
            ['Цены', '#prices'],
            ['Работы', '#works'],
          ].map(([t, h]) => (
            <a key={t} href={h} className="ui-dim ui-focus hidden text-[14.5px] text-fg no-underline opacity-90 md:inline">{t}</a>
          ))}
          <a href="#lead" className="pill ui-press ui-press--on-dark ui-focus">Вызвать замерщика</a>
        </nav>
      </div>
    </header>
  );
}

/* ───────────── 3D configurator ───────────── */
const TEXTURES: [Texture, string, number][] = [
  ['matte', 'Матовый', 590],
  ['satin', 'Сатин', 690],
  ['gloss', 'Глянец', 790],
];
const COLORS: [string, string, number][] = [
  ['#f7f6f3', 'Белый', 0],
  ['#ece2d0', 'Молочный', 60],
  ['#2b2c2f', 'Графит', 140],
];
const LIGHTS: [Light, string][] = [
  ['none', 'Без подсветки'],
  ['float', 'Парящий'],
  ['lines', 'Световые линии'],
  ['spots', 'Споты'],
];

function Configurator() {
  const [texture, setTexture] = useState<Texture>('gloss');
  const [color, setColor] = useState(COLORS[0][0]);
  const [light, setLight] = useState<Light>('float');
  const [area, setArea] = useState(18);
  const [mount, setMount] = useState(false);
  const [active, setActive] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setActive(e.isIntersecting);
      if (e.isIntersecting) setMount(true);
    }, { rootMargin: '200px' });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const price = useMemo(() => {
    const base = TEXTURES.find((t) => t[0] === texture)![2] + COLORS.find((c) => c[0] === color)![2];
    const per = 4 * Math.sqrt(area);
    const extra = light === 'float' ? per * 1200 : light === 'lines' ? area * 0.6 * 2900 : light === 'spots' ? Math.ceil(area / 4) * 450 : 0;
    return Math.max(9900, area * base + extra);
  }, [texture, color, light, area]);

  return (
    <section id="config" className="relative z-10 bg-paper py-24 md:py-32">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="eyebrow mb-4">3D-примерка</div>
            <h2 className="d2">Соберите потолок и сразу узнайте цену</h2>
          </div>
          <p className="sub md:col-span-5">Меняйте фактуру, цвет и свет — комната перестраивается вживую. Двигайте мышью или пальцем, чтобы осмотреться.</p>
        </div>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
          <div ref={box} className="card relative aspect-[4/3.4] min-w-0 overflow-hidden sm:aspect-[16/11] lg:col-span-8">
            {mount ? (
              <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-paper-2" />}>
                <Room3D active={active} texture={texture} color={color} light={light} />
              </Suspense>
            ) : (
              <div className="absolute inset-0 bg-paper-2" />
            )}
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/85 px-3.5 py-1.5 text-[13px] text-fg-soft backdrop-blur">
              {TEXTURES.find((t) => t[0] === texture)![1]} · {COLORS.find((c) => c[0] === color)![1].toLowerCase()} · {LIGHTS.find((l) => l[0] === light)![1].toLowerCase()}
            </div>
          </div>

          <div className="card flex flex-col p-6 md:p-8 lg:col-span-4">
            <div className="eyebrow">Фактура</div>
            <div className="seg mt-3" role="radiogroup" aria-label="Фактура">
              {TEXTURES.map(([id, t]) => (
                <button key={id} type="button" role="radio" aria-checked={texture === id} onClick={() => setTexture(id)} className="ui-press ui-focus">{t}</button>
              ))}
            </div>
            <div className="eyebrow mt-7">Цвет</div>
            <div className="mt-3 flex gap-3" role="radiogroup" aria-label="Цвет">
              {COLORS.map(([c, t]) => (
                <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={t} onClick={() => setColor(c)} className="ui-press ui-focus flex flex-col items-center gap-2 rounded-2xl p-1.5 text-[13px] text-fg-soft" style={{ boxShadow: color === c ? 'inset 0 0 0 1.5px #0d0c0b' : 'none' }}>
                  <span className="block h-11 w-11 rounded-xl" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
                  {t}
                </button>
              ))}
            </div>
            <div className="eyebrow mt-7">Свет</div>
            <div className="seg mt-3" role="radiogroup" aria-label="Подсветка">
              {LIGHTS.map(([id, t]) => (
                <button key={id} type="button" role="radio" aria-checked={light === id} onClick={() => setLight(id)} className="ui-press ui-focus">{t}</button>
              ))}
            </div>
            <div className="mt-7 flex items-baseline justify-between">
              <label htmlFor="ar" className="eyebrow">Площадь комнаты</label>
              <span className="text-[20px] font-medium tabular-nums">{area} м²</span>
            </div>
            <input id="ar" className="rng mt-2" type="range" min={6} max={60} value={area} onChange={(e) => setArea(+e.target.value)} style={{ ['--p' as string]: `${((area - 6) / 54) * 100}%` }} />
            <div className="mt-6 border-t border-[var(--rule)] pt-6">
              <div className="eyebrow">Под ключ, с монтажом</div>
              <div className="mt-2 text-[40px] font-medium leading-none tracking-[-0.03em] tabular-nums" aria-live="polite">{rub(price)}</div>
            </div>
            <a href="#lead" className="pill pill-lg ui-press ui-press--on-dark ui-focus mt-6 w-full">Зафиксировать цену</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── install day timeline ───────────── */
const DAY = [
  ['09:00', 'Приезд бригады', 'Накрываем мебель и пол плёнкой. Выносить ничего не нужно.'],
  ['10:00', 'Профиль и закладные', 'Ставим багет по лазерному уровню, закладные под свет и карнизы.'],
  ['12:30', 'Полотно', 'Натягиваем полотно, разглаживаем, проверяем углы.'],
  ['15:00', 'Свет', 'Подключаем линии, споты и парящий контур. Проверяем каждую группу.'],
  ['16:30', 'Уборка и сдача', 'Убираем за собой и подписываем гарантию на 15 лет.'],
];
function Day() {
  return (
    <section className="border-y border-[var(--rule)] bg-paper-2 py-24 md:py-32">
      <div className="wrap">
        <div className="eyebrow mb-4">Монтаж</div>
        <h2 className="d2 max-w-[18ch]">Один день от первого шурупа до уборки</h2>
        <ol className="mt-14 grid gap-8 md:grid-cols-5 md:gap-5">
          {DAY.map(([t, h, d], k) => (
            <li key={t} className="relative">
              <div className="flex items-center gap-3">
                <span className="text-[30px] font-medium tracking-[-0.03em] tabular-nums">{t}</span>
                {k < DAY.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-[var(--rule)] md:block" />}
              </div>
              <h3 className="d3 mt-4">{h}</h3>
              <p className="mt-2 text-[15px] text-fg-soft">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── prices ───────────── */
const PRICES = [
  ['Матовое полотно', 'от 590 ₽/м²', 'Классика без бликов'],
  ['Сатин', 'от 690 ₽/м²', 'Мягкий перламутровый отлив'],
  ['Глянец', 'от 790 ₽/м²', 'Зеркально отражает комнату'],
  ['Парящий контур', 'от 1 200 ₽/м.п.', 'Светодиодная лента по периметру'],
  ['Световые линии', 'от 2 900 ₽/м.п.', 'Встроенный профиль с рассеивателем'],
  ['Споты', 'от 450 ₽/шт.', 'Точечные светильники с закладными'],
];
function Prices() {
  return (
    <section id="prices" className="py-24 md:py-32">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="eyebrow mb-4">Цены</div>
          <h2 className="d2">Цена с монтажом, без доплат на месте</h2>
          <p className="sub mt-6">Профиль, полотно, работа и уборка входят в цену. Замер и выезд — бесплатно.</p>
        </div>
        <div className="lg:col-span-8">
          {PRICES.map(([n, p, d]) => (
            <div key={n} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-[var(--rule)] py-6 first:border-t md:grid-cols-[1fr_1fr_auto]">
              <div className="d3">{n}</div>
              <div className="order-3 text-[15px] text-fg-soft md:order-none">{d}</div>
              <div className="text-[20px] font-medium tabular-nums">{p}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── works ───────────── */
const WORKS = [
  ['lines', 'Световые линии в гостиной', 'Матовый · 34 м² · 1 день'],
  ['living', 'Кухня-гостиная с парящим контуром', 'Сатин · 42 м² · 1 день'],
  ['hall', 'Гостиная со споты и нишей', 'Матовый · 26 м² · 1 день'],
  ['bedroom', 'Спальня без единого шва', 'Матовый · 16 м² · 5 часов'],
];
function Works() {
  return (
    <section id="works" className="pb-24 md:pb-32">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-4">Работы</div>
            <h2 className="d2">Потолки, которые мы натянули</h2>
          </div>
          <ShinyText text="Фото с объектов" className="text-[15px]" color="rgba(13,12,11,.5)" shineColor="#0d0c0b" />
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {WORKS.map(([img, t, m], k) => (
            <figure key={img} className={`gal m-0 overflow-hidden rounded-[22px] bg-paper-2 ${k === 0 ? 'md:row-span-2' : ''}`}>
              <div className="overflow-hidden" style={{ aspectRatio: k === 0 ? '4 / 5' : '16 / 9' }}>
                <img src={k === 0 ? IMG(img) : MD(img)} alt={t} loading="lazy" className="gal-img h-full w-full object-cover" />
              </div>
              <figcaption className="flex items-baseline justify-between gap-4 px-5 py-4">
                <span className="text-[17px] font-medium">{t}</span>
                <span className="shrink-0 text-[14px] text-fg-soft">{m}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── faq + lead ───────────── */
const FAQ = [
  ['Нужно ли выносить мебель?', 'Нет. Мебель сдвигаем к центру и накрываем плёнкой. Шкафы до потолка — обсудим на замере.'],
  ['Сколько служит натяжной потолок?', 'Больше 20 лет. На полотно и монтаж даём гарантию 15 лет.'],
  ['Что будет, если зальют соседи?', 'Полотно выдерживает до 100 литров воды на м². Приезжаем, сливаем воду, полотно возвращается в форму.'],
  ['Есть ли запах после монтажа?', 'Используем сертифицированные плёнки класса A+. Лёгкий запах уходит за несколько часов проветривания.'],
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
    <section id="lead" className="border-t border-[var(--rule)] bg-paper-2 py-24 md:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="eyebrow mb-4">Вопросы</div>
          <h2 className="d2">Что спрашивают чаще всего</h2>
          <div className="mt-10 border-t border-[var(--rule)]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq border-b border-[var(--rule)]">
                <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[18px] font-medium">
                  {q}
                  <span aria-hidden="true" className="chev text-[24px] font-normal">+</span>
                </summary>
                <p className="m-0 pb-6 text-fg-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="card p-7 md:p-10">
            <div className="eyebrow">Бесплатный замер</div>
            <h2 className="d2 mt-4">Замерщик приедет с образцами</h2>
            <p className="sub mt-4">Покажет полотна вживую, посчитает точную цену и оставит договор. Ни к чему не обязывает.</p>
            {st === 'done' ? (
              <div className="mt-8 rounded-2xl p-6" style={{ boxShadow: 'inset 0 0 0 1.5px #0d0c0b' }} role="status">
                <div className="d3">Заявка принята</div>
                <p className="mt-2 text-fg-soft">Это демо-сайт студии TURCH: заявка никуда не отправилась. На вашем сайте она придёт в Telegram или CRM.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-8 grid gap-3">
                <label htmlFor="ph" className="sr-only">Телефон</label>
                <input id="ph" className="field" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'ph-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
                {st === 'error' && <p id="ph-e" className="m-0 px-2 text-[14px] text-[#c0392b]">Нужно 10 цифр после +7.</p>}
                <button type="submit" className="pill pill-lg ui-press ui-press--on-dark ui-focus w-full" aria-busy={st === 'pending'}>{st === 'pending' ? 'Отправляем…' : 'Вызвать замерщика'}</button>
                <p className="m-0 px-2 text-[13px] text-fg-faint">Перезвоним в течение 15 минут, ежедневно с 9 до 21.</p>
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
    <footer className="py-10 pb-24 text-[13px] text-fg-faint">
      <div className="wrap flex flex-col gap-3 md:flex-row md:justify-between">
        <span><span className="text-fg">✵ {BRAND}</span> · натяжные потолки · {CITY}</span>
        <span><a className="ui-dim ui-focus text-fg no-underline" href={TEL}>{PHONE}</a> · ежедневно 9:00–21:00</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <ScrubHero />
      <main className="relative z-10 bg-paper">
        <Configurator />
        <Day />
        <Prices />
        <Works />
        <Lead />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="light" />}
    </>
  );
}
