"""Rule-based scoring for the lead radar: is this Threads post someone asking for a website?

No model is involved, so every decision is explainable: `score()` returns the points and the reasons.
Levels: hot (>= 4) — a clear request, maybe (2–3) — worth a glance, below 2 — not shown.
Tune the patterns here and run `python3 ops/threads/radar/test_score.py`.
"""
import re

SITE = r"(сайт|лендинг|landing|тильд|tilda|сайтодел|вебсайт|веб[- ]?сайт|интернет[- ]магазин|визитк|вордпресс|wordpress)"
# web people only: a plain «разработчик» or «программист» is usually a job ad for apps or backend
DEV = r"(веб[- ]?(дизайнер|разработчик|мастер|студи)\w*|вебдизайнер\w*|вебмастер\w*|тильдолог\w*|сайтодел\w*|верстальщик\w*|разработчик\w*\s+сайт|спеца? по сайтам)"
GAP = r"[^.?!\n]{0,45}"  # same sentence, a few words apart


def rx(p):
    return re.compile(p, re.I)


POSITIVE = [
    (5, "просит сделать сайт", rx(rf"\b(нужен|нужна|нужно|нужны|требуется|ищу|ищем|ищет)\b{GAP}{SITE}")),
    (5, "ищет разработчика", rx(rf"\b(нужен|нужна|ищу|ищем|требуется)\b{GAP}{DEV}")),
    (5, "спрашивает, кто сделает", rx(rf"\bкто\b{GAP}(сделает|делает|может сделать|создаст|созда[её]т|сможет|занимается|делал|сделал|возьм[её]тся|берется|берётся){GAP}{SITE}")),
    (4, "просит посоветовать исполнителя", rx(rf"(посоветуйте|порекомендуйте|подскажите|посоветуете){GAP}({DEV}|\bкто\b{GAP}{SITE}|\bкого\b|где (заказать|сделать){GAP}{SITE}|{SITE}{GAP}(сделать|заказать))")),
    (5, "хочет заказать сайт", rx(rf"(хочу|хотим|хотела?|планирую|планируем)\s+заказать{GAP}{SITE}")),
    (2, "спрашивает цену сайта", rx(rf"сколько (стоит|будет стоить){GAP}{SITE}")),
    (2, "хочет сайт", rx(rf"(хочу|хотим|надо|нужно|пора)(\s+бы)?(\s+уже)?\s+(сделать|создать|завести){GAP}{SITE}")),
]
BONUS = [
    (1, "вопрос", rx(r"\?")),
    (1, "про своё дело", rx(r"(мо[её]го|нашего|наш|мой|для)\s+(бизнес|компани|салон|магазин|студи|мастерск|кафе|ресторан|клиник|школ|центр|бренд|проект|дел)")),
    (1, "просит написать", rx(r"(в лс|в личк|пишите|напишите|отзовитесь|скиньте|киньте|контакт)")),
]
NEGATIVE = [
    (-6, "сам делает сайты", rx(rf"\b(делаю|создаю|разрабатываю|сделаю|создам|разработаю|верстаю|собираю|соберу|запускаю|настраиваю){GAP}{SITE}")),
    (-6, "сам дизайнер или студия", rx(r"\b(я|мы)\s*[—–-]?\s*(веб[- ]?дизайнер|разработчик|студия|агентство|веб[- ]?мастер|вебмастер|сайтодел|тильдолог|программист)")),
    (-6, "самореклама", rx(r"самореклам|давайте знакомиться|принимаю заказы|беру заказы|открыта? запись на разработку")),
    (-5, "ищет клиентов, а не исполнителя", rx(r"(ищу|ищем)\s+(бизнес|клиент|заказ|заказчик|компани|предпринимател)")),
    (-5, "работа или обучение", rx(r"(ваканси|в штат|зарплат|резюме|ищу работу|стажировк|обучени|курс[аеыу]?\b|научиться|начинающ|новичок|освоить|войти в сферу|востребован|part[- ]?time|full[- ]?time|senior|middle|junior|backend|frontend|бэкенд|фронтенд|full[- ]?stack)")),
    (-4, "дизайнеры о заказах", rx(r"(заработать|найти клиентов|первого клиента|ищете клиентов|за деньги|как вам заказы|где брать заказы)")),
    (-2, "не наш формат", rx(r"(битрикс|bitrix|crm|срм|1с|мобильн\w* приложени|маркетплейс|телеграм[- ]бот|чат[- ]?бот)")),
    (-5, "сам предлагает ссылку", rx(r"(скину|скинуть|поделюсь|дам)\s+(сайт|ссылк)|кому нужно\W+скину")),
    (-3, "про сайты знакомств и прочее", rx(r"(сайт\w* знакомств|ссылк\w* на сайт|сайт\w* не работа|лежат сайт|сайт\w* лежат|упал сайт)")),
]

