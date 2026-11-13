import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import SplitText from '@/shared/rb/SplitText';
import ScrollVelocity from '@/shared/rb/ScrollVelocity';
import ClickSpark from '@/shared/rb/ClickSpark';
import Magnet from '@/shared/rb/Magnet';
import { ContainerScroll } from '@/shared/c21-container-scroll-animation';
import { ThreeDMarquee } from '@/shared/c21-3d-marquee';
import { TG_HANDLE, TG_URL } from './lib/contact';

const Showcase3D = lazy(() => import('./portfolio/Showcase3D'));

const WORKS = [
  {
    id: 'remont',
    href: '/remont/',
    niche: 'Ремонт квартир под ключ',
    brand: 'КЛЮЧ',
    line: 'Тёмный кинематографичный сайт для компании, которая продаёт спокойствие: «вы приезжаете за ключами».',
    shot: '/shots/remont-hero.webp',
    features: ['Первый экран из пяти глав-этапов с параллаксом', 'Калькулятор сметы: площадь, тип ремонта, опции', 'Объекты с фильтром и выезжающими деталями', 'Этапы, которые заполняются на скролле'],
  },
  {
    id: 'potolki',
    href: '/potolki/',
    niche: 'Натяжные потолки',
    brand: 'Глянец',
    line: 'Светлый «журнальный» сайт: полотно разглаживается на скролле, а потолок можно примерить в 3D.',
    shot: '/shots/potolki-hero.webp',
    features: ['Видео-полотно, которое движется вместе со скроллом', '3D-комната: фактура, цвет и свет в реальном времени', 'Цена пересчитывается при каждом изменении', 'Монтаж за один день — таймлайн по часам'],
  },
  {
    id: 'mebel',
    href: '/mebel/',
    niche: 'Мебель на заказ',
    brand: 'Форма и шпон',
    line: 'Чистый белый сайт мебельной мастерской с конфигуратором шкафа, где открываются двери.',
    shot: '/shots/mebel-hero.webp',
    features: ['Лента работ, которую можно тянуть с инерцией', 'Конфигуратор шкафа: размер, фасады, ручки, наполнение', 'Комнаты с плавной подменой фото', 'Галерея работ в стиле масонри'],
  },
];

const MARQUEE_SHOTS = [
  'remont-hero', 'potolki-config', 'mebel-config', 'remont-calc', 'potolki-hero', 'mebel-hero', 'remont-works', 'potolki-works',
  'mebel-rooms', 'remont-steps', 'potolki-prices', 'mebel-works', 'remont-services', 'potolki-lead', 'mebel-materials', 'remont-lead', 'mebel-showroom',
].map((n) => `/shots/${n}-sm.webp`);

function useInView<T extends Element>(margin = '0px') {
  const ref = useRef<T>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, v] as const;
}

/** True once the browser has been idle after load: heavy widgets mount here, not mid-scroll. */
function useIdleReady(delay = 1500) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let id = 0;
    const t = window.setTimeout(() => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) id = ric(() => setReady(true), { timeout: 2500 });
      else setReady(true);
    }, delay);
    return () => {
      window.clearTimeout(t);
      const cic = (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback;
      if (id && cic) cic(id);
    };
  }, [delay]);
  return ready;
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M21.5 3.6 2.9 10.8c-1.3.5-1.2 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.7.4.9.9.9.4 0 .6-.2.9-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.1c.3-1.3-.5-1.9-1.4-1.6ZM9.6 14.4l9-5.7c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3-1.6-4.7Z" />
    </svg>
  );
}

