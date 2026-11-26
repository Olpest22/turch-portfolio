import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent } from 'react';
import { DemoBadge, fakeSubmit, formatPhone, rub, type LeadState } from '@/shared/DemoBadge';
import { brandOr, cityOr, EMBED } from '@/shared/brand';
import { BASE } from '@/lib/base';

const BRAND = brandOr('ПАНЕЛЬ');
const CITY = cityOr('Москва и область');
const IMG = (n: string) => `${BASE}img/kuzov/${n}.webp`;
const MD = (n: string) => `${BASE}img/kuzov/${n}-md.webp`;
const PHONE = '+7 (900) 000-00-00';

/* ───────────── damage calculator data ───────────── */
type Damage = 'scratch' | 'pdr' | 'dent' | 'replace';
const DAMAGES: [Damage, string, number, number][] = [
  ['scratch', 'Царапина, скол', 4500, 1],
  ['pdr', 'Вмятина без покраски', 3500, 1],
  ['dent', 'Вмятина с покраской', 9500, 2],
  ['replace', 'Замена и покраска', 19000, 3],
];
const CLASSES: [string, string, number][] = [
  ['s', 'Малый класс', 0.9],
  ['m', 'Седан', 1],
  ['l', 'Кроссовер', 1.15],
  ['xl', 'Внедорожник', 1.3],
];
type Panel = { id: string; name: string; d: string; k: number; lx: number; ly: number };
// Side view of a sedan, facing left; drawn in a 1000×360 box. k = labour/material factor of the part.
const PANELS: Panel[] = [
  { id: 'fb', name: 'Передний бампер', d: 'M58 236 Q58 196 108 186 L150 196 L150 266 L74 266 Q58 262 58 248 Z', k: 0.85, lx: 100, ly: 232 },
  { id: 'hood', name: 'Капот', d: 'M110 184 L330 160 L346 184 L152 194 Z', k: 1.25, lx: 230, ly: 150 },
  { id: 'ff', name: 'Переднее крыло', d: 'M152 196 L346 186 L346 266 L302 266 A72 72 0 0 0 158 266 L152 266 Z', k: 0.95, lx: 250, ly: 216 },
  { id: 'fd', name: 'Передняя дверь', d: 'M348 160 L562 160 L562 264 L348 264 Z', k: 1.1, lx: 455, ly: 222 },
  { id: 'rd', name: 'Задняя дверь', d: 'M564 160 L744 160 Q754 206 704 264 L564 264 Z', k: 1.05, lx: 640, ly: 222 },
  { id: 'roof', name: 'Крыша и стойки', d: 'M332 158 Q402 96 472 88 L652 86 Q722 90 792 150 L752 158 Q702 112 646 104 L472 106 L376 158 Z', k: 1.35, lx: 560, ly: 74 },
  { id: 'rf', name: 'Заднее крыло', d: 'M746 158 L794 150 L898 168 L904 266 L842 266 A72 72 0 0 0 698 266 L706 264 Q756 206 746 158 Z', k: 1.15, lx: 850, ly: 205 },
  { id: 'trunk', name: 'Крышка багажника', d: 'M794 148 L900 166 L896 180 L790 160 Z', k: 1.0, lx: 860, ly: 138 },
  { id: 'rb', name: 'Задний бампер', d: 'M900 168 Q946 176 948 216 L948 254 Q948 266 934 266 L906 266 Z', k: 0.85, lx: 940, ly: 296 },
];

