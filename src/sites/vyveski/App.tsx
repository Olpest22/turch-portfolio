import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED } from '@/shared/brand';
import { BASE } from '@/lib/base';

const BRAND = brandOr('ЛЮМЕН');
const CITY = cityOr('Москва и область');
const IMG = (n: string) => `${BASE}img/vyveski/${n}.webp`;
const MD = (n: string) => `${BASE}img/vyveski/${n}-md.webp`;
const PHONE = '+7 (900) 000-00-00';

const COLORS: [string, string][] = [
  ['#ff4fa3', 'Розовый'],
  ['#ff3b3b', 'Красный'],
  ['#3fa9ff', 'Синий'],
  ['#45f0b0', 'Мятный'],
  ['#ffd23f', 'Жёлтый'],
  ['#fff6e6', 'Тёплый белый'],
];
type Kind = 'neon' | 'channel' | 'box';
const KINDS: [Kind, string, string][] = [
  ['neon', 'Неон', 'Гибкий неон на прозрачной подложке'],
  ['channel', 'Объёмные буквы', 'Световые буквы из акрила и металла'],
  ['box', 'Лайтбокс', 'Световой короб с плёнкой'],
];
const FONTS: [string, string][] = [
  ["'Comfortaa', sans-serif", 'Округлый'],
  ["'Caveat', cursive", 'Рукописный'],
  ["'Oswald', sans-serif", 'Строгий'],
];

/* ───────────── shared sign renderer ───────────── */
function Sign({ text, kind, color, font, size, animate }: { text: string; kind: Kind; color: string; font: string; size: string; animate?: boolean }) {
  const style = { ['--c' as string]: color, fontFamily: font, fontSize: size, lineHeight: 1.05 } as CSSProperties;
  if (kind === 'box') {
    return (
      <div className="lightbox inline-block px-[0.55em] py-[0.25em] font-bold" style={style}>
        {text}
      </div>
    );
  }
  return (
    <div className={`${kind === 'neon' ? 'neon buzz' : 'channel'} ${animate ? 'neon-on' : ''} inline-block font-bold`} style={style}>
      {text}
    </div>
  );
}

/* ───────────── header ───────────── */
function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="wrap flex h-[76px] items-center justify-between gap-4">
        <a href="#" className="ui-dim ui-focus flex min-w-0 items-center gap-3 text-tx no-underline" aria-label={`${BRAND}, наверх`}>
          <span className="neon text-[26px] font-bold" style={{ ['--c' as string]: '#ff4fa3', fontFamily: "'Comfortaa'" } as CSSProperties}>{BRAND.slice(0, 1)}</span>
          <span className="truncate text-[17px] font-bold tracking-[0.06em]">{BRAND}</span>
        </a>
        <nav className="hidden items-center gap-7 text-[15px] text-tx-2 md:flex" aria-label="Разделы">
          <a href="#build" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Конструктор</a>
          <a href="#types" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Виды вывесок</a>
          <a href="#works" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Работы</a>
          <a href="#faq" className="ui-dim ui-focus text-inherit no-underline hover:text-tx">Вопросы</a>
        </nav>
        <a href="#lead" className="btn btn-a ui-press ui-focus" style={{ height: 44, padding: '0 18px', fontSize: 15 }}>Рассчитать</a>
      </div>
    </header>
  );
}

/* ───────────── hero: the company name lit as a neon sign ───────────── */
function Hero() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden" aria-label="Главный экран">
      <img src={IMG('wall')} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'brightness(.42) saturate(.9)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 55% at 50% 40%, rgb(255 79 163 / .16), transparent 70%), linear-gradient(180deg, rgb(11 10 15 / .55), transparent 30%, transparent 55%, rgb(11 10 15 / .96))' }} />
      <Header />
      <div className="wrap relative z-10 flex flex-1 flex-col items-center justify-center pb-10 pt-28 text-center">
        <div className="min-h-[1.3em] max-w-full px-2" style={{ fontSize: 'clamp(48px, 11vw, 150px)' }}>
          <div className={on ? '' : 'opacity-0'}>
            <Sign text={BRAND} kind="neon" color="#ff4fa3" font="'Comfortaa', sans-serif" size="1em" animate={on} />
          </div>
        </div>
        <h1 className="h1 m-0 mt-10 max-w-[18ch]">Вывески, которые видно с другого конца улицы</h1>
        <p className="lead mx-auto mb-0 mt-5 max-w-[34rem]">Неон, объёмные световые буквы и лайтбоксы. Делаем дизайн, согласуем и монтируем за 5–7 дней.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#build" className="btn btn-a ui-press ui-focus">Собрать вывеску</a>
          <a href="#works" className="btn btn-b ui-press ui-press--on-dark ui-focus">Наши работы</a>
        </div>
      </div>
      <div className="relative z-10 border-t border-[var(--line)]">
        <div className="wrap grid grid-cols-2 gap-y-3 py-5 text-[14px] text-tx-2 md:grid-cols-4">
          <span>Визуализация на фото фасада</span>
          <span>Помощь с согласованием</span>
          <span>Своё производство</span>
          <span>Гарантия 2 года на свет</span>
        </div>
      </div>
    </section>
  );
}

