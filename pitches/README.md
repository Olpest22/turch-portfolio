# Персональные первые экраны

Каждая папка `pitches/<slug>/` превращается при сборке в страницу `https://olpest22.github.io/turch-portfolio/p/<slug>/`:
шаблон ниши с названием, городом, телефоном, логотипом, фирменным цветом, фото и уровнем цен лида.
Страница закрыта от поисковиков (noindex). Превью для мессенджеров берётся из `shot-d.png`.

Собирает Claude командами `scripts/pitch.py` (описание в начале файла):

```bash
python3 scripts/pitch.py new promboklet --demo tipografiya --brand "ПромБуклет" --city Владивосток --phone "+7 914 000-12-34"
python3 scripts/pitch.py logo promboklet logo.png          # цвет возьмётся из логотипа
python3 scripts/pitch.py names kuzov                        # какие фото шаблона можно заменить
python3 scripts/pitch.py photo promboklet hero photo1.jpg
python3 scripts/pitch.py set promboklet priceK 0.85         # их цены ниже наших на 15%
python3 scripts/pitch.py shots promboklet                   # скриншоты для чата
```

Что нужно от лида: логотип, 3–5 фото работ, телефон, 2–3 цены «от» (чтобы посчитать priceK).
Ответил «нет» или молчит неделю: удалить папку.
