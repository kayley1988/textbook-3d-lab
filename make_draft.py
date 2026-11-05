# -*- coding: utf-8 -*-
"""从 OCR 索引自动生成 3D 锚点草稿（bindings 草案）
只挑"值得做 3D"的页：
  - 有★标记（演示/实验/做一做…）的页
  - 节首页（第 X 节），作为该节默认展示页
输出 Markdown 草稿表，供人工/AI 复核后并入 bindings.js
"""
import json, sys, re, os

SEC = re.compile(r"第\s*([一二三四五六七八九十\d]+)\s*节")
CH = re.compile(r"第\s*([一二三四五六七八九十\d]+)\s*章\s*([^\s：:]{2,12})")

def cn2int(s):
    d = dict(zip("一二三四五六七八九十", range(1, 11)))
    if s.isdigit():
        return int(s)
    if len(s) == 1:
        return d.get(s, 0)
    if len(s) == 2 and s[0] == "十":
        return 10 + d.get(s[1], 0)
    if len(s) == 2 and s[1] == "十":
        return d.get(s[0], 1) * 10
    if len(s) == 3 and s[1] == "十":
        return d.get(s[0], 1) * 10 + d.get(s[2], 0)
    return 0

def main(index_path, out_md):
    idx = json.load(open(index_path, encoding="utf-8"))
    rows = []
    for p, info in sorted(idx["pages"].items(), key=lambda x: int(x[0])):
        n = int(p)
        marks = info["marks"]
        for s in info["sections"]:
            m = SEC.search(s)
            if m:
                rows.append((n, f"第{m.group(1)}节 首页", "节首", marks))
                break
        if marks:
            # 找出具体命中词
            hits = [w for w in marks if w in " ".join(info["lines"])]
            rows.append((n, "、".join(hits[:3]), "实验/演示", marks))
    # 去重合并（同页只留一行，节首优先）
    merged = {}
    for n, desc, kind, marks in rows:
        if n not in merged or kind == "节首":
            merged[n] = (n, desc, kind, marks)
    lines = [
        f"# 锚点草稿：{os.path.basename(index_path)}",
        "",
        "| PDF右页 | 对开 | 内容 | 类型 | 建议锚点(u,v) |",
        "|---|---|---|---|---|",
    ]
    for n, desc, kind, marks in sorted(merged.values()):
        lines.append(f"| {n} | {n-1}–{n} | {desc} | {kind} | 待定 |")
    open(out_md, "w", encoding="utf-8").write("\n".join(lines))
    print(f"草案 {len(merged)} 条 → {out_md}")
    print("\n".join(lines[4:20]))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
