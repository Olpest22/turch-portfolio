import { BASE } from './base';
import { NICHES } from './niches';
import { contactLine, type Channel } from './contact';

/* Outreach copy for cold leads: first message, two follow-ups and replies to objections.
   Everything is sent by hand, one chat at a time. */

export type Source = '2gis' | 'yandex';
export const SOURCES: Record<Source, string> = { '2gis': 'в 2ГИС', yandex: 'на Яндекс Картах' };

export type Group = 'remont' | 'mebel' | 'vyveski' | 'kuzov' | 'tipografiya';
export const groupOf = (n: string): Group => {
  const d = NICHES[n]?.demo ?? 'remont';
  if (d === 'kuhni' || d === 'mebel') return 'mebel';
  if (d === 'vyveski') return 'vyveski';
  if (d === 'kuzov') return 'kuzov';
  if (d === 'tipografiya') return 'tipografiya';
  return 'remont';
};

/** Why a site pays off in this niche — used in the first follow-up. */
const WHY: Record<Group, string> = {
  remont: 'Человек, который ищет ремонт или потолки, хочет до звонка понять примерную цену. Калькулятор на сайте даёт ему это, а вам приходит заявка уже с площадью и телефоном.',
  mebel: 'Кухню и мебель выбирают долго и сравнивают несколько мастерских. Конструктор с ценой помогает клиенту остановиться на вас, а заявка приходит уже с размерами.',
  vyveski: 'Клиенту проще решиться, когда он видит своё название на вывеске и цену сразу, без переписки. Заявка приходит уже с текстом и размером.',
  tipografiya: 'Визитки, буклеты и пакеты заказывают там, где сразу понятны цена и срок. Калькулятор тиража отвечает на это без звонка, а заявка приходит уже с макетом.',
  kuzov: 'Владелец машины хочет до приезда понять, сколько будет стоить ремонт. Схема с ценой и загрузка фото дают вам заявки, где повреждения уже видно.',
};

/** What one order is roughly worth, for the «дорого» reply. */
const ORDER: Record<Group, string> = {
  remont: 'один заказ на потолок или ремонт',
  mebel: 'одна кухня или шкаф',
  vyveski: 'одна вывеска',
  kuzov: 'один-два ремонта',
  tipografiya: 'пара тиражей для постоянного клиента',
};

export type LeadLike = { niche: string; name: string; city: string; source: Source };

/** `ch` = the messenger the link is sent in: the lead's page then offers to answer in that same messenger. */
export const leadLink = (l: Pick<LeadLike, 'niche' | 'name' | 'city'>, ch?: Channel) => {
  const p = new URLSearchParams({ n: l.niche });
  if (ch) p.set('c', ch);
  if (l.name.trim()) p.set('name', l.name.trim().slice(0, 42));
  if (l.city.trim()) p.set('city', l.city.trim().slice(0, 42));
  // keep Cyrillic readable in the chat: a link full of %D0%9F looks like spam
  const qs = p.toString().replace(/(?:%D0%[89AB][0-9A-F]|%D1%[89][0-9A-F]|%D0%81|%D1%91)+/gi, (m) => decodeURIComponent(m));
  return `${window.location.origin}${BASE}?${qs}`;
};

const nm = (l: LeadLike) => (l.name.trim() ? `«${l.name.trim()}»` : 'вашу компанию');
const nm2 = (l: LeadLike) => (l.name.trim() ? `для «${l.name.trim()}»` : 'для вас');

/** Step 0 = first message, 1 and 2 = follow-ups. */
export function message(l: LeadLike, step: number, ch?: Channel): string {
  const link = leadLink(l, ch);
  const hook = NICHES[l.niche]?.hook ?? '';
  if (step <= 0)
    return `Здравствуйте! Нашёл ${nm(l)} ${SOURCES[l.source]} и заметил, что у вас нет сайта. Сделал пример, каким он мог бы быть, там уже ваше название: ${link}\n\n${hook}\n\nЕсли интересно, за 24 часа бесплатно сделаю первый экран под вас. Если не актуально, просто напишите, больше не побеспокою.`;
  if (step === 1)
    return `Добрый день! Напомню про пример сайта ${nm2(l)}: ${link}\n\n${WHY[groupOf(l.niche)]}\n\nМогу бесплатно сделать первый экран с вашими фото и ценами. От вас нужны только 3–5 фото работ. Сделать?`;
  return `Последнее сообщение, чтобы не надоедать. Если сайт пока не нужен, понимаю. Пример останется по ссылке: ${link}\n\nРешите сделать, пишите сюда. Сайт от 15 000 ₽, 5–7 дней.`;
}

