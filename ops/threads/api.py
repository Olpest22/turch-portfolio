#!/usr/bin/env python3
"""Threads API helper for the TURCH account.

The token is never in this repo or on the command line: in the cloud session the network proxy adds
"Authorization: Bearer <token>" to every request to graph.threads.com (saved once through the secure form).
Requests go through curl so they use the session's proxy and CA bundle.

  python3 ops/threads/api.py me              who the token belongs to
  python3 ops/threads/api.py recent [N]      last N posts with views / likes / replies
  python3 ops/threads/api.py check FILE      length check, posts nothing
  python3 ops/threads/api.py post FILE       publish a text post (FILE: UTF-8 text)
  python3 ops/threads/api.py limit           publishing quota for the last 24 h
"""
import json
import subprocess
import sys
import time
import unicodedata

API = "https://graph.threads.com/v1.0"
HINTS = {
    190: "токен недействителен или истёк. Нужен новый: ops/threads/README.md, шаг «Токен».",
    10: "у токена нет нужного разрешения (threads_content_publish или threads_manage_insights).",
    4: "превышен лимит запросов, попробуйте позже.",
}


def call(url, data=None):
    cmd = ["curl", "-sS", "-w", "\n%{http_code}", url]
    for k, v in (data or {}).items():
        cmd += ["--data-urlencode", f"{k}={v}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"сеть: запрос не прошёл ({r.stderr.strip()})")
    body, _, code = r.stdout.rpartition("\n")
    try:
        js = json.loads(body or "{}")
    except json.JSONDecodeError:
        sys.exit(f"Threads API: непонятный ответ ({code}): {body[:200]}")
    if int(code) >= 400 or "error" in js:
        e = js.get("error", {})
        c = e.get("code")
        hint = HINTS.get(c, "")
        sys.exit(f"Threads API {c}: {e.get('message')}" + (f"\n→ {hint}" if hint else ""))
    return js


def length(text):
    """Threads allows 500 characters; emoji are counted by their UTF-8 bytes, so count them that way."""
    return sum(len(c.encode()) if ord(c) > 0xFFFF or unicodedata.category(c) == "So" else 1 for c in text)


def read(path):
    text = open(path, encoding="utf-8").read().strip()
    n = length(text)
    if n > 500:
        sys.exit(f"пост длиннее лимита: {n} из 500, сократите")
    if "**" in text or text.lstrip().startswith("#"):
        sys.exit("в тексте разметка Markdown (** или #): Threads её не показывает, уберите")
    return text, n


def main(argv):
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "me":
        print(json.dumps(call(f"{API}/me?fields=id,username,name,threads_biography"), ensure_ascii=False, indent=1))
    elif cmd == "recent":
        n = argv[2] if len(argv) > 2 else "15"
        posts = call(f"{API}/me/threads?fields=id,text,timestamp,permalink&limit={n}").get("data", [])
        for p in posts:
            stats = {}
            try:
                for d in call(f"{API}/{p['id']}/insights?metric=views,likes,replies,reposts,quotes").get("data", []):
                    vals = d.get("values") or [{}]
                    stats[d["name"]] = vals[0].get("value", d.get("total_value", {}).get("value"))
            except SystemExit:
                pass
            s = " ".join(f"{k}={v}" for k, v in stats.items()) or "(статистика недоступна)"
            print(f"--- {p.get('timestamp', '')[:16]}  {s}\n{p.get('text', '')}\n{p.get('permalink', '')}\n")
        if not posts:
            print("постов пока нет")
    elif cmd == "limit":
        print(json.dumps(call(f"{API}/me/threads_publishing_limit?fields=quota_usage,config"), indent=1))
    elif cmd == "check":
        _, n = read(argv[2])
        print(f"длина {n} из 500, разметки нет")
    elif cmd == "post":
        text, _ = read(argv[2])
        cid = call(f"{API}/me/threads", {"media_type": "TEXT", "text": text})["id"]
        time.sleep(30)  # Meta: give the container ~30 s before publishing
        mid = call(f"{API}/me/threads_publish", {"creation_id": cid})["id"]
        print("опубликовано:", call(f"{API}/{mid}?fields=permalink").get("permalink"))
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
