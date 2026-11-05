#!/usr/bin/env python3
"""把 scene.js 打包成一个可双击运行的单文件 HTML 课件。

用法：
    python build.py scene.js -o 输出.html              # 默认从 CDN 取 three（约 1KB 附加，需联网）
    python build.py scene.js -o 输出.html --embed-three # 内联 three（约 1.8MB，完全离线）

scene.js 必须导出：
    export const meta = { title, tag, lead, concept, formula, points, controls, question, cam }
    export function create({ visual, scene, camera, controls, addLabel, setReadouts, meta })
"""
import argparse
import base64
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
RUNTIME = SKILL / "assets" / "runtime"
THREE_LOCAL = RUNTIME / "three.module.js"
TEMPLATE = RUNTIME / "template.html"
LAB = RUNTIME / "lab.js"

THREE_CDN = "https://unpkg.com/three@0.160.0/build/three.module.js"

# 三个.js 和场景文件里都可能有 import / export，合并进同一个 module 后要去掉重复声明
IMPORT_RE = re.compile(r"^\s*import\s+.*?;?\s*$", re.MULTILINE)
EXPORT_RE = re.compile(r"^\s*export\s+(?=(const|let|var|function|class|async)\b)", re.MULTILINE)


def strip_module_syntax(src: str) -> str:
    """去掉 import 语句与 export 关键字（合并进单一 module 作用域）。"""
    src = IMPORT_RE.sub("", src)
    src = EXPORT_RE.sub("", src)
    return src


def build(scene_path: Path, out_path: Path, embed_three: bool, three_path: Path | None):
    scene_src = scene_path.read_text(encoding="utf-8")
    lab_src = LAB.read_text(encoding="utf-8")
    tpl = TEMPLATE.read_text(encoding="utf-8")

    # ---- 基本校验 ----
    if "export const meta" not in scene_src and "const meta" not in scene_src:
        print("× scene.js 缺少 meta 定义", file=sys.stderr)
        return 1
    if "function create" not in scene_src:
        print("× scene.js 缺少 create() 函数", file=sys.stderr)
        return 1

    # ---- importmap ----
    if embed_three:
        tp = three_path or THREE_LOCAL
        if not tp.exists():
            print(f"× 找不到 three.module.js：{tp}", file=sys.stderr)
            return 1
        b64 = base64.b64encode(tp.read_bytes()).decode()
        importmap = json.dumps(
            {"imports": {"three": "data:text/javascript;base64," + b64}},
            ensure_ascii=False)
        size_note = "内联 three（离线可用）"
    else:
        importmap = json.dumps({"imports": {"three": THREE_CDN}}, ensure_ascii=False)
        size_note = "CDN 加载 three（需联网）"

    # ---- 合并脚本（统一一句 import，其余 import 去掉） ----
    body = strip_module_syntax(lab_src) + "\n\n" + strip_module_syntax(scene_src)

    # 抽出标题用于 <title>
    m = re.search(r"title\s*:\s*['\"`](.+?)['\"`]", scene_src)
    title = m.group(1) if m else scene_path.stem

    html = (tpl
            .replace("{{TITLE}}", title)
            .replace("{{IMPORTMAP_JSON}}", importmap)
            .replace("{{LAB}}", body))

    # {{SCENE}} 占位符已在 body 里合并，清空它避免残留
    html = html.replace("{{SCENE}}", "")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")

    kb = out_path.stat().st_size / 1024
    print(f"✓ 已生成 {out_path}")
    print(f"  {kb:.0f} KB · {size_note}")
    return 0


def main():
    ap = argparse.ArgumentParser(description="打包 3D 课件为单文件 HTML")
    ap.add_argument("scene", help="场景文件 scene.js")
    ap.add_argument("-o", "--out", help="输出 HTML 路径")
    ap.add_argument("--embed-three", action="store_true", help="内联 three.js，完全离线")
    ap.add_argument("--three", help="指定 three.module.js 路径")
    args = ap.parse_args()

    scene_path = Path(args.scene).resolve()
    if not scene_path.exists():
        print(f"× 找不到场景文件：{scene_path}", file=sys.stderr)
        return 1
    out = Path(args.out) if args.out else scene_path.with_suffix(".html")
    return build(scene_path, out, args.embed_three,
                 Path(args.three).resolve() if args.three else None)


if __name__ == "__main__":
    sys.exit(main())
