#!/usr/bin/env python3
"""从教材 PDF 渲染某一页为高清 PNG，供 3D 课件当底图。

用法：
    python pdf_page.py <pdf> <页码> -o out.png [--width 1600] [--dpi 150]
    python pdf_page.py <pdf> --info          # 打印总页数
    python pdf_page.py <pdf> 12 14 15 -o p12.png  # 多页（文件名用 p{n}.png）

依赖 PyMuPDF（fitz），运行方式：
    PYTHONPATH="<envs/default/Lib/site-packages>" python pdf_page.py ...
"""
import sys
import argparse
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    try:
        import pymupdf as fitz
    except ImportError:
        print("× 需要 PyMuPDF，请设置 PYTHONPATH 指向 envs/default/Lib/site-packages", file=sys.stderr)
        sys.exit(1)


def render_page(doc, page_no: int, out_path: Path, width: int = 1600, dpi: float = 150) -> None:
    """page_no 是 1 起始的页码。"""
    if page_no < 1 or page_no > doc.page_count:
        raise ValueError(f"页码 {page_no} 超出范围 1..{doc.page_count}")
    page = doc.load_page(page_no - 1)
    # 按 dpi 渲染（高清），再按宽度裁剪
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    # 若宽度过大则等比缩小到 width
    if width and pix.width > width:
        scale = width / pix.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom * scale, zoom * scale), alpha=False)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(out_path))
    print(f"✓ {out_path}  {pix.width}x{pix.height}px  (原页 {page.rect.width:.0f}x{page.rect.height:.0f}pt)")


def main():
    ap = argparse.ArgumentParser(description="渲染教材 PDF 页为 PNG 底图")
    ap.add_argument("pdf", help="PDF 路径")
    ap.add_argument("pages", nargs="*", type=int, help="页码（1 起始）")
    ap.add_argument("-o", "--out", help="输出文件（单页时用；多页自动 p{n}.png）")
    ap.add_argument("--width", type=int, default=1600, help="输出宽度 px，默认 1600")
    ap.add_argument("--dpi", type=float, default=150, help="渲染 dpi，默认 150")
    ap.add_argument("--info", action="store_true", help="只打印页数")
    args = ap.parse_args()

    pdf = Path(args.pdf).resolve()
    if not pdf.exists():
        print(f"× 找不到 PDF：{pdf}", file=sys.stderr)
        return 1

    with fitz.open(str(pdf)) as doc:
        if args.info:
            print(f"总页数：{doc.page_count}")
            # 前几页标题
            for i in range(min(3, doc.page_count)):
                t = doc.load_page(i).get_text().strip().split("\n")[:2]
                print(f"  P{i+1}: {t}")
            return 0
        if not args.pages:
            print("× 请指定页码，或加 --info", file=sys.stderr)
            return 1
        for p in args.pages:
            out = Path(args.out) if args.out and len(args.pages) == 1 else Path(f"p{p}.png")
            render_page(doc, p, out, args.width, args.dpi)
    return 0


if __name__ == "__main__":
    sys.exit(main())