/** Days to wait after step N was sent before the next one is due. */
export const WAIT = [2, 5];
export const STEP_LABEL = ['Первое сообщение', 'Напоминание 1', 'Напоминание 2'];

export function objections(l: LeadLike, ch?: Channel): [string, string][] {
  const link = leadLink(l, ch);
  const other = contactLine(ch);
  const g = groupOf(l.niche);
  return [
    [
      'Сколько стоит? Что входит?',
      `От 15 000 ₽, срок 5–7 дней. Входит: дизайн под вашу нишу, версия для телефона, ваши услуги, цены и фото работ, заявки с сайта сразу вам в мессенджер или на почту, размещение и подключение домена, базовая настройка для Яндекса и Google.\n\nПервый экран сделаю бесплатно за 24 часа, чтобы вы посмотрели до оплаты.`,
    ],
    [
      'Дорого',
      `Понимаю. Оплата один раз, без ежемесячной платы за сайт, отдельно только домен, это несколько сотен рублей в год. Обычно ${ORDER[g]} с сайта уже его окупает.\n\nДавайте начнём с бесплатного первого экрана: посмотрите и решите, без обязательств.`,
    ],
    [
      'У нас есть Карты / Авито / группа',
      `Отлично, значит клиенты вас уже ищут. Сайт их не заменяет, а дополняет: ссылка будет стоять в карточке, и тот, кому мало фото и отзывов, увидит цены, ваши работы и оставит заявку, а не уйдёт к соседу, у которого сайт есть.`,
    ],
    [
      'Не нужно / Нет времени',
      `Понял, спасибо, что ответили! От вас почти ничего не нужно: 5–10 фото работ и прайс, остальное сделаю сам. Если передумаете, пример останется по ссылке: ${link}`,
    ],
    [
      'Подумаю / Пришлите КП',
      `Конечно. Чтобы было на что смотреть, давайте я бесплатно сделаю первый экран с вашими фото и названием, это ни к чему не обязывает. Пришлёте 3–5 фото работ?`,
    ],
    [
      'А вы кто? Есть примеры?',
      `Я делаю сайты для местных компаний. Примеры на той же странице: ниже есть ещё пять сайтов для разных ниш, их можно открыть и потыкать. Пишите сюда, отвечу${other ? `. Если удобнее, я есть в ${other}` : ''}.`,
    ],
    [
      'Согласен на бесплатный экран',
      `Отлично! Пришлите, пожалуйста:\n1. 3–5 фото ваших работ\n2. Основные услуги и цены «от»\n3. Телефон или мессенджер для заявок\n\nЗавтра в это же время покажу первый экран.`,
    ],
  ];
}

/* ─── contacts ─── */
export const digits = (s: string) => s.replace(/\D/g, '');
/** Russian mobile/landline to 7XXXXXXXXXX, or '' if it doesn't look like a phone. */
export function normPhone(s: string) {
  let d = digits(s);
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  return d.length === 11 && d[0] === '7' ? d : '';
}
export const waUrl = (phone: string, text: string) => {
  const p = normPhone(phone);
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : '';
};
/** Accepts @user, t.me/user, a bare username, or a phone number. */
export function tgUrl(tg: string, phone: string) {
  const t = tg.trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '');
  if (t && /^[a-z0-9_]{4,32}$/i.test(t)) return `https://t.me/${t}`;
  const p = normPhone(tg) || normPhone(phone);
  return p ? `https://t.me/+${p}` : '';
}
export const fmtPhone = (s: string) => {
  const p = normPhone(s);
  return p ? `+7 ${p.slice(1, 4)} ${p.slice(4, 7)}-${p.slice(7, 9)}-${p.slice(9)}` : s;
};