NICHES = [
    ("potolki", rx(r"потол")),
    ("kuhni", rx(r"кухн")),
    ("mebel", rx(r"мебел|шкаф|гардероб")),
    ("tipografiya", rx(r"типограф|полиграф|печать визиток|буклет")),
    ("vyveski", rx(r"вывеск|наружн\w* реклам|неон")),
    ("kuzov", rx(r"кузов|покраск|автосервис|\bсто\b|авторемонт|детейлинг")),
    ("doma", rx(r"строительн|строим дома|домов|каркасн|сруб")),
    ("remont", rx(r"ремонт\w* квартир|отделк|ремонтн\w* бригад|ремонт под ключ")),
]
DEMO = {"tipografiya": "tipografiya", "potolki": "potolki", "kuhni": "kuhni", "mebel": "mebel", "vyveski": "vyveski", "kuzov": "kuzov", "doma": "remont", "remont": "remont"}
DEMO_TEXT = {
    "remont": "вот пример с калькулятором сметы",
    "potolki": "вот пример с 3D-примеркой потолка и ценой",
    "kuhni": "вот пример с конструктором кухни",
    "mebel": "вот пример с конструктором шкафа",
    "vyveski": "вот пример: пишешь название, и вывеска загорается на фасаде",
    "tipografiya": "вот пример с калькулятором тиража и загрузкой макета",
    "kuzov": "вот пример для кузовного: нажимаешь на деталь машины и видишь цену",
}
PORTFOLIO = "https://olpest22.github.io/turch-portfolio/"


def score(text):
    t = text.strip()
    pts, why = 0, []
    hit = False
    for p, label, r in POSITIVE:
        if r.search(t):
            pts += p
            why.append(label)
            hit = True
            break  # one strong reason is enough; stacking synonyms would inflate the score
    if not hit:
        return 0, [], ""
    for p, label, r in BONUS:
        if r.search(t):
            pts += p
            why.append(label)
    for p, label, r in NEGATIVE:
        if r.search(t):
            pts += p
            why.append(label)
    niche = next((k for k, r in NICHES if r.search(t)), "")
    return pts, why, niche


def level(pts, why=None):
    # «hot» needs a strong reason by itself; a price question plus bonuses stays «maybe»
    weak = bool(why) and why[0] in ("спрашивает цену сайта", "хочет сайт")
    return "maybe" if pts >= 2 and (pts < 4 or weak) else "hot" if pts >= 4 else ""


def _contacts():
    import json
    from pathlib import Path
    c = json.loads((Path(__file__).resolve().parents[3] / "src/lib/contacts.json").read_text())
    out = []
    if c.get("whatsapp"):
        out.append("WhatsApp +" + "".join(ch for ch in c["whatsapp"] if ch.isdigit()))
    if c.get("telegram"):
        out.append("Telegram @" + c["telegram"].lstrip("@"))
    return out


def reply(niche):
    """Ready reply under a Threads post, in the account's voice (.claude/skills/threads-posts/references/account.md).
    The person is on Threads, so the first ask is a DM right here; other messengers are listed as an option."""
    d = DEMO.get(niche)
    example = f"{DEMO_TEXT[d]}: {PORTFOLIO}{d}/" if d else f"примеры тут: {PORTFOLIO}"
    other = _contacts()
    tail = f" или в {', '.join(other)}" if other else ""
    return (f"Делаю сайты для местного бизнеса, {example}\n"
            "Могу за сутки бесплатно собрать первый экран под вас, посмотрите и решите. "
            f"Напишите мне здесь в личку{tail}")