/* ───────────── constructor ───────────── */
function Builder() {
  const [text, setText] = useState(BRAND.length <= 18 ? BRAND : 'Кофейня');
  const [kind, setKind] = useState<Kind>('neon');
  const [color, setColor] = useState(COLORS[0][0]);
  const [font, setFont] = useState(FONTS[0][0]);
  const [h, setH] = useState(40);
  const [outdoor, setOutdoor] = useState(true);
  const chars = text.replace(/\s/g, '').length || 1;
  const price = useMemo(() => {
    let p = 0;
    if (kind === 'neon') p = chars * (900 + h * 32);
    if (kind === 'channel') p = chars * (1400 + h * 55);
    if (kind === 'box') p = Math.max(0.4, (text.length * h * 0.62 * (h + 12)) / 10000) * 21000;
    if (outdoor) p *= 1.18;
    return Math.max(6900, Math.round(p / 100) * 100);
  }, [chars, h, kind, outdoor, text]);
  const widthM = ((text.length * h * 0.62) / 100).toFixed(1);
  return (
    <section id="build" className="relative py-20 md:py-28" aria-labelledby="build-title">
      <div className="wrap">
        <div className="grid gap-5 md:grid-cols-12 md:items-end">
          <h2 id="build-title" className="h2 m-0 md:col-span-7">Соберите вывеску и узнайте цену за минуту</h2>
          <p className="lead m-0 md:col-span-5">Напишите текст, выберите тип и цвет — вывеска загорится на стене. Точную цену назовём после замера.</p>
        </div>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
          <div className="relative grid aspect-[4/3.6] min-w-0 place-items-center overflow-hidden rounded-[24px] p-6 sm:aspect-[16/11] lg:col-span-7">
            <img src={MD('wall')} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ filter: kind === 'box' ? 'brightness(.35)' : 'brightness(.3)', transition: 'filter .4s' }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(55% 45% at 50% 48%, color-mix(in srgb, ${color} ${kind === 'box' ? 10 : 22}%, transparent), transparent 75%)`, transition: 'background .4s' }} />
            <div key={kind + font} className="relative max-w-full text-center" style={{ fontSize: `clamp(26px, ${Math.min(9, 60 / Math.max(6, text.length))}vw, ${Math.round(60 + h * 0.9)}px)` }}>
              <Sign text={text || ' '} kind={kind} color={color} font={font} size="1em" animate />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between gap-2 text-[13px] text-tx-2">
              <span className="rounded-full bg-black/55 px-3 py-1.5">Высота букв {h} см · ширина ≈ {widthM} м</span>
              <span className="rounded-full bg-black/55 px-3 py-1.5">{outdoor ? 'На фасад' : 'В помещение'}</span>
            </div>
          </div>
          <div className="rounded-[24px] bg-bg-2 p-6 md:p-8 lg:col-span-5" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <label htmlFor="sign-text" className="text-[14px] text-tx-3">Текст вывески</label>
            <input id="sign-text" className="field mt-2" value={text} maxLength={22} onChange={(e) => setText(e.target.value)} />
            <div className="mt-6 text-[14px] text-tx-3">Тип</div>
            <div className="seg mt-2" role="radiogroup" aria-label="Тип вывески">
              {KINDS.map(([k, t]) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className="ui-press ui-focus">{t}</button>
              ))}
            </div>
            <div className="mt-2 text-[14px] text-tx-3">{KINDS.find((k) => k[0] === kind)![2]}</div>
            <div className="mt-6 text-[14px] text-tx-3">Цвет</div>
            <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Цвет">
              {COLORS.map(([c, t]) => (
                <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={t} title={t} onClick={() => setColor(c)} className="ui-press ui-focus h-10 w-10 rounded-full" style={{ background: c, boxShadow: color === c ? `0 0 0 3px var(--bg-2), 0 0 0 5px ${c}, 0 0 18px ${c}` : 'inset 0 0 0 1px rgb(0 0 0 / .2)' }} />
              ))}
            </div>
            <div className="mt-6 text-[14px] text-tx-3">Шрифт</div>
            <div className="seg mt-2" role="radiogroup" aria-label="Шрифт">
              {FONTS.map(([f, t]) => (
                <button key={t} type="button" role="radio" aria-checked={font === f} onClick={() => setFont(f)} className="ui-press ui-focus" style={{ fontFamily: f }}>{t}</button>
              ))}
            </div>
            <div className="mt-6 flex items-baseline justify-between">
              <label htmlFor="sign-h" className="text-[14px] text-tx-3">Высота букв</label>
              <span className="font-semibold tabular-nums">{h} см</span>
            </div>
            <input id="sign-h" className="rng" type="range" min={15} max={120} step={5} value={h} onChange={(e) => setH(+e.target.value)} style={{ ['--p' as string]: `${((h - 15) / 105) * 100}%` }} />
            <div className="seg mt-4" role="radiogroup" aria-label="Где будет висеть">
              <button type="button" role="radio" aria-checked={outdoor} onClick={() => setOutdoor(true)} className="ui-press ui-focus">На фасад</button>
              <button type="button" role="radio" aria-checked={!outdoor} onClick={() => setOutdoor(false)} className="ui-press ui-focus">В помещение</button>
            </div>
            <div className="mt-7 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-6">
              <div>
                <div className="text-[14px] text-tx-3">С монтажом, ориентировочно</div>
                <div className="mt-1 text-[38px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" aria-live="polite">{rub(price)}</div>
              </div>
              <div className="text-right text-[14px] text-tx-2">5–7 дней</div>
            </div>
            <a href="#lead" className="btn btn-a ui-press ui-focus mt-6 w-full">Хочу такую вывеску</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── types ───────────── */
const TYPES = [
  { img: 'rockstar', t: 'Неоновые вывески', d: 'Гибкий неон: светится ровно, не греется, служит 5–7 лет. Для фасадов и интерьеров.', p: 'от 9 900 ₽' },
  { img: 'lightbox', t: 'Световые короба', d: 'Лайтбоксы с плёнкой или печатью. Видно ночью издалека, легко заменить изображение.', p: 'от 14 000 ₽' },
  { img: 'dream', t: 'Объёмные буквы', d: 'Акрил и металл, подсветка лицевая или контражурная. Главная вывеска фасада.', p: 'от 1 900 ₽ за букву' },
  { img: 'white', t: 'Интерьерные надписи', d: 'Фразы и логотипы для кафе, салонов и офисов. Делаем по вашему эскизу.', p: 'от 6 900 ₽' },
];
function Types() {
  return (
    <section id="types" className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="types-title">
      <div className="wrap">
        <h2 id="types-title" className="h2 m-0 max-w-[18ch]">Что мы делаем</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {TYPES.map((x) => (
            <article key={x.t} className="tile overflow-hidden rounded-[22px] bg-bg-3" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
              <div className="aspect-[16/9] overflow-hidden">
                <img src={MD(x.img)} alt={x.t} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-3 p-6">
                <h3 className="m-0 text-[22px] font-bold">{x.t}</h3>
                <span className="text-[15px] font-semibold text-pink">{x.p}</span>
                <p className="m-0 w-full text-tx-2">{x.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── works ───────────── */
function Works() {
  const items: [string, string][] = [
    ['open', 'Вывеска на витрину'],
    ['hello', 'Неон для кофейни'],
    ['red', 'Надпись в бар'],
    ['street', 'Фасад магазина'],
    ['lightbox', 'Световой короб'],
  ];
  return (
    <section id="works" className="py-20 md:py-28" aria-labelledby="works-title">
      <div className="wrap">
        <h2 id="works-title" className="h2 m-0">Вывески, которые уже горят</h2>
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-4">
          {items.map(([img, t], k) => (
            <figure key={img} className={`tile relative m-0 overflow-hidden rounded-[18px] ${k === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img src={MD(img)} alt={t} loading="lazy" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-[13px]">{t}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── process ───────────── */
const STEPS: [string, string][] = [
  ['Замер и фото фасада', 'Приезжаем бесплатно или считаем по вашим фото.'],
  ['Визуализация', 'Показываем вывеску на фотографии вашего фасада днём и ночью.'],
  ['Согласование', 'Готовим эскиз по дизайн-коду города и помогаем с документами.'],
  ['Производство и монтаж', 'Изготавливаем за 5–7 дней и монтируем за один выезд.'],
];
function Process() {
  return (
    <section className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="proc-title">
      <div className="wrap">
        <h2 id="proc-title" className="h2 m-0 max-w-[16ch]">От идеи до света за неделю</h2>
        <ol className="m-0 mt-12 grid list-none gap-8 p-0 md:grid-cols-4">
          {STEPS.map(([t, d], k) => (
            <li key={t}>
              <div className="neon text-[44px] font-bold leading-none" style={{ ['--c' as string]: COLORS[k % COLORS.length][0], fontFamily: "'Comfortaa'" } as CSSProperties}>{k + 1}</div>
              <h3 className="m-0 mt-5 text-[20px] font-bold">{t}</h3>
              <p className="mb-0 mt-2 text-tx-2">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── faq + lead ───────────── */
const FAQ: [string, string][] = [
  ['Нужно ли согласовывать вывеску?', 'Во многих городах фасадные вывески согласуют по дизайн-коду. Подготовим эскиз под требования и поможем с документами.'],
  ['Сколько служит неон?', 'Гибкий неон служит 5–7 лет и больше. На свет и электрику даём гарантию 2 года.'],
  ['Можно сделать по нашему логотипу?', 'Да. Пришлите логотип в любом виде — перерисуем его под производство.'],
  ['Сколько потребляет вывеска?', 'Неон и светодиоды экономичны: вывеска на фасад обычно потребляет как пара обычных ламп.'],
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
                  <span aria-hidden="true" className="plus text-[26px] font-normal text-pink">+</span>
                </summary>
                <p className="m-0 pb-6 text-tx-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="lead" className="lg:col-span-6">
          <div className="rounded-[24px] bg-bg-2 p-7 md:p-10" style={{ boxShadow: 'inset 0 0 0 1px var(--line), 0 0 80px -30px rgb(255 79 163 / .5)' }}>
            <h2 className="h2 m-0">Пришлём визуализацию на вашем фасаде</h2>
            <p className="lead mt-4">Оставьте телефон — попросим фото фасада и через день покажем, как будет выглядеть вывеска.</p>
            {st === 'done' ? (
              <div className="mt-8 rounded-2xl p-6" style={{ boxShadow: 'inset 0 0 0 1.5px var(--pink)' }} role="status">
                <div className="text-[20px] font-bold">Заявка принята</div>
                <p className="mb-0 mt-2 text-tx-2">Это демо-сайт студии TURCH: заявка никуда не отправилась. На вашем сайте она придёт в Telegram.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-8 grid gap-3">
                <label htmlFor="vp" className="sr-only">Телефон</label>
                <input id="vp" className="field" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'vp-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
                {st === 'error' && <p id="vp-e" className="m-0 text-[14px] text-[#ff8a8a]">Нужно 10 цифр после +7.</p>}
                <button type="submit" className="btn btn-a ui-press ui-focus w-full" aria-busy={st === 'pending'}>{st === 'pending' ? 'Отправляем…' : 'Получить визуализацию'}</button>
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
    <footer className="border-t border-[var(--line)] py-10 pb-24 text-[14px] text-tx-3">
      <div className="wrap flex flex-col gap-2 md:flex-row md:justify-between">
        <span><span className="font-bold text-tx">{BRAND}</span> · вывески и неон · {CITY}</span>
        <a href="tel:+79000000000" className="ui-dim ui-focus text-tx no-underline">{PHONE}</a>
      </div>
    </footer>
  );
}

export default function App() {
  const ref = useRef(false);
  useEffect(() => {
    if (!ref.current) document.title = `${BRAND} — вывески, неон и объёмные буквы`;
    ref.current = true;
  }, []);
  return (
    <>
      <Hero />
      <main>
        <Builder />
        <Types />
        <Works />
        <Process />
        <Lead />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="dark" />}
    </>
  );
}
