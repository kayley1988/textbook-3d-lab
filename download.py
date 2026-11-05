# -*- coding: utf-8 -*-
"""从 ChinaTextbook 仓库经镜像下载人教版教材 PDF"""
import os, sys, time, urllib.request, urllib.parse, json

ROOT = r"D:\T\textbook-3d-lab"
LIST = os.path.join(ROOT, "dl_list.txt")
MIRRORS = [
    "https://ghproxy.net/https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/",
    "https://gh-proxy.com/https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/",
    "https://ghfast.top/https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/",
]

tasks = []
for line in open(LIST, encoding="utf-8"):
    line = line.rstrip("\n")
    if not line:
        continue
    path, size = line.rsplit("\t", 1)
    tasks.append((path, int(size)))

def fetch(url, dest, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r, open(dest, "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)

ok, skip, fail = 0, 0, []
t0 = time.time()
total = sum(s for _, s in tasks)
done_bytes = 0
for i, (path, size) in enumerate(tasks, 1):
    dest = os.path.join(ROOT, "books", path.replace("/", os.sep))
    if os.path.exists(dest) and os.path.getsize(dest) == size:
        skip += 1
        done_bytes += size
        print(f"[{i}/{len(tasks)}] SKIP {path}", flush=True)
        continue
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    url_path = urllib.parse.quote(path)
    got = False
    for m in MIRRORS:
        try:
            fetch(m + url_path, dest)
            if os.path.getsize(dest) == size:
                got = True
                break
            print(f"  size mismatch ({os.path.getsize(dest)} != {size}), retry next mirror", flush=True)
            os.remove(dest)
        except Exception as e:
            print(f"  mirror fail: {e}", flush=True)
    if got:
        ok += 1
        done_bytes += size
        mb = done_bytes / 2**20
        speed = mb / max(time.time() - t0, 1)
        print(f"[{i}/{len(tasks)}] OK {path}  ({mb:.0f}/{total/2**20:.0f}MB, {speed:.1f}MB/s)", flush=True)
    else:
        fail.append(path)
        print(f"[{i}/{len(tasks)}] FAIL {path}", flush=True)

print(f"\n==== DONE ok={ok} skip={skip} fail={len(fail)} elapsed={time.time()-t0:.0f}s ====", flush=True)
if fail:
    json.dump(fail, open(os.path.join(ROOT, "failed.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for p in fail:
        print("FAILED:", p, flush=True)
