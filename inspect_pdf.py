# -*- coding: utf-8 -*-
import sys, os, pymupdf

ROOT = r"D:\T\textbook-3d-lab"
book = sys.argv[1] if len(sys.argv) > 1 else None
if not book:
    for dp, _, fs in os.walk(os.path.join(ROOT, "books")):
        for f in fs:
            if f.endswith(".pdf") and "物理八年级下" in f:
                book = os.path.join(dp, f)
print("文件:", book)
d = pymupdf.open(book)
print("页数:", d.page_count, "| 尺寸(pt):", [round(v) for v in d[0].rect[2:]])
chars = [len(d[i].get_text().strip()) for i in range(min(12, d.page_count))]
print("前12页字符数:", chars)
print("前12页图片数:", [len(d[i].get_images()) for i in range(min(12, d.page_count))])
print()
kws = ["第十一章", "功和机械能", "功", "功率", "动能和势能", "机械能及其转化", "动能", "重力势能"]
hits = []
for i in range(d.page_count):
    t = d[i].get_text().replace("\n", "")
    for kw in kws:
        if kw in t:
            hits.append((i + 1, kw, t[:60]))
            break
for h in hits[:25]:
    print(f"  p{h[0]} [{h[1]}] {h[2]}")
