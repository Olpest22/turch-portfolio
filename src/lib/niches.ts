/** Niches the portfolio supports in personalised links (?n=…), shared by the home page, /link/ and /leads/. */
export type Demo = 'remont' | 'potolki' | 'mebel' | 'kuhni' | 'vyveski' | 'kuzov';

export const NICHES: Record<string, { label: string; demo: Demo; hook: string }> = {
  remont: { label: 'Ремонт квартир', demo: 'remont', hook: 'Там калькулятор сметы: клиент сам считает стоимость ремонта и оставляет заявку.' },
  doma: { label: 'Строительство домов', demo: 'remont', hook: 'Там калькулятор: клиент сам прикидывает стоимость и оставляет заявку.' },
  potolki: { label: 'Натяжные потолки', demo: 'potolki', hook: 'Там 3D-примерка: клиент выбирает фактуру и подсветку и сразу видит цену.' },
  kuhni: { label: 'Кухни на заказ', demo: 'kuhni', hook: 'Там конструктор кухни: клиент собирает кухню, видит цену, а заявка сразу приходит вам.' },
  mebel: { label: 'Мебель на заказ', demo: 'mebel', hook: 'Там конструктор шкафа: клиент выбирает размер и фасады и сразу видит цену.' },
  vyveski: { label: 'Изготовление вывесок', demo: 'vyveski', hook: 'Там конструктор: клиент пишет текст вывески, видит, как она горит, и сразу цену.' },
  reklama: { label: 'Наружная реклама', demo: 'vyveski', hook: 'Там конструктор: клиент пишет текст вывески, видит, как она горит, и сразу цену.' },
  kuzov: { label: 'Кузовной ремонт авто', demo: 'kuzov', hook: 'Там схема машины: клиент нажимает на повреждённую деталь и видит цену, может прислать фото.' },
};