function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-40" style={{ background: solid ? 'rgb(10 9 8 / 0.94)' : 'transparent', boxShadow: solid ? '0 1px 0 var(--c-line)' : 'none', transition: 'background var(--m-base) var(--m-ease), box-shadow var(--m-base) var(--m-ease)' }}>
      <div className="container-x flex h-16 items-center justify-between gap-6 md:h-20">
        <a href="#top" className="ui-dim ui-focus mark-link font-mark text-[22px] tracking-wide text-ink" aria-label="TURCH, наверх">TURCH</a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Разделы">
          <a href="#works" className="ui-dim ui-focus nav-link t-small">Работы</a>
          <a href="#offer" className="ui-dim ui-focus nav-link t-small">Что входит</a>
          <a href="#process" className="ui-dim ui-focus nav-link t-small">Как работаем</a>
        </nav>
        <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-primary ui-press ui-focus" style={{ height: 40, padding: '0 16px', fontSize: 15 }}>
          <TelegramIcon />
          <span>Написать</span>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const [ref, visible] = useInView<HTMLElement>('100px');
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden" aria-label="Студия TURCH">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="hero-fallback absolute inset-0" />}>
          <div className="absolute inset-0" role="img" aria-label="Три сайта студии в 3D: ремонт квартир, натяжные потолки, мебель на заказ. Нажмите на экран, чтобы открыть сайт.">
            <Showcase3D active={visible} screens={WORKS.map((w) => ({ id: w.id, img: w.shot, href: w.href }))} onOpen={(h) => (window.location.href = h)} />
          </div>
        </Suspense>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgb(10 9 8 / 0.7))' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]" style={{ background: 'linear-gradient(0deg, var(--c-bg) 12%, rgb(10 9 8 / 0.75) 45%, transparent)' }} />
      <div className="container-x pointer-events-none relative mt-auto pb-14 pt-28 md:pb-16">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SplitText tag="h1" text="Сайты, после которых вам звонят" className="t-display-hero chrome chrome-words max-w-[12ch]" splitType="words" effect="rise" trigger="load" mask delay={90} duration={1.1} textAlign="left" />
          </div>
          <div className={`rise lg:col-span-4 lg:pb-3 ${shown ? 'in' : ''}`}>
            <p className="t-body-lg m-0 text-ink-2">Для ремонтных бригад, мастерских и подрядчиков. Сайт, который выглядит дороже конкурентов и приводит заявки в Telegram.</p>
            <div className="pointer-events-auto mt-7 flex flex-wrap gap-3">
              <Magnet padding={50} magnetStrength={5}>
                <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-lg btn-primary ui-press ui-focus">
                  <TelegramIcon />
                  Обсудить сайт
                </a>
              </Magnet>
              <a href="#works" className="btn btn-lg btn-ghost ui-press ui-press--on-dark ui-focus">Смотреть работы</a>
            </div>
          </div>
        </div>
        <p className="t-micro m-0 mt-8 text-ink-2 opacity-80"><span className="hidden md:inline">Наведите на экран и нажмите</span><span className="md:hidden">Нажмите на экран</span> — откроется живой сайт.</p>
      </div>
    </section>
  );
}

function Marquee() {
  const [ref, visible] = useInView<HTMLDivElement>('100px');
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const a = 'Сайты · 3D-сцены · Калькуляторы · Конфигураторы · Заявки в Telegram';
  const b = 'Ремонт квартир · Натяжные потолки · Мебель на заказ · Ваша ниша';
  const sep = <span aria-hidden="true" className="mx-6 inline-block h-3 w-3 translate-y-[-0.35em] rounded-full bg-accent align-middle md:mx-10" />;
  return (
    <div ref={ref} className="rule relative overflow-hidden py-6 md:py-10" aria-hidden="true" style={{ minHeight: 'calc(clamp(40px, 6.5vw, 96px) * 2.3 + 48px)' }}>
      {reduced ? (
        <p className="container-x font-display text-[40px] font-extrabold uppercase leading-tight text-ink-2">{a}</p>
      ) : (
        // Only animate while on screen; edge fade is an overlay, not a mask (a mask over moving text re-rasterises every frame).
        visible && <ScrollVelocity texts={[a, b]} velocity={36} numCopies={3} separator={sep} outlineAlternate className="font-display font-extrabold uppercase text-ink" fontSize="clamp(40px, 6.5vw, 96px)" gap={0} />
      )}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[12%]" style={{ background: 'linear-gradient(90deg, var(--c-bg), transparent)' }} />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-[12%]" style={{ background: 'linear-gradient(270deg, var(--c-bg), transparent)' }} />
    </div>
  );
}

