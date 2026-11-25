#!/usr/bin/env python3
"""生成带学科知识图谱映射的课件目录页。

用法：python gen_catalog.py course-map.json -o 语文一上-目录.html
"""
import argparse, json
from pathlib import Path

GRAPH_EXPLORE = "https://math.pansgo.com/explore/?topic="

def esc(s): return str(s or "")

def strength_label(st):
    return {"hard": "硬先修", "soft": "软先修"}.get(st, "")

def card(c):
    prereq_html = ""
    if c.get("prereq"):
        st = c.get("prereqStrength")
        tag = f'<span class="ptag {st}">{strength_label(st)}</span>' if st else ""
        prereq_html = f"""<div class="kg-row"><span class="kg-k">先修</span>{tag}<span class="kg-v">{esc(c['prereq'])}</span></div>"""
    else:
        prereq_html = """<div class="kg-row"><span class="kg-k">先修</span><span class="kg-v none">无（起点）</span></div>"""

    mastery = c.get("mastery") or []
    mastery_html = ""
    if mastery:
        items = "".join(f"<li>{esc(m)}</li>" for m in mastery)
        mastery_html = f'<div class="kg-row"><span class="kg-k">掌握</span><ul class="kg-m">{items}</ul></div>'

    tid = esc(c.get("topicId",""))
    explore = f'{GRAPH_EXPLORE}{tid}' if tid else "#"

    return f"""    <a class="card" href="{esc(c['file'])}" target="_blank">
      <div class="c-top">
        <span class="c-tag">{esc(c['unit'])}</span>
        <span class="c-id" title="学科知识图谱知识点 ID">{tid}</span>
      </div>
      <h2>{esc(c['title'])}</h2>
      <p>{esc(c['desc'])}</p>
      <div class="kg">
        <div class="kg-h">知识图谱</div>
        <div class="kg-row"><span class="kg-k">单元</span><span class="kg-v">{esc(c['chapter'])}</span></div>
        {prereq_html}
        {mastery_html}
        <a class="kg-link" href="{explore}" target="_blank" onclick="event.stopPropagation()">在图谱中查看 →</a>
      </div>
      <div class="c-go"><span class="badge"><span class="dot"></span>可交互</span><span class="go">打开课件 →</span></div>
    </a>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("map", help="course-map.json")
    ap.add_argument("-o", "--out", required=True)
    args = ap.parse_args()
    courses = json.loads(Path(args.map).read_text(encoding="utf-8"))

    cards = "\n".join(card(c) for c in courses)
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>一年级上册语文 · 3D 课件书架</title>
<style>
:root{{
  --paper:#f6f1e7;--ink:#2b2a26;--ink-2:#6b6558;--line:#e4dccb;
  --accent:#c2401e;--accent-soft:#fbeadb;--blue:#2f6fdb;
  --kg:#2fa36b;--radius:16px;font-size:16px;
}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:"PingFang SC","Microsoft YaHei","Segoe UI",system-ui,sans-serif;color:var(--ink);
  background:radial-gradient(1100px 600px at 82% -10%,#fdf9f0 0%,transparent 60%),linear-gradient(180deg,#f8f4ea 0%,#f1ead9 100%);
  min-height:100vh;padding:48px 24px 72px}}
.wrap{{max-width:1080px;margin:0 auto}}
.tag{{display:inline-block;font:600 11px/1 inherit;letter-spacing:.16em;color:var(--accent);background:var(--accent-soft);
  padding:6px 12px;border-radius:6px;margin-bottom:14px;text-transform:uppercase}}
h1{{font:700 30px/1.3 Georgia,"Songti SC",serif;margin-bottom:8px}}
.lead{{font-size:14.5px;line-height:1.8;color:var(--ink-2);max-width:680px;margin-bottom:14px}}
.lead2{{font-size:13px;line-height:1.7;color:var(--ink-2);max-width:680px;margin-bottom:30px;
  background:#f3edde;padding:12px 16px;border-radius:10px;border-left:3px solid var(--kg)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:18px}}
.card{{background:rgba(255,253,248,.96);border:1px solid var(--line);border-radius:var(--radius);
  padding:20px;display:flex;flex-direction:column;gap:9px;transition:all .2s;cursor:pointer;
  text-decoration:none;color:inherit;box-shadow:0 1px 2px rgba(60,50,30,.04)}}
.card:hover{{transform:translateY(-3px);box-shadow:0 10px 26px rgba(60,50,30,.12);border-color:#d5cab2}}
.c-top{{display:flex;justify-content:space-between;align-items:center}}
.c-tag{{font:600 10.5px/1 inherit;letter-spacing:.14em;color:var(--accent);text-transform:uppercase}}
.c-id{{font:600 10.5px/1 ui-monospace,Consolas,monospace;color:#8a8272;background:#f0eadb;
  padding:4px 7px;border-radius:5px;letter-spacing:.02em}}
h2{{font:700 19px/1.35 Georgia,"Songti SC",serif}}
.card p{{font-size:13px;line-height:1.7;color:var(--ink-2)}}
.kg{{background:#f5f8f3;border:1px solid #dfe8da;border-radius:10px;padding:12px 13px;margin-top:4px}}
.kg-h{{font:600 10px/1 inherit;letter-spacing:.14em;color:var(--kg);text-transform:uppercase;margin-bottom:8px;
  display:flex;align-items:center;gap:6px}}
.kg-h:before{{content:"";width:7px;height:7px;border-radius:50%;background:var(--kg);display:inline-block}}
.kg-row{{display:flex;gap:8px;font-size:12px;line-height:1.55;margin-bottom:5px;align-items:baseline}}
.kg-k{{flex:0 0 32px;font:600 11px/1.55 inherit;color:var(--ink-2)}}
.kg-v{{color:var(--ink);flex:1}}
.kg-v.none{{color:#a39a88}}
.kg-m{{list-style:none;flex:1}}
.kg-m li{{color:var(--ink-2);padding-left:12px;position:relative;margin-bottom:2px}}
.kg-m li:before{{content:"";position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:#b7ae98}}
.ptag{{font:600 10px/1 inherit;padding:3px 6px;border-radius:4px;margin-right:4px;flex:0 0 auto}}
.ptag.hard{{color:#c2401e;background:#fbeadb}}
.ptag.soft{{color:#2f6fdb;background:#e6f1fb}}
.kg-link{{display:inline-block;font:600 11.5px/1 inherit;color:var(--kg);margin-top:6px;text-decoration:none}}
.kg-link:hover{{text-decoration:underline}}
.c-go{{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:6px}}
.badge{{display:inline-flex;align-items:center;gap:6px;font:600 11px/1 inherit;color:var(--ink-2);
  background:#f3edde;padding:4px 9px;border-radius:20px}}
.badge .dot{{width:6px;height:6px;border-radius:50%;background:#2fa36b}}
.go{{font:600 13px/1 inherit;color:var(--blue)}}
.foot{{margin-top:34px;font-size:12.5px;color:var(--ink-2);line-height:1.8}}
.foot a{{color:var(--kg)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="tag">语文 · 一年级上册 · 3D 互动课件</div>
  <h1>课文里的秘密，立起来看</h1>
  <p class="lead">点开任意一课，3D 场景就悬在书页上方。会意字可以拆开再合上，象形字能看到「图画变文字」，乌鸦喝水可以投石子看水位涨，雪地里能看四种脚印，月牙小船可以调整弯度——这些都是纸上看不见的过程。</p>
  <div class="lead2">每张卡片底部附<b>学科知识图谱</b>信息：本课对应的知识点、单元位置、先修关系（学它之前先会什么）、掌握标准，并可一键跳到在线图谱查看它在整个知识网里的位置。数据来自开源项目 <b>cn-math-taxonomy</b>（AI 初稿，未经教师审核，仅供学习参考）。</div>

  <div class="grid">
{cards}
  </div>

  <div class="foot">
    课件为单文件离线运行（Three.js 已内联，无需联网），由 textbook-3d-lab Skill 生成 · 知识点驱动、不复制教材原文/插图，兼容各版本教材。<br>
    知识图谱映射数据来自开源项目 <a href="https://github.com/xiaoyang111222/cn-math-taxonomy" target="_blank">cn-math-taxonomy</a>（CC BY-NC 4.0）· 覆盖数学（小学到高中）、英语、初中物理，共 1644 知识点 / 2403 先修边 / 6723 题。
  </div>
</div>
</body>
</html>"""
    Path(args.out).write_text(html, encoding="utf-8")
    print(f"✓ 已生成 {args.out}（{len(courses)} 门课）")

if __name__ == "__main__":
    main()
