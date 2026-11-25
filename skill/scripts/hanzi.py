#!/usr/bin/env python3
"""从 hanzi-writer-data 里取汉字笔画矢量，导成可内联进 scene.js 的精简片段。

数据来源：hanzi-writer-data 2.0.1（9355 个常用字，Arphic Public License，可商用）
每个字包含：
  strokes —— 每笔的闭合 SVG 轮廓路径（1024 网格，原点左下，y 轴向上）
  medians —— 每笔的书写中线折线（用于笔尖动画与笔顺判定）

用法：
    python hanzi.py 明 男 尖 尘                    # 打印 JS 常量
    python hanzi.py 明 男 尖 尘 -o glyphs.js       # 写入文件
    python hanzi.py 明 --stats                     # 只看笔画数等统计

生成的片段长这样，直接贴在 scene.js 顶部即可：

    const GLYPHS = {
      "明": { s: ["M ... Z", ...], m: [[[x,y], ...], ...] },
    };
"""
import argparse
import json
import sys
import tarfile
from pathlib import Path

CACHE = Path("D:/T/_cache/hanzi-writer-data-2.0.1.tgz")
TARBALL_URL = "https://registry.npmjs.org/hanzi-writer-data/-/hanzi-writer-data-2.0.1.tgz"


def ensure_cache() -> Path:
    if CACHE.exists():
        return CACHE
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    print(f"… 本地无缓存，正在下载 {TARBALL_URL}", file=sys.stderr)
    import urllib.request
    urllib.request.urlretrieve(TARBALL_URL, CACHE)
    return CACHE


def load_char(tf: tarfile.TarFile, ch: str) -> dict | None:
    for name in (f"package/{ch}.json", f"package/{ch}.json".encode().decode("utf-8")):
        try:
            f = tf.extractfile(name)
            if f:
                return json.loads(f.read().decode("utf-8"))
        except KeyError:
            continue
    return None


def to_js(data: dict[str, dict], name: str = "GLYPHS") -> str:
    lines = [f"const {name} = {{"]
    for ch, d in data.items():
        strokes = json.dumps(d["s"], ensure_ascii=False, separators=(",", ":"))
        medians = json.dumps(d["m"], ensure_ascii=False, separators=(",", ":"))
        lines.append(f'  "{ch}": {{ s: {strokes}, m: {medians} }},')
    lines.append("};")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="导出汉字笔画矢量（供 3D 课件内联）")
    ap.add_argument("chars", help="汉字，可连写或空格分隔，如 明男尖尘 或 明 男 尖 尘")
    ap.add_argument("-o", "--out", help="输出文件（默认打印到标准输出）")
    ap.add_argument("--var", default="GLYPHS", help="输出的 JS 变量名，默认 GLYPHS")
    ap.add_argument("--stats", action="store_true", help="只打印统计信息")
    args = ap.parse_args()

    chars = [c for c in args.chars if not c.isspace()]
    seen, ordered = set(), []
    for c in chars:
        if c not in seen:
            seen.add(c)
            ordered.append(c)

    tp = ensure_cache()
    out: dict[str, dict] = {}
    missing = []
    with tarfile.open(tp, "r:gz") as tf:
        for ch in ordered:
            raw = load_char(tf, ch)
            if not raw:
                missing.append(ch)
                continue
            out[ch] = {"s": raw["strokes"], "m": raw["medians"]}

    if missing:
        print(f"× 数据里没有这些字：{''.join(missing)}", file=sys.stderr)
        if not out:
            return 1

    if args.stats:
        for ch, d in out.items():
            raw_len = sum(len(s) for s in d["s"])
            print(f"{ch}  笔画 {len(d['s']):>2}  路径 {raw_len:>5} 字符  "
                  f"JSON {len(json.dumps(d, ensure_ascii=False, separators=(',', ':'))) + len(ch) + 12} 字节")
        total = len(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
        print(f"合计 {len(out)} 字 · {total / 1024:.1f} KB")
        return 0

    js = to_js(out, args.var)
    if args.out:
        Path(args.out).write_text(js, encoding="utf-8")
        print(f"✓ 已写入 {args.out}（{len(js) / 1024:.1f} KB，{len(out)} 字）")
    else:
        print(js)
    return 0


if __name__ == "__main__":
    sys.exit(main())