function WorkBlock({ w, n }: { w: (typeof WORKS)[number]; n: number }) {
  return (
    <article className="relative" aria-labelledby={`w-${w.id}`}>
      <ContainerScroll
        titleComponent={
          <div className="px-4">
            <div className="t-small text-accent">Работа 0{n} · {w.niche}</div>
            <h3 id={`w-${w.id}`} className="t-h2 chrome mt-4">{w.brand}</h3>
            <p className="t-body-lg mx-auto mt-5 max-w-[40rem] text-ink-2">{w.line}</p>
          </div>
        }
      >
        <a href={w.href} className="group ui-press ui-press--surface ui-press--on-dark ui-focus block h-full w-full rounded-2xl" aria-label={`Открыть сайт ${w.brand}`}>
          <img src={w.shot} alt={`Первый экран сайта ${w.brand}`} loading="lazy" className="h-full w-full rounded-2xl object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]" draggable={false} />
        </a>
      </ContainerScroll>
      <div className="container-x relative -mt-24 md:-mt-48">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-12 md:items-start">
          <ul className="m-0 grid list-none gap-3 p-0 md:col-span-8 md:grid-cols-2">
            {w.features.map((f) => (
              <li key={f} className="flex gap-3 text-[16px] text-ink">
                <span aria-hidden="true" className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
            <a href={w.href} className="btn btn-primary ui-press ui-focus">Открыть сайт</a>
            <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-ghost ui-press ui-press--on-dark ui-focus">Хочу такой</a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Works() {
  return (
    <section id="works" className="relative pt-24 md:pt-36" aria-labelledby="works-title">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="works-title" className="t-h2 md:col-span-7">Три работы. Три разных характера.</h2>
          <p className="t-body-lg text-ink-2 md:col-span-5 md:pb-2">Это демо-сайты: компании вымышлены, а сайты настоящие — с калькуляторами, 3D и формами. Откройте и полистайте.</p>
        </div>
      </div>
      <div className="space-y-6 md:space-y-0">
        {WORKS.map((w, i) => (
          <WorkBlock key={w.id} w={w} n={i + 1} />
        ))}
      </div>
    </section>
  );
}

function Wall() {
  const [ref, near] = useInView<HTMLElement>('1200px');
  const idle = useIdleReady(2500);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (idle || near) setMounted(true);
  }, [idle, near]);
  const visible = mounted;
  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-32" aria-labelledby="wall-title">
      <div className="container-x relative z-10">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="wall-title" className="t-h2 md:col-span-7">Каждый экран продуман</h2>
          <p className="t-body-lg text-ink-2 md:col-span-5 md:pb-2">Калькуляторы, конфигураторы, формы и галереи — 17 экранов из трёх сайтов.</p>
        </div>
      </div>
      <div className="relative mt-6">
        {visible ? <ThreeDMarquee images={MARQUEE_SHOTS} className="h-[420px] rounded-none md:h-[720px]" /> : <div className="h-[420px] md:h-[720px]" />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--c-bg) 0%, transparent 18%, transparent 82%, var(--c-bg) 100%), linear-gradient(90deg, var(--c-bg) 0%, transparent 14%, transparent 86%, var(--c-bg) 100%)' }} />
      </div>
    </section>
  );
}

