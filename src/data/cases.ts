export type Layout = 'neon' | 'poster' | 'split' | 'full' | 'editorial' | 'beforeafter' | 'light';

export interface CaseItem {
  id: string;
  niche: string;
  brand: string;
  domain: string;
  layout: Layout;
  photo: string;
  /** what makes this concept stand out — shown to the lead */
  device: string;
  theme: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentInk: string;
    display: string;
    body: string;
    displayWeight: number;
    upper?: boolean;
  };
  nav: string[];
  headline: string;
  sub: string;
  cta: string;
  features: [string, string][];
  section: { title: string; items: string[] };
}

const SERIF = "'Prata', Georgia, serif";
const OSWALD = "'Oswald', 'Arial Narrow', sans-serif";
const JOST = "'Jost', system-ui, sans-serif";
const RUSSO = "'Russo One', system-ui, sans-serif";
const ONEST = "'Onest', system-ui, sans-serif";

export const cases: CaseItem[] = [
  {
    id: 'signs',
    niche: 'Изготовление вывесок',
    brand: 'Светоформ',
    domain: 'svetoform.ru',
    layout: 'neon',
    photo: '/cases/signs.webp',
    device: 'Заголовок светится как неон и «включается» при загрузке',
    theme: { bg: '#07060A', surface: '#14111A', text: '#FFF4F8', muted: '#B9AFC2', accent: '#FF3D7F', accentInk: '#1A0410', display: OSWALD, body: ONEST, displayWeight: 700, upper: true },
    nav: ['Вывески', 'Неон', 'Монтаж', 'Контакты'],
    headline: 'Вывески, которые видно с другого конца улицы',
    sub: 'Объёмные буквы, лайтбоксы и гибкий неон. Проект, производство и монтаж.',
    cta: 'Рассчитать вывеску',
    features: [['Проект', 'визуализация на фото фасада'], ['Производство', 'своя мастерская'], ['Монтаж', 'с согласованием']],
    section: { title: 'Что делаем', items: ['Объёмные буквы', 'Лайтбоксы', 'Гибкий неон', 'Таблички и навигация'] },
  },
  {
    id: 'outdoor',
    niche: 'Наружная реклама',
    brand: 'Высота',
    domain: 'vysota-media.ru',
    layout: 'poster',
    photo: '/cases/outdoor.webp',
    device: 'Плакатная вёрстка и карта рекламных поверхностей',
    theme: { bg: '#FFD400', surface: '#111111', text: '#111111', muted: '#3A3300', accent: '#111111', accentInk: '#FFD400', display: OSWALD, body: ONEST, displayWeight: 700, upper: true },
    nav: ['Билборды', 'Медиафасады', 'Транзит', 'Карта'],
    headline: 'Ваша реклама над потоком машин',
    sub: 'Билборды, медиафасады и реклама на транспорте. Подберём поверхности под ваш район.',
    cta: 'Подобрать поверхности',
    features: [['Карта', 'все поверхности города'], ['Макет', 'дизайн входит в размещение'], ['Отчёт', 'фото с каждой точки']],
    section: { title: 'Форматы', items: ['Билборды 3×6', 'Суперсайты', 'Медиафасады', 'Брендирование транспорта'] },
  },
  {
    id: 'ceiling',
    niche: 'Натяжные потолки',
    brand: 'Глянец',
    domain: 'glyanets-potolki.ru',
    layout: 'light',
    photo: '/cases/ceiling.webp',
    device: 'Калькулятор площади прямо на первом экране',
    theme: { bg: '#F4F6F8', surface: '#FFFFFF', text: '#0E1A26', muted: '#51606E', accent: '#1F6FEB', accentInk: '#FFFFFF', display: JOST, body: JOST, displayWeight: 600 },
    nav: ['Фактуры', 'Освещение', 'Цены', 'Замер'],
    headline: 'Ровный потолок за один день',
    sub: 'Матовые, глянцевые и парящие потолки со встроенным светом. Монтаж без пыли.',
    cta: 'Вызвать замерщика',
    features: [['Фактуры', 'мат, сатин, глянец'], ['Свет', 'линии и треки'], ['Монтаж', 'без пыли и вывоза мебели']],
    section: { title: 'Посчитайте стоимость', items: ['Площадь комнаты', 'Фактура полотна', 'Светильники', 'Карнизы'] },
  },
  {
    id: 'kitchen',
    niche: 'Кухни на заказ',
    brand: 'Дубрава',
    domain: 'dubrava-kitchen.ru',
    layout: 'split',
    photo: '/cases/kitchen.webp',
    device: 'Конструктор: фасад, столешница и цвет в один клик',
    theme: { bg: '#F2ECE3', surface: '#E4D9C8', text: '#2B2219', muted: '#6B5B49', accent: '#8A4B22', accentInk: '#FFF7EE', display: SERIF, body: JOST, displayWeight: 400 },
    nav: ['Кухни', 'Материалы', 'Проекты', 'Шоурум'],
    headline: 'Кухня, собранная под ваши привычки',
    sub: 'Проектируем по размерам помещения, делаем в своём цехе и собираем за один визит.',
    cta: 'Получить 3D-проект',
    features: [['Фасады', 'шпон, эмаль, массив'], ['Столешницы', 'камень и керамика'], ['Фурнитура', 'Blum и Hettich']],
    section: { title: 'Соберите кухню', items: ['Прямая', 'Угловая', 'С островом', 'П-образная'] },
  },
  {
    id: 'furniture',
    niche: 'Мебель на заказ',
    brand: 'Форма и шпон',
    domain: 'forma-shpon.ru',
    layout: 'editorial',
    photo: '/cases/furniture.webp',
    device: 'Журнальная вёрстка с каталогом готовых работ',
    theme: { bg: '#EFE6DA', surface: '#E2D3C0', text: '#3A2A1E', muted: '#7A6553', accent: '#B5562C', accentInk: '#FFF6EC', display: SERIF, body: JOST, displayWeight: 400 },
    nav: ['Гостиные', 'Спальни', 'Шкафы', 'О мастерской'],
    headline: 'Мебель, которую передают по наследству',
    sub: 'Шкафы, диваны и столы по вашим размерам. Дерево, ткань и фурнитура на выбор.',
    cta: 'Обсудить проект',
    features: [['Эскиз', 'бесплатно'], ['Материалы', 'образцы на дом'], ['Сборка', 'нашими мастерами']],
    section: { title: 'Каталог работ', items: ['Шкафы-купе', 'Гардеробные', 'Диваны', 'Обеденные столы'] },
  },
  {
    id: 'renovation',
    niche: 'Ремонт квартир под ключ',
    brand: 'Ключ',
    domain: 'klyuch-remont.ru',
    layout: 'beforeafter',
    photo: '/cases/renovation.webp',
    device: 'Слайдер «до / после» прямо на первом экране',
    theme: { bg: '#101214', surface: '#1B1E22', text: '#F3F4F5', muted: '#A3A9B0', accent: '#2FD08A', accentInk: '#04140C', display: JOST, body: JOST, displayWeight: 700 },
    nav: ['Этапы', 'Сметы', 'Объекты', 'Гарантия'],
    headline: 'Ремонт без вашего участия',
    sub: 'Смета до начала работ, фотоотчёт каждую неделю, оплата по этапам.',
    cta: 'Рассчитать смету',
    features: [['Смета', 'фиксируется в договоре'], ['Отчёты', 'фото и видео в чат'], ['Оплата', 'после приёмки этапа']],
    section: { title: 'Как идёт ремонт', items: ['Замер и дизайн', 'Черновые работы', 'Чистовая отделка', 'Уборка и сдача'] },
  },
  {
    id: 'house',
    niche: 'Строительство домов под ключ',
    brand: 'Каркас',
    domain: 'karkas-dom.ru',
    layout: 'full',
    photo: '/cases/house.webp',
    device: 'Каталог проектов с фильтром по площади и бюджету',
    theme: { bg: '#0F1A22', surface: '#17252F', text: '#F1F5F8', muted: '#A6B6C2', accent: '#F2A93B', accentInk: '#1A1003', display: JOST, body: JOST, displayWeight: 600 },
    nav: ['Проекты', 'Технологии', 'Ипотека', 'Посёлки'],
    headline: 'Дом, в который можно въехать этой осенью',
    sub: 'Каркасные и газобетонные дома по готовым и индивидуальным проектам. Фундамент, коробка, отделка.',
    cta: 'Подобрать проект',
    features: [['Проекты', 'каталог с планировками'], ['Смета', 'фиксированная'], ['Ипотека', 'помощь с банком']],
    section: { title: 'Проекты', items: ['До 100 м²', '100–150 м²', '150–200 м²', 'Индивидуальный'] },
  },
  {
    id: 'surgery',
    niche: 'Пластическая хирургия',
    brand: 'Линия',
    domain: 'liniya-clinic.ru',
    layout: 'editorial',
    photo: '/cases/surgery.webp',
    device: 'Спокойная вёрстка, онлайн-консультация и запись к хирургу',
    theme: { bg: '#F3EEEC', surface: '#E6DDD9', text: '#2A2023', muted: '#6F6266', accent: '#7D3B4A', accentInk: '#FFF5F7', display: SERIF, body: ONEST, displayWeight: 400 },
    nav: ['Направления', 'Хирурги', 'Клиника', 'Запись'],
    headline: 'Естественный результат без спешки',
    sub: 'Консультация хирурга, план операции и сопровождение до полного восстановления.',
    cta: 'Записаться на консультацию',
    features: [['Консультация', 'очно или онлайн'], ['Стационар', 'палаты на одного'], ['Восстановление', 'наблюдение врача']],
    section: { title: 'Направления', items: ['Лицо', 'Грудь', 'Тело', 'Неинвазивная косметология'] },
  },
  {
    id: 'wedding',
    niche: 'Свадебный фотограф',
    brand: 'Свет и плёнка',
    domain: 'svet-i-plenka.ru',
    layout: 'editorial',
    photo: '/cases/wedding.webp',
    device: 'Портфолио-история: съёмки идут как свадебный день',
    theme: { bg: '#1A1714', surface: '#25211D', text: '#F6EFE6', muted: '#BBAE9F', accent: '#E8C9A0', accentInk: '#1A1209', display: SERIF, body: JOST, displayWeight: 400 },
    nav: ['Истории', 'Пакеты', 'Отзывы', 'Даты'],
    headline: 'Снимаю то, что вы забудете через неделю',
    sub: 'Репортаж всего дня: сборы, церемония, вечер. Живые кадры без постановки.',
    cta: 'Проверить свободную дату',
    features: [['Репортаж', 'весь день'], ['Плёнка', 'и цифра'], ['Альбом', 'ручной переплёт']],
    section: { title: 'Истории', items: ['Сборы', 'Церемония', 'Прогулка', 'Вечер'] },
  },
  {
    id: 'events',
    niche: 'Организация мероприятий',
    brand: 'Сцена',
    domain: 'scena-events.ru',
    layout: 'full',
    photo: '/cases/events.webp',
    device: 'Видео-обложка и квиз «соберите своё событие»',
    theme: { bg: '#0B0614', surface: '#170E26', text: '#FBF7FF', muted: '#BCAFD0', accent: '#FFCE3A', accentInk: '#1A1302', display: OSWALD, body: ONEST, displayWeight: 700, upper: true },
    nav: ['Корпоративы', 'Частные', 'Площадки', 'Кейсы'],
    headline: 'Праздник, о котором говорят в понедельник',
    sub: 'Корпоративы, юбилеи и частные вечеринки. Площадка, программа, техника и ведущий.',
    cta: 'Собрать событие',
    features: [['Площадки', 'подбор под формат'], ['Программа', 'сценарий и артисты'], ['Техника', 'свет и звук']],
    section: { title: 'Соберите событие', items: ['Формат', 'Гости', 'Площадка', 'Программа'] },
  },
  {
    id: 'autobody',
    niche: 'Кузовной ремонт авто',
    brand: 'Кузов-Лаб',
    domain: 'kuzov-lab.ru',
    layout: 'full',
    photo: '/cases/autobody.webp',
    device: 'Оценка ремонта по фото повреждения',
    theme: { bg: '#0D0D0E', surface: '#1A1A1C', text: '#F4F4F5', muted: '#A1A1A8', accent: '#E8322F', accentInk: '#FFFFFF', display: RUSSO, body: ONEST, displayWeight: 400, upper: true },
    nav: ['Кузов', 'Покраска', 'Полировка', 'Оценка'],
    headline: 'Вернём машине заводской вид',
    sub: 'Кузовной ремонт, покраска в камере и подбор цвета по коду. Работаем со страховыми.',
    cta: 'Оценить по фото',
    features: [['Оценка', 'по фото за 15 минут'], ['Камера', 'покраска без пыли'], ['Страховые', 'ОСАГО и КАСКО']],
    section: { title: 'Работы', items: ['Вмятины без покраски', 'Локальный ремонт', 'Полная покраска', 'Полировка'] },
  },
  {
    id: 'legal',
    niche: 'Юридические услуги',
    brand: 'Право и дело',
    domain: 'pravo-delo.ru',
    layout: 'split',
    photo: '/cases/legal.webp',
    device: 'Чат-квалификатор: подбор юриста за три вопроса',
    theme: { bg: '#0E1626', surface: '#16213A', text: '#EEF1F7', muted: '#A3AEC4', accent: '#C9A45C', accentInk: '#140F05', display: SERIF, body: ONEST, displayWeight: 400 },
    nav: ['Бизнесу', 'Частным лицам', 'Споры', 'Команда'],
    headline: 'Решаем споры до суда и в суде',
    sub: 'Договоры, взыскание долгов, защита бизнеса и сопровождение сделок.',
    cta: 'Получить консультацию',
    features: [['Консультация', 'первая бесплатно'], ['Договор', 'фиксированная цена'], ['Отчёт', 'по каждому шагу']],
    section: { title: 'Чем поможем', items: ['Арбитраж', 'Взыскание долгов', 'Договоры', 'Трудовые споры'] },
  },
];
