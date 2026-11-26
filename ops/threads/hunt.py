#!/usr/bin/env python3
"""Collects fresh public Russian Threads posts that may be requests for a website.

Uses the `th` CLI (github.com/Egor01KKK/threads-content-research-agent). Its anonymous search is not a real
keyword search: for one Russian word it returns a live window of ~50 recent posts with a weak tilt toward
that word, and multi-word phrases return nothing. So we poll many single words in parallel for a few
minutes, keep posts younger than --hours, and pre-filter by website-related words. The final judgement
(is this a business owner asking for a site?) is made by the reader of the output, see hunt-prompt.md.

  python3 ops/threads/hunt.py --minutes 6 --hours 4 > candidates.jsonl
"""
import argparse
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import time

WORDS = [
    "сайт", "сайта", "сайты", "лендинг", "тильда", "разработчик", "веб", "дизайнер", "программист",
    "нужен", "ищу", "посоветуйте", "подскажите", "заявки", "клиенты", "бизнес", "магазин",
    "потолки", "кухни", "мебель", "вывеска", "автосервис", "ремонт", "мастер", "салон",
]
# a request for a website almost always names one of these
SITE = re.compile(r"сайт|лендинг|тильд|tilda|сайтодел|веб[- ]?(дизайн|разраб|студи)|визитк|интернет[- ]магазин|разработчик|программист|вебмастер|landing", re.I)
UKR = re.compile(r"[іїєґІЇЄҐ]")
CYR = re.compile(r"[а-яё]", re.I)


def th_bin():
    for p in (os.environ.get("TH_BIN"), shutil.which("th"), "/usr/local/bin/th"):
        if p and os.path.exists(p):
            return p
    sys.exit("не найден th: установите его (см. ops/threads/README.md, раздел «Окружение»)")


def search(th, word):
    r = subprocess.run([th, "search", word, "--lang", "ru-RU", "--no-cache", "--limit", "0", "--output", "jsonl", "--quiet"],
                       capture_output=True, text=True, timeout=90)
    out = []
    for line in r.stdout.splitlines():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=float, default=6)
    ap.add_argument("--hours", type=float, default=4, help="keep posts younger than this")
    ap.add_argument("--all", action="store_true", help="skip the website-word pre-filter")
    a = ap.parse_args()
    th = th_bin()
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=a.hours)
    seen, kept, total, rounds = set(), [], 0, 0
    end = time.time() + a.minutes * 60
    with cf.ThreadPoolExecutor(4) as pool:
        while time.time() < end:
            rounds += 1
            for posts in pool.map(lambda w: search(th, w), WORDS):
                for p in posts:
                    pid = p.get("id")
                    if not pid or pid in seen:
                        continue
                    seen.add(pid)
                    total += 1
                    text = (p.get("text") or "").strip()
                    try:
                        ts = dt.datetime.fromisoformat(p.get("timestamp", "").replace("Z", "+00:00"))
                    except ValueError:
                        continue
                    if ts < cutoff or len(text) < 25 or not CYR.search(text) or UKR.search(text):
                        continue
                    if not a.all and not SITE.search(text):
                        continue
                    kept.append({
                        "age_min": int((dt.datetime.now(dt.timezone.utc) - ts).total_seconds() // 60),
                        "user": p.get("username"),
                        "url": p.get("permalink"),
                        "replies": p.get("reply_count"),
                        "text": text,
                    })
    kept.sort(key=lambda x: x["age_min"])
    for k in kept:
        print(json.dumps(k, ensure_ascii=False))
    print(f"прочитано постов: {total}, кругов: {rounds}, кандидатов: {len(kept)}", file=sys.stderr)


if __name__ == "__main__":
    main()