function CarCalc() {
  const [cls, setCls] = useState('m');
  const [sel, setSel] = useState<Record<string, Damage>>({ fd: 'dent' });
  const [active, setActive] = useState<string>('fd');
  const mult = CLASSES.find((c) => c[0] === cls)![2];
  const rows = PANELS.filter((p) => sel[p.id]).map((p) => {
    const d = DAMAGES.find((x) => x[0] === sel[p.id])!;
    return { p, d, price: Math.round((d[2] * p.k * mult) / 100) * 100 };
  });
  const total = rows.reduce((s, r) => s + r.price, 0);
  const days = rows.length ? Math.max(...rows.map((r) => r.d[3])) + Math.floor((rows.length - 1) / 2) : 0;
  const ap = PANELS.find((p) => p.id === active);
  const pick = (id: string) => {
    setActive(id);
    setSel((s) => (s[id] ? s : { ...s, [id]: 'scratch' }));
  };
  const key = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(id);
    }
  };
  return (
    <section id="calc" className="py-20 md:py-28" aria-labelledby="calc-title">
      <div className="wrap">
        <div className="grid gap-5 md:grid-cols-12 md:items-end">
          <h2 id="calc-title" className="h2 m-0 md:col-span-7">Нажмите на повреждённую деталь</h2>
          <p className="lead m-0 md:col-span-5">Выберите детали и тип повреждения — посчитаем стоимость и срок. Точную цену назовём после осмотра или по фото.</p>
        </div>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
          <div className="min-w-0 rounded-[12px] bg-bg-2 p-4 md:p-8 lg:col-span-8" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Класс автомобиля">
              {CLASSES.map(([id, t]) => (
                <button key={id} type="button" role="radio" aria-checked={cls === id} onClick={() => setCls(id)} className="chip ui-press ui-press--on-dark ui-focus">{t}</button>
              ))}
            </div>
            <svg viewBox="40 60 930 290" className="mt-6 w-full" role="group" aria-label="Схема автомобиля, детали можно выбрать">
              <line x1="40" y1="338" x2="970" y2="338" stroke="#2c3238" strokeWidth="2" strokeDasharray="6 8" />
              {PANELS.map((p) => (
                <path
                  key={p.id}
                  d={p.d}
                  className="panel"
                  data-on={!!sel[p.id]}
                  data-active={active === p.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${p.name}${sel[p.id] ? ', выбрано' : ''}`}
                  aria-pressed={!!sel[p.id]}
                  onClick={() => pick(p.id)}
                  onKeyDown={(e) => key(e, p.id)}
                />
              ))}
              <path className="glass" d="M378 158 L472 108 L556 106 L556 158 Z" />
              <path className="glass" d="M570 158 L570 106 L644 106 Q694 114 736 158 Z" />
              {[230, 770].map((x) => (
                <g key={x}>
                  <circle className="wheel" cx={x} cy="268" r="62" />
                  <circle className="rim" cx={x} cy="268" r="30" />
                </g>
              ))}
              {PANELS.filter((p) => sel[p.id]).map((p, k) => (
                <g key={p.id} pointerEvents="none">
                  <circle cx={p.lx} cy={p.ly} r="15" fill="#141200" stroke="#f5c400" strokeWidth="2" />
                  <text x={p.lx} y={p.ly + 5} textAnchor="middle" fontFamily="Oswald" fontSize="15" fill="#f5c400">{k + 1}</text>
                </g>
              ))}
            </svg>
            {ap && (
              <div key={ap.id} className="swap-in mt-5 border-t border-[var(--line)] pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="disp text-[22px]">{ap.name}</div>
                  {sel[ap.id] && (
                    <button type="button" className="ui-dim ui-focus text-[14px] text-tx-3 underline underline-offset-4" onClick={() => setSel((s) => { const n = { ...s }; delete n[ap.id]; return n; })}>
                      Убрать деталь
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={`Повреждение: ${ap.name}`}>
                  {DAMAGES.map(([id, t]) => (
                    <button key={id} type="button" role="radio" aria-checked={sel[ap.id] === id} onClick={() => setSel((s) => ({ ...s, [ap.id]: id }))} className="chip ui-press ui-press--on-dark ui-focus">{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col rounded-[12px] bg-bg-3 p-6 md:p-8 lg:col-span-4" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <div className="lbl">Ваш расчёт</div>
            {rows.length ? (
              <ol className="m-0 mt-4 grid list-none gap-3 p-0">
                {rows.map((r, k) => (
                  <li key={r.p.id} className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] pb-3 text-[15px]">
                    <span><span className="disp mr-2 text-y">{k + 1}</span>{r.p.name}<span className="block pl-5 text-[13px] text-tx-3">{r.d[1]}</span></span>
                    <span className="shrink-0 tabular-nums">{rub(r.price)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-tx-2">Нажмите на деталь на схеме.</p>
            )}
            <div className="mt-auto pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="lbl">Итого, ориентировочно</div>
                  <div className="disp mt-1 text-[42px] leading-none tabular-nums" aria-live="polite">{rub(total)}</div>
                </div>
                <div className="text-right text-[15px] text-tx-2">{days ? `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}` : ''}</div>
              </div>
              <a href="#photo" className="btn btn-y ui-press ui-focus mt-6 w-full">Уточнить по фото</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── photo estimate with drop zone ───────────── */
function PhotoEstimate() {
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [over, setOver] = useState<'no' | 'ok' | 'bad'>('no');
  const [err, setErr] = useState('');
  const [st, setSt] = useState<LeadState>('idle');
  const [phone, setPhone] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), []);
  const add = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    let bad = '';
    for (const f of Array.from(list)) {
      if (!f.type.startsWith('image/')) bad = `«${f.name}» не фото — нужны JPG, PNG или HEIC.`;
      else if (f.size > 15 * 1024 * 1024) bad = `«${f.name}» больше 15 МБ.`;
      else ok.push(f);
    }
    setErr(bad);
    setFiles((s) => [...s, ...ok.map((f) => ({ url: URL.createObjectURL(f), name: f.name }))].slice(0, 8));
  };
  const dragType = (e: DragEvent) => {
    const items = Array.from(e.dataTransfer.items || []);
    return items.length && items.every((i) => i.kind === 'file' && i.type.startsWith('image/')) ? 'ok' : 'bad';
  };
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
    <section id="photo" className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="photo-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="photo-title" className="h2 m-0">Оценка по фото за 15 минут</h2>
          <p className="lead mt-5">Сфотографируйте повреждение с двух-трёх ракурсов и оставьте телефон. Мастер посмотрит и пришлёт точную стоимость в мессенджер.</p>
          <ul className="m-0 mt-6 grid list-none gap-2 p-0 text-[15px] text-tx-2">
            <li>— Снимайте при дневном свете</li>
            <li>— Одно фото издалека, два — вблизи</li>
            <li>— Если есть, добавьте фото СТС с кодом краски</li>
          </ul>
        </div>
        <form className="lg:col-span-7" onSubmit={submit} noValidate>
          {st === 'done' ? (
            <div className="rounded-[12px] p-7" style={{ boxShadow: 'inset 0 0 0 1.5px var(--y)' }} role="status">
              <div className="disp text-[26px]">Фото получены</div>
              <p className="mb-0 mt-2 text-tx-2">Это демо-сайт студии TURCH: фото и телефон никуда не отправились. На вашем сайте заявка с фото придёт в Telegram.</p>
            </div>
          ) : (
            <>
              <div
                className="drop grid min-h-[210px] place-items-center p-6 text-center"
                data-over={over === 'ok'}
                data-reject={over === 'bad'}
                onDragEnter={(e) => { e.preventDefault(); setOver(dragType(e)); }}
                onDragOver={(e) => { e.preventDefault(); setOver(dragType(e)); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver('no'); }}
                onDrop={(e) => { e.preventDefault(); setOver('no'); add(e.dataTransfer.files); }}
              >
                <div>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f5c400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto"><path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  <p className="m-0 mt-3 text-[17px] font-semibold">{over === 'bad' ? 'Сюда можно только фото' : over === 'ok' ? 'Отпустите, чтобы добавить' : <><span className="hidden md:inline">Перетащите фото сюда или </span><span className="md:hidden">Добавьте фото: </span></>}{over === 'no' && <button type="button" className="ui-dim ui-focus font-semibold text-y underline underline-offset-4" onClick={() => input.current?.click()}>выберите файлы</button>}</p>
                  <p className="m-0 mt-1 text-[14px] text-tx-3">JPG, PNG или HEIC, до 15 МБ, до 8 фото</p>
                  <input ref={input} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
                </div>
              </div>
              {err && <p className="m-0 mt-3 text-[14px] text-[#ff8a8a]" role="alert">{err}</p>}
              {files.length > 0 && (
                <ul className="m-0 mt-4 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-6">
                  {files.map((f, k) => (
                    <li key={f.url} className="relative aspect-square overflow-hidden rounded-[8px]">
                      <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                      <button type="button" aria-label={`Убрать ${f.name}`} className="ui-press ui-focus absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-[15px]" onClick={() => setFiles((s) => s.filter((_, i) => i !== k))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="kp" className="sr-only">Телефон</label>
                <input id="kp" className="field" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={phone} aria-invalid={st === 'error'} aria-describedby={st === 'error' ? 'kp-e' : undefined} onChange={(e) => { setPhone(formatPhone(e.target.value)); if (st === 'error') setSt('idle'); }} />
                <button type="submit" className="btn btn-y ui-press ui-focus" aria-busy={st === 'pending'}>{st === 'pending' ? 'Отправляем…' : 'Получить оценку'}</button>
              </div>
              {st === 'error' && <p id="kp-e" className="m-0 mt-2 text-[14px] text-[#ff8a8a]">Нужно 10 цифр после +7.</p>}
            </>
          )}
        </form>
      </div>
    </section>
  );
}

/* ───────────── hero, services, process, faq ───────────── */
function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden" aria-label="Главный экран">
      <img src={IMG('hero')} alt="Автомобиль на подъёмнике в кузовном цехе" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(15 17 19 / .7) 0%, rgb(15 17 19 / .1) 30%, rgb(15 17 19 / .55) 62%, rgb(15 17 19 / .97) 100%)' }} />
      <header className="relative z-10">
        <div className="wrap flex h-[76px] items-center justify-between gap-4">
          <a href="#" className="ui-dim ui-focus flex min-w-0 items-center gap-3 text-tx no-underline" aria-label={`${BRAND}, наверх`}>
            <svg width="28" height="30" viewBox="0 0 28 30" aria-hidden="true"><path d="M14 2l11 6.3v13.4L14 28 3 21.7V8.3z" fill="none" stroke="#f5c400" strokeWidth="2.6" /></svg>
            <span className="disp truncate text-[22px]">{BRAND}</span>
          </a>
          <nav className="hidden items-center gap-7 text-[15px] text-tx-2 md:flex" aria-label="Разделы">
            <a className="ui-dim ui-focus text-inherit no-underline hover:text-tx" href="#calc">Расчёт</a>
            <a className="ui-dim ui-focus text-inherit no-underline hover:text-tx" href="#services">Услуги</a>
            <a className="ui-dim ui-focus text-inherit no-underline hover:text-tx" href="#photo">Оценка по фото</a>
            <a className="ui-dim ui-focus text-inherit no-underline hover:text-tx" href="#faq">Вопросы</a>
          </nav>
          <a href="tel:+79000000000" className="btn btn-y ui-press ui-focus" style={{ height: 44, padding: '0 16px', fontSize: 15 }}>Позвонить</a>
        </div>
      </header>
      <div className="wrap relative z-10 mt-auto pb-12 pt-24">
        <div className="lbl text-y">Кузовной ремонт · {CITY}</div>
        <h1 className="h1 m-0 mt-4 max-w-[12ch]">Вернём машине заводской вид</h1>
        <p className="lead mb-0 mt-5 max-w-[34rem]">Кузовной ремонт, покраска в камере и удаление вмятин без покраски. Работаем со страховыми по ОСАГО и КАСКО.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#calc" className="btn btn-y ui-press ui-focus">Рассчитать ремонт</a>
          <a href="#photo" className="btn btn-g ui-press ui-press--on-dark ui-focus">Оценить по фото</a>
        </div>
      </div>
      <div className="hazard relative z-10" aria-hidden="true" />
      <div className="relative z-10 bg-bg">
        <div className="wrap grid grid-cols-2 gap-y-4 py-6 md:grid-cols-4">
          {[
            ['Камера', 'покраска без пыли'],
            ['Подбор цвета', 'спектрофотометром'],
            ['Гарантия', '2 года на покраску'],
            ['Страховые', 'ОСАГО и КАСКО'],
          ].map(([a, b]) => (
            <div key={a}><div className="disp text-[20px]">{a}</div><div className="text-[14px] text-tx-2">{b}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  { img: 'spray', t: 'Покраска в камере', d: 'Подбираем цвет по коду и спектрофотометру, красим в закрытой камере с сушкой.', p: 'от 9 500 ₽ за деталь' },
  { img: 'shop', t: 'Кузовной ремонт', d: 'Рихтовка, замена деталей, восстановление геометрии после ДТП.', p: 'от 6 000 ₽' },
  { img: 'polish', t: 'Вмятины без покраски', d: 'Убираем вмятины от града и парковки, сохраняя заводскую краску.', p: 'от 3 500 ₽' },
  { img: 'buff', t: 'Полировка и защита', d: 'Восстановительная полировка, керамика и плёнка на уязвимые зоны.', p: 'от 7 000 ₽' },
];
function Services() {
  return (
    <section id="services" className="border-t border-[var(--line)] py-20 md:py-28" aria-labelledby="svc-title">
      <div className="wrap">
        <h2 id="svc-title" className="h2 m-0">Что делаем в цехе</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => (
            <article key={s.t} className="svc grid overflow-hidden rounded-[12px] bg-bg-2 sm:grid-cols-[42%_1fr]" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
              <div className="aspect-[16/10] overflow-hidden sm:aspect-auto">
                <img src={MD(s.img)} alt={s.t} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col p-6">
                <h3 className="disp m-0 text-[24px]">{s.t}</h3>
                <p className="mb-0 mt-2 text-[15px] text-tx-2">{s.d}</p>
                <div className="mt-auto pt-5 font-semibold text-y">{s.p}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ['Осмотр или фото', 'Бесплатно оцениваем на месте или по фото за 15 минут.'],
  ['Смета и срок', 'Фиксируем стоимость и дату готовности до начала работ.'],
  ['Ремонт и покраска', 'Присылаем фото процесса, красим в камере.'],
  ['Выдача', 'Полируем, проверяем при вас и выдаём гарантию.'],
];
function Process() {
  return (
    <section className="border-t border-[var(--line)] bg-bg-2 py-20 md:py-28" aria-labelledby="pr-title">
      <div className="wrap">
        <h2 id="pr-title" className="h2 m-0">Как проходит ремонт</h2>
        <ol className="m-0 mt-12 grid list-none gap-px overflow-hidden rounded-[12px] bg-[var(--line)] p-0 md:grid-cols-4">
          {STEPS.map(([t, d], k) => (
            <li key={t} className="bg-bg-2 p-6 md:p-7">
              <div className="disp text-[44px] leading-none text-y">0{k + 1}</div>
              <h3 className="disp m-0 mt-6 text-[22px]">{t}</h3>
              <p className="mb-0 mt-2 text-[15px] text-tx-2">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ['Будет ли видно, где красили?', 'Подбираем цвет по коду краски и спектрофотометру, делаем переходы на соседние детали. Разницу не видно даже при ярком солнце.'],
  ['Работаете со страховыми?', 'Да, по ОСАГО и КАСКО. Поможем с документами и согласованием сметы со страховой.'],
  ['Сколько ждать запчасти?', 'Популярные детали — 1–3 дня, остальные заказываем и сразу называем срок.'],
  ['Что с гарантией?', 'Гарантия 2 года на покраску и кузовные работы, прописана в заказ-наряде.'],
];
function Faq() {
  return (
    <section id="faq" className="border-t border-[var(--line)] py-20 md:py-28" aria-labelledby="faq-title">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <h2 id="faq-title" className="h2 m-0 lg:col-span-4">Частые вопросы</h2>
        <div className="border-t border-[var(--line)] lg:col-span-8">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq border-b border-[var(--line)]">
              <summary className="ui-dim ui-focus flex items-center justify-between gap-6 py-5 text-[18px] font-semibold">
                {q}
                <span aria-hidden="true" className="plus text-[26px] font-normal text-y">+</span>
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
        <span><span className="disp text-tx">{BRAND}</span> · кузовной ремонт · {CITY} · ежедневно 9:00–21:00</span>
        <a href="tel:+79000000000" className="ui-dim ui-focus text-tx no-underline">{PHONE}</a>
      </div>
    </footer>
  );
}

export default function App() {
  useMemo(() => {
    document.title = `${BRAND} — кузовной ремонт и покраска`;
  }, []);
  return (
    <>
      <Hero />
      <main>
        <CarCalc />
        <Services />
        <PhotoEstimate />
        <Process />
        <Faq />
      </main>
      <Footer />
      {!EMBED && <DemoBadge tone="dark" />}
    </>
  );
}
