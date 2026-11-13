import { useEffect, useState } from 'react';
import { Ribbons } from './components/Ribbons';
import SplitText from './components/rb/SplitText';
import ScrollVelocity from './components/rb/ScrollVelocity';
import { Works } from './components/Works';
import { cases } from './data/cases';
import { TG_HANDLE, TG_URL } from './lib/contact';

function useReducedMotion() {
  const [r, setR] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
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
    <header
      className="fixed inset-x-0 top-0 z-40"
      style={{
        background: solid ? 'rgb(10 9 8 / 0.82)' : 'transparent',
        backdropFilter: solid ? 'blur(10px)' : 'none',
        boxShadow: solid ? '0 1px 0 var(--c-line)' : 'none',
        transition: 'background var(--m-base) var(--m-ease), box-shadow var(--m-base) var(--m-ease)',
      }}
    >
      <div className="container-x flex h-16 items-center justify-between gap-6 md:h-20">
        <a href="#top" className="ui-dim ui-focus mark-link font-mark text-[22px] tracking-wide text-ink" aria-label="TURCH, наверх">
          TURCH
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Разделы">
          <a href="#works" className="ui-dim ui-focus nav-link t-small">
            Работы
          </a>
          <a href="#offer" className="ui-dim ui-focus nav-link t-small">
            Что входит
          </a>
          <a href="#process" className="ui-dim ui-focus nav-link t-small">
            Как работаем
          </a>
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
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 650);
    return () => clearTimeout(t);
  }, []);
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <Ribbons className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgb(10 9 8 / 0.78) 0%, rgb(10 9 8 / 0.35) 45%, transparent 70%), linear-gradient(0deg, var(--c-bg) 0%, transparent 22%)' }}
      />
      <div className="container-x relative flex flex-1 flex-col justify-start pb-24 pt-28 md:justify-center md:pb-28">
        <SplitText
          tag="h1"
          text="Сайты, после которых вам звонят"
          className="t-display chrome chrome-words max-w-[11ch]"
          splitType="words"
          effect="rise"
          trigger="load"
          mask
          delay={90}
          duration={1.1}
          textAlign="left"
        />
        <p className={`rise t-body-lg mt-8 max-w-[34rem] text-ink-2 ${shown ? 'in' : ''}`}>
          Для мастерских, клиник, студий и подрядчиков. Цепляют с первого экрана и присылают заявки вам в Telegram.
        </p>
        <div className={`rise mt-10 flex flex-wrap gap-3 ${shown ? 'in' : ''}`} style={{ transitionDelay: '120ms' }}>
          <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-lg btn-primary ui-press ui-focus">
            <TelegramIcon />
            Обсудить сайт
          </a>
          <a href="#works" className="btn btn-lg btn-ghost ui-press ui-press--on-dark ui-focus">
            Смотреть 12 концептов
          </a>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const reduced = useReducedMotion();
  const sep = <span aria-hidden="true" className="mx-6 inline-block h-3 w-3 translate-y-[-0.35em] rounded-full bg-accent align-middle md:mx-10" />;
  const a = cases.slice(0, 6).map((c) => c.niche).join(' · ');
  const b = cases.slice(6).map((c) => c.niche).join(' · ');
  if (reduced) {
    return (
      <div className="rule overflow-hidden py-8" aria-hidden="true">
        <p className="container-x font-display text-[40px] font-extrabold uppercase leading-tight text-ink-2">{a} · {b}</p>
      </div>
    );
  }
  return (
    <div className="rule overflow-hidden py-6 md:py-10" aria-hidden="true">
      <ScrollVelocity
        texts={[a, b]}
        velocity={38}
        numCopies={4}
        separator={sep}
        fadeEdges
        outlineAlternate
        className="font-display font-extrabold uppercase text-ink"
        fontSize="clamp(40px, 6.5vw, 96px)"
        gap={0}
      />
    </div>
  );
}

const OFFER: [string, string][] = [
  ['Дизайн под нишу', 'Стиль, фото и приёмы подбираю под ваш рынок и ваших клиентов, а не под шаблон.'],
  ['Тексты, которые продают', 'Пишу заголовки и описания услуг так, чтобы клиент понял предложение за пять секунд.'],
  ['Заявки прямо в мессенджер', 'Форма, квиз или калькулятор отправляют заявку вам в Telegram или WhatsApp.'],
  ['Быстро и на телефоне', 'Сайт открывается быстро на мобильном интернете и удобен с одной руки.'],
  ['Запуск под ключ', 'Домен, хостинг, аналитика и базовое SEO: вы получаете работающий сайт.'],
];

function Offer() {
  return (
    <section id="offer" className="rule py-24 md:py-36" aria-labelledby="offer-title">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="offer-title" className="t-h2 lg:sticky lg:top-28">
            Что получает ваш бизнес
          </h2>
        </div>
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
        <h2 id="process-title" className="t-h2 max-w-[14ch]">
          От разговора до первой заявки
        </h2>
        <ol className="mt-16 grid gap-10 md:grid-cols-4 md:gap-8">
          {STEPS.map(([k, v], i) => (
            <li key={k} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[22px] font-bold" style={{ background: i === 0 ? 'var(--c-accent)' : 'transparent', color: i === 0 ? 'var(--c-accent-ink)' : 'var(--c-text)', boxShadow: i === 0 ? 'none' : 'inset 0 0 0 1px rgb(237 233 227 / 0.4)' }}>
                  {i + 1}
                </span>
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
      <div className="container-x">
        <h2 id="contact-title" className="t-h2 max-w-[16ch]">
          Расскажите о своём бизнесе
        </h2>
        <p className="t-body-lg mt-6 max-w-[36rem] text-ink-2">Напишите, чем вы занимаетесь и в каком городе. Обсудим, каким должен быть ваш сайт.</p>
        <a href={TG_URL} target="_blank" rel="noopener" className="ui-dim ui-focus mark-link mt-12 inline-block rounded-lg">
          <span className="chrome block font-display text-[clamp(56px,11vw,180px)] font-extrabold leading-[0.9]">{TG_HANDLE}</span>
        </a>
        <div className="mt-10">
          <a href={TG_URL} target="_blank" rel="noopener" className="btn btn-lg btn-primary ui-press ui-focus">
            <TelegramIcon />
            Написать в Telegram
          </a>
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
        <p className="t-micro m-0 max-w-[46rem]">
          Работы на сайте являются концептами: компании и их данные вымышлены. Фотографии из открытых источников с лицензией CC0.
        </p>
        <a href={TG_URL} target="_blank" rel="noopener" className="ui-dim ui-focus mark-link t-small text-ink">
          {TG_HANDLE}
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <a href="#works" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        К работам
      </a>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Works />
        <Offer />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
