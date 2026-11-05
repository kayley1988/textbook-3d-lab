# -*- coding: utf-8 -*-
import os, sys, pymupdf

ROOT = r"D:\T\textbook-3d-lab"
book = None
for dp, _, fs in os.walk(os.path.join(ROOT, "books")):
    for f in fs:
        if f.endswith(".pdf") and "物理八年级下" in f:
            book = os.path.join(dp, f)
d = pymupdf.open(book)

# 内嵌图片原始分辨率
print("=== 内嵌图片原始像素 ===")
for i in [0, 10, 40, 60]:
    if i < d.page_count:
        info = d[i].get_images(full=True)
        for x in info[:2]:
            print(f"  p{i+1}: {x[2]}x{x[3]} px, ext={x[8] if len(x)>8 else '?'}")

# 生成缩略图联系表
start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
count = int(sys.argv[2]) if len(sys.argv) > 2 else 32
cols, tw = 8, 150
per = 2  # 每格并排两页
rows = (count + cols - 1) // cols
first = d[start]
th = int(tw * first.rect.height / first.rect.width)
url = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "_sheet.png")
out = pymupdf.open()
page = out.new_page(width=cols * tw, height=rows * (th + 14))
for k in range(count):
    i = start + k
    if i >= d.page_count:
        break
    r, c = divmod(k, cols)
    pix = d[i].get_pixmap(matrix=pymupdf.Matrix(tw / d[i].rect.width, tw / d[i].rect.width))
    rect = pymupdf.Rect(c * tw, r * (th + 14), c * tw + tw, r * (th + 14) + th)
    page.insert_image(rect, pixmap=pix)
    page.insert_text((c * tw + 3, r * (th + 14) + th + 11), f"p{i+1}", fontsize=9)
page.get_pixmap(matrix=pymupdf.Matrix(2, 2)).save(url)
print("联系表:", url, f"{cols*tw*2}x{rows*(th+14)*2}")
