#!/usr/bin/env python3
"""Lead radar: one run = collect fresh Threads posts, score them, merge into the state, write the encrypted list.

Runs in GitHub Actions every 30 minutes (.github/workflows/radar.yml); no model is involved.
The list is encrypted with public.pem (RSA-OAEP-SHA256 wrapping a random AES-256-GCM key); the private key
sits in src/leads/gate.json, itself encrypted with the tracker password, so only /leads/ after login can read it.

  python3 ops/threads/radar/run.py --minutes 8 --state state/radar.json --out out/radar.enc
"""
import argparse
import base64
import concurrent.futures as cf
import datetime as dt
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
from hunt import CYR, UKR, WORDS, search, th_bin  # noqa: E402
from score import level, reply, score  # noqa: E402

KEEP_DAYS = 7
MAX_ITEMS = 300
MAX_AGE_H = 48  # older requests are already answered by others


def now():
    return dt.datetime.now(dt.timezone.utc)


def collect(minutes):
    th = th_bin()
    posts, rounds = {}, 0
    end = time.time() + minutes * 60
    with cf.ThreadPoolExecutor(4) as pool:
        while time.time() < end:
            rounds += 1
            for batch in pool.map(lambda w: search(th, w), WORDS):
                for p in batch:
                    if p.get("id"):
                        posts[p["id"]] = p
    return posts, rounds


def encrypt(payload, pubkey_path):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    pub = serialization.load_pem_public_key(Path(pubkey_path).read_bytes())
    key = AESGCM.generate_key(bit_length=256)
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, json.dumps(payload, ensure_ascii=False).encode(), None)
    wrapped = pub.encrypt(key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    return {"v": 1, "k": base64.b64encode(wrapped).decode(), "d": base64.b64encode(iv + ct).decode()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=float, default=8)
    ap.add_argument("--state", default="state/radar.json")
    ap.add_argument("--out", default="out/radar.enc")
    ap.add_argument("--pubkey", default=str(HERE / "public.pem"))
    a = ap.parse_args()

    state_path = Path(a.state)
    state = json.loads(state_path.read_text()) if state_path.exists() else {"items": {}, "runs": 0}
    items = state["items"]

    posts, rounds = collect(a.minutes)
    t_now = now()
    found = 0
    for pid, p in posts.items():
        text = (p.get("text") or "").strip()
        try:
            ts = dt.datetime.fromisoformat(p.get("timestamp", "").replace("Z", "+00:00"))
        except ValueError:
            continue
        if pid in items:  # refresh the reply count: a pile of replies means others got there first
            items[pid]["replies"] = p.get("reply_count") or items[pid].get("replies")
            continue
        if t_now - ts > dt.timedelta(hours=MAX_AGE_H) or len(text) < 8 or not CYR.search(text) or UKR.search(text):
            continue
        pts, why, niche = score(text)
        lv = level(pts, why)
        if not lv:
            continue
        found += 1
        items[pid] = {
            "id": pid, "url": p.get("permalink"), "user": p.get("username"), "ts": ts.isoformat(),
            "text": text[:1200], "score": pts, "level": lv, "why": why, "niche": niche,
            "reply": reply(niche), "replies": p.get("reply_count"), "found": t_now.isoformat(),
        }

    cutoff = t_now - dt.timedelta(days=KEEP_DAYS)
    kept = sorted((i for i in items.values() if dt.datetime.fromisoformat(i["ts"]) > cutoff), key=lambda i: i["ts"], reverse=True)[:MAX_ITEMS]
    state = {"items": {i["id"]: i for i in kept}, "runs": state.get("runs", 0) + 1}
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, ensure_ascii=False))

    payload = {"updated": t_now.isoformat(), "read": len(posts), "rounds": rounds, "new": found, "runs": state["runs"], "items": kept}
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(encrypt(payload, a.pubkey)))
    print(f"прочитано постов: {len(posts)}, кругов: {rounds}, новых запросов: {found}, в списке: {len(kept)}")


if __name__ == "__main__":
    main()
