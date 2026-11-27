#!/usr/bin/env python3
"""Renders the starter Instagram carousels (1080x1350 PNG) for @turcher_i from HTML templates.

  python3 ops/social/make_posts.py SHOTS_DIR OUT_DIR

SHOTS_DIR holds section screenshots of the demos: <demo>-d.png (1440x900) and <demo>-m.png (780x1688).
Rendering uses the Playwright Chromium that is installed in the cloud session.
"""
import html
import subprocess
import sys
import textwrap
from pathlib import Path

SHOTS, OUT = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
HANDLE = "@turcher_i"

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@700;800&family=Onest:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#0e0d0c;color:#f4f1ea;font-family:Onest,sans-serif;position:relative;overflow:hidden}
.pad{position:absolute;inset:84px 80px}
.h{font-family:Commissioner,sans-serif;font-weight:800;letter-spacing:-.035em;line-height:.98}
.acc{color:#ff6b1a}
.mut{color:rgba(244,241,234,.62)}
.foot{position:absolute;left:80px;right:80px;bottom:64px;display:flex;justify-content:space-between;font-size:26px;color:rgba(244,241,234,.5)}
.logo{font-family:Commissioner;font-weight:800;letter-spacing:.12em;color:#f4f1ea}
.win{border-radius:22px;overflow:hidden;box-shadow:0 0 0 2px rgba(244,241,234,.12),0 60px 120px -40px #000;background:#1a1816}
.bar{height:44px;display:flex;align-items:center;gap:10px;padding:0 18px;background:#201d1a}
.bar i{width:13px;height:13px;border-radius:50%;background:rgba(244,241,234,.18);display:block}
.bar span{margin-left:14px;font-size:19px;color:rgba(244,241,234,.45)}
.phone{border-radius:58px;padding:14px;background:#201d1a;box-shadow:0 0 0 2px rgba(244,241,234,.14),0 60px 120px -30px #000}
.phone img{display:block;border-radius:44px}
.li{display:flex;gap:22px;align-items:baseline;font-size:40px;line-height:1.25;padding:26px 0;border-bottom:2px solid rgba(244,241,234,.1)}
.li b{font-family:Commissioner;color:#ff6b1a;font-size:34px;min-width:52px}
.chip{display:inline-block;padding:12px 22px;border-radius:999px;background:rgba(255,107,26,.14);color:#ffb48a;font-size:28px;font-weight:600}
.glow{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,107,26,.22),transparent);filter:blur(10px)}
"""


def page(body, n, total):
    dots = "".join(f'<span style="display:inline-block;width:{28 if i == n else 10}px;height:10px;border-radius:9px;margin-left:8px;background:{"#ff6b1a" if i == n else "rgba(244,241,234,.25)"}"></span>' for i in range(total))
    return f"""<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}
<div class="foot"><span class="logo">TURCH</span><span>{HANDLE}</span><span>{dots if total > 1 else ''}</span></div></body></html>"""


def e(s):
    # keep numbers with their units on one line: «15 000 ₽», «5–7 дней», «3–5 фото»
    import re
    s = re.sub(r"(\d) (\d{3})", "\\1\u00a0\\2", s)
    s = re.sub(r"(\d[\d–]*) (₽|дн|фото|час|минут)", "\\1\u00a0\\2", s)
    return html.escape(s)


def cover(kicker, title, sub, shot):
    return f"""<div class="glow" style="left:-300px;top:-380px"></div><div class="pad">
<div class="chip">{e(kicker)}</div>
<div class="h" style="font-size:96px;margin-top:40px">{title}</div>
<div class="mut" style="font-size:38px;line-height:1.3;margin-top:28px;max-width:860px">{e(sub)}</div>
<div class="win" style="position:absolute;left:0;right:0;top:560px"><div class="bar"><i></i><i></i><i></i><span>{e(kicker.lower())}</span></div>
<img src="{shot.as_uri()}" style="display:block;width:100%;height:520px;object-fit:cover;object-position:top"></div></div>"""


def phone(title, points, shot):
    lis = "".join(f'<div class="li" style="font-size:36px;padding:22px 0"><b>{i + 1:02d}</b><span>{e(p)}</span></div>' for i, p in enumerate(points))
    return f"""<div class="glow" style="right:-420px;bottom:-300px"></div><div class="pad" style="display:flex;gap:56px;align-items:center">
<div style="flex:1"><div class="h" style="font-size:66px">{title}</div><div style="margin-top:36px">{lis}</div></div>
<div class="phone" style="width:400px;flex:none"><img src="{shot.as_uri()}" style="width:372px;height:806px;object-fit:cover;object-position:top"></div></div>"""


def cta(title, note):
    return f"""<div class="glow" style="left:90px;top:200px"></div><div class="pad" style="display:flex;flex-direction:column;justify-content:center">
<div class="h" style="font-size:92px">{title}</div>
<div style="font-size:40px;line-height:1.35;margin-top:44px;max-width:860px">Первый экран вашего сайта сделаю <span class="acc">бесплатно за 24 часа</span>: с вашими фото, названием и ценами.</div>
<div style="font-size:40px;line-height:1.35;margin-top:28px">Напишите в директ слово <span class="acc">«сайт»</span>.</div>
<div class="mut" style="font-size:28px;margin-top:60px">{e(note)}</div></div>"""


def text_slide(title, items, start=1):
    lis = "".join(f'<div class="li" style="font-size:48px;padding:34px 0"><b style="font-size:40px;min-width:64px">{start + i:02d}</b><span>{e(t)}</span></div>' for i, t in enumerate(items))
    return f"""<div class="glow" style="right:-380px;top:-300px"></div><div class="pad" style="display:flex;flex-direction:column;justify-content:center"><div class="h" style="font-size:96px;margin-bottom:48px">{title}</div>{lis}</div>"""


def big(title, sub=""):
    s = f'<div class="mut" style="font-size:40px;line-height:1.3;margin-top:40px;max-width:880px">{e(sub)}</div>' if sub else ""
    return f"""<div class="glow" style="left:-260px;bottom:-200px"></div><div class="pad" style="display:flex;flex-direction:column;justify-content:center"><div class="h" style="font-size:112px">{title}</div>{s}</div>"""


DEMO = "Это демо-пример: показываю, как может выглядеть сайт для этой ниши."
DEMOS = [
    # posting order: oldest first, so the intro (last) ends up first in the grid
    ("kuzov", "Кузовной ремонт", "Сайт для<br>кузовного<br><span class=acc>ремонта</span>", "Клиент нажимает на деталь машины и сразу видит цену.",
     "Что умеет", ["Схема машины: нажал на деталь, увидел цену", "Класс авто и тип повреждения", "Можно прислать фото повреждений", "Заявка приходит вам сразу с фото"]),
    ("vyveski", "Вывески", "Сайт для<br>мастерской<br><span class=acc>вывесок</span>", "Клиент пишет название своего кафе и видит, как оно горит на фасаде.",
     "Что умеет", ["Название клиента горит неоном", "Неон, объёмные буквы или лайтбокс", "Цвет, шрифт, высота букв", "Цена с монтажом сразу"]),
    ("kuhni", "Кухни на заказ", "Сайт для<br>кухонь<br><span class=acc>на заказ</span>", "Клиент сам собирает кухню и видит цену до замера.",
     "Что умеет", ["Прямая, угловая, П-образная, с островом", "Длина стены, фасады, столешница", "Кухня рисуется вживую", "Заявка на замер приходит вам"]),
    ("mebel", "Мебель на заказ", "Сайт для<br>мебели<br><span class=acc>на заказ</span>", "Конструктор шкафа: размер, фасады, наполнение и цена за минуту.",
     "Что умеет", ["Ширина и высота шкафа", "Фасады, ручки, наполнение", "Цена считается сразу", "Запись в шоурум в один клик"]),
    ("remont", "Ремонт квартир", "Сайт для<br>ремонта<br><span class=acc>квартир</span>", "Калькулятор сметы: клиент сам считает стоимость ремонта.",
     "Что умеет", ["Площадь и тип ремонта", "Цена и срок сразу", "Этапы и фото объектов", "Заявка на замер в один клик"]),
    ("potolki", "Натяжные потолки", "Сайт для<br>натяжных<br><span class=acc>потолков</span>", "3D-примерка: клиент выбирает фактуру и свет и видит цену.",
     "Что умеет", ["Глянец, сатин или мат", "Цвет и подсветка в 3D", "Площадь и цена сразу", "Вызов замерщика в один клик"]),
]


def render(name, slides):
    files = []
    for i, body in enumerate(slides):
        f = OUT / f"{name}-{i + 1}.html"
        f.write_text(page(body, i, len(slides)), encoding="utf-8")
        files.append(f)
    return files


jobs = []
for n, (d, kicker, title, sub, t2, pts) in enumerate(DEMOS, 1):
    jobs += render(f"{n:02d}-{d}", [
        cover(kicker, title, sub, SHOTS / f"{d}-d.png"),
        phone(t2, pts, SHOTS / f"{d}-m.png"),
        cta("Хотите такой<br>для своей<br>компании?", DEMO),
    ])
jobs += render("07-price", [
    big("Сайт за<br><span class=acc>15 000 ₽</span>.<br>Что входит", "Сайт-визитка за 5 дней. С калькулятором, как в примерах, 25 000 ₽."),
    text_slide("Делаю", ["Дизайн под вашу нишу", "Версию для телефона", "Ваши услуги, цены и фото работ", "Заявки вам в мессенджер или на почту"]),
    text_slide("И ещё", ["Размещаю сайт и подключаю домен", "Настраиваю для Яндекса и Google", "Две недели правок бесплатно", "Оплата частями, с чеком"], start=5),
    cta("Сначала<br>посмотрите<br>бесплатно", "Не понравится первый экран, ничего не платите."),
])
jobs += render("08-maps", [
    big("Клиент нашёл<br>вас на картах.<br><span class=acc>Что дальше?</span>", "Пять похожих карточек, у всех фото и звёзды. Звонят тому, у кого сразу понятна цена."),
    text_slide("Карточка на картах", ["Несколько фото", "Телефон и адрес", "«Цены уточняйте по телефону»"]),
    text_slide("Сайт", ["Ваши работы и цены", "Калькулятор под вашу нишу", "Заявка в один клик, даже ночью", "Ссылка стоит прямо в карточке"]),
    cta("Покажу, как<br>это будет<br>у вас", "Сайт не заменяет карты, а дополняет их."),
])
jobs += render("09-intro", [
    big("Привет, я Турч.<br>Делаю сайты<br>для <span class=acc>местного<br>бизнеса</span>", "Потолки, ремонт, кухни, мебель, вывески, кузовной ремонт."),
    text_slide("Как работаю", ["Вы пишете пару слов о бизнесе и присылаете 3–5 фото работ", "Через 24 часа показываю первый экран сайта, бесплатно", "Нравится: доделываю за 5–7 дней, от 15 000 ₽"]),
    cta("Примеры<br>в шапке<br>профиля", "У каждой ниши свой пример: листайте посты ниже."),
])

# one Chromium run for all slides
script = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage({{ viewport: {{ width: 1080, height: 1350 }}, deviceScaleFactor: 1 }});
  for (const f of {[str(j) for j in jobs]!r}) {{
    await p.goto('file://' + f, {{ waitUntil: 'networkidle' }});
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({{ path: f.replace(/\\.html$/, '.png') }});
  }}
  await b.close();
}})();
"""
subprocess.run(["node", "-e", script], check=True)
for j in jobs:
    j.unlink()
print(f"готово: {len(jobs)} слайдов в {OUT}")