const OFFER: [string, string][] = [
  ['Дизайн под нишу', 'Стиль, фото и приёмы подбираю под ваш рынок и ваших клиентов, а не под шаблон.'],
  ['Интерактив, который продаёт', 'Калькулятор, конфигуратор или 3D-примерка: клиент сам видит результат и цену.'],
  ['Заявки прямо в мессенджер', 'Формы и расчёты отправляют заявку вам в Telegram или WhatsApp.'],
  ['Быстро и на телефоне', 'Сайт открывается быстро на мобильном интернете и удобен с одной руки.'],
  ['Запуск под ключ', 'Домен, хостинг, аналитика и базовое SEO: вы получаете работающий сайт.'],
];
function Offer() {
  return (
    <section id="offer" className="rule py-24 md:py-36" aria-labelledby="offer-title">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5"><h2 id="offer-title" className="t-h2 lg:sticky lg:top-28">Что получает ваш бизнес</h2></div>
        <dl className="lg:col-span-7">
          {OFFER.map(([k, v]) => (
            <div key={k} className="rule grid gap-2 py-7 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-10">
              <dt className="t-h3 text-ink">{k}</dt>
              <dd className="m-0 text-[17px] text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ['Разговор', 'Обсуждаем бизнес, клиентов и конкурентов в Telegram или по звонку.'],
  ['Первый экран', 'Показываю дизайн главного экрана. Правим, пока вам не понравится.'],
  ['Сайт целиком', 'Собираю остальные блоки, тексты, формы и мобильную версию.'],
  ['Запуск', 'Подключаю домен и заявки, проверяю на телефонах и передаю вам.'],
];
function Process() {
  return (
    <section id="process" className="relative overflow-hidden bg-bg-2 py-24 md:py-32" aria-labelledby="process-title">
      <div className="container-x">
        <h2 id="process-title" className="t-h2 max-w-[14ch]">От разговора до первой заявки</h2>
        <ol className="mt-16 grid gap-10 md:grid-cols-4 md:gap-8">
          {STEPS.map(([k, v], i) => (
            <li key={k} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[22px] font-bold" style={{ background: i === 0 ? 'var(--c-accent)' : 'transparent', color: i === 0 ? 'var(--c-accent-ink)' : 'var(--c-text)', boxShadow: i === 0 ? 'none' : 'inset 0 0 0 1px rgb(237 233 227 / 0.4)' }}>{i + 1}</span>
                <span aria-hidden="true" className="hidden h-px flex-1 md:block" style={{ background: 'linear-gradient(90deg, rgb(237 233 227 / 0.35), rgb(237 233 227 / 0.06))' }} />
              </div>
              <h3 className="t-h3 mt-6">{k}</h3>
              <p className="mt-3 text-ink-2">{v}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden py-28 md:py-40" aria-labelledby="contact-title">
      {/* A frame rendered by React Bits LiquidChrome, used as a still: the live shader cost a full-screen raymarch per frame. */}
      <div className="chrome-drift absolute inset-[-8%] opacity-60" aria-hidden="true" style={{ background: 'url(/img/liquid-chrome.webp) center / cover no-repeat' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, var(--c-bg) 0%, rgb(10 9 8 / 0.7) 55%, rgb(10 9 8 / 0.2))' }} />
      <div className="container-x pointer-events-none relative">
        <h2 id="contact-title" className="t-h2 max-w-[16ch]">Расскажите о своём бизнесе</h2>
        <p className="t-body-lg mt-6 max-w-[36rem] text-ink-2">Напишите, чем вы занимаетесь и в каком городе. Обсудим, каким должен быть ваш сайт.</p>
        <a href={TG_URL} target="_blank" rel="noopener" className="pointer-events-auto ui-dim ui-focus mark-link mt-12 block w-fit rounded-lg">
          <span className="chrome block font-display text-[clamp(56px,11vw,180px)] font-extrabold leading-[0.9]">{TG_HANDLE}</span>
        </a>
        <div className="pointer-events-auto mt-10 w-fit">
          <Magnet padding={60} magnetStrength={4}>
            <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-lg btn-primary ui-press ui-focus"><TelegramIcon />Написать в Telegram</a>
          </Magnet>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="rule py-10">
      <div className="container-x flex flex-col gap-3 text-ink-2 md:flex-row md:items-center md:justify-between">
        <span className="font-mark text-ink">TURCH</span>
        <p className="t-micro m-0 max-w-[46rem]">Работы на сайте — демо-сайты: компании и их данные вымышлены. Фото: Pexels, видео-полотно: MotionSites.</p>
        <a href={TG_URL} target="_blank" rel="noopener" className="ui-dim ui-focus mark-link t-small text-ink">{TG_HANDLE}</a>
      </div>
    </footer>
  );
}

function Sparks({ children }: { children: ReactNode }) {
  return (
    <ClickSpark sparkColor={['#ff6b1a', '#ffb27a', '#ede9e3']} sparkCount={10} sparkRadius={22} sparkSize={9} duration={420} shape="line">
      {children}
    </ClickSpark>
  );
}

export default function App() {
  return (
    <Sparks>
      <a href="#works" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">К работам</a>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Works />
        <Wall />
        <Offer />
        <Process />
        <Contact />
      </main>
      <Footer />
    </Sparks>
  );
}
