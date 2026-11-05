# -*- coding: utf-8 -*-
"""OCR 定位教材实验/演示页：pdf 每页 → RapidOCR → 关键词索引"""
import os, sys, json, re, time, glob
import pymupdf
from rapidocr_onnxruntime import RapidOCR

ROOT = r"D:\T\textbook-3d-lab"
ocr = RapidOCR()

# 标记词：出现即说明该页有"可复活为 3D 的演示/实验"
MARKS = ["演示", "实验", "做一做", "想想做做", "想想议议", "科学世界", "STS", "小资料"]
# 节标题模式：定位章节结构
SEC = re.compile(r"第\s*([一二三四五六七八九十\d]+)\s*章|第\s*([一二三四五六七八九十\d]+)\s*节")

def ocr_page(page, zoom=2.0):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
    img = pix.tobytes("png")
    result, _ = ocr(img)
    if not result:
        return [], []
    lines = [(r[1], r[0]) for r in result]          # (text, box)
    return lines, [b for _, b in lines]

def main(pdf_path, out_json, pages=None, zoom=2.0):
    d = pymupdf.open(pdf_path)
    idx = {"pdf": pdf_path, "pages": {}}
    todo = pages if pages else range(d.page_count)
    t0 = time.time()
    for i in todo:
        lines, boxes = ocr_page(d[i], zoom)
        text = " ".join(t for t, _ in lines)
        marks = [m for m in MARKS if m in text]
        secs = [t for t, _ in lines if SEC.search(t)]
        idx["pages"][str(i + 1)] = {
            "chars": len(text),
            "marks": marks,
            "sections": secs[:3],
            "lines": [t for t, _ in lines][:200],
        }
        tag = ("★" + ",".join(marks) if marks else "") + (" | " + ";".join(secs[:2]) if secs else "")
        print(f"p{i+1:>3} {len(text):>5}字 {tag}", flush=True)
    idx["elapsed"] = round(time.time() - t0, 1)
    json.dump(idx, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n索引已写 {out_json}  耗时 {idx['elapsed']}s")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "sample"
    pdfs = glob.glob(os.path.join(ROOT, "books", "**", "*.pdf"), recursive=True)
    book = next(p for p in pdfs if "物理八年级下" in p)
    out = os.path.join(ROOT, "ocr_index", os.path.basename(book).replace(".pdf", ".index.json"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if mode == "sample":
        main(book, out, pages=[62, 63, 70, 71, 72, 73, 74, 75, 76, 77], zoom=2.0)
    else:
        main(book, out, pages=None, zoom=2.0)
