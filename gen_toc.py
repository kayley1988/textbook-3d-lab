# -*- coding: utf-8 -*-
"""从 OCR 索引生成教材目录 toc.json（章/节 → PDF 页码）
规则：跳过前置页（封面/目录）；章号或节号发生变化才新建条目（页眉重复出现不算）
"""
import json, sys, re

CN = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10}
def cn2int(s):
    s = s.strip()
    if s.isdigit(): return int(s)
    if len(s) == 1: return CN.get(s, 0)
    if s == '十': return 10
    if s.startswith('十'): return 10 + CN.get(s[1], 0)
    if '十' in s:
        a, b = s.split('十')
        return CN.get(a, 1) * 10 + (CN.get(b, 0) if b else 0)
    return CN.get(s, 0)

CH = re.compile(r'第\s*([一二三四五六七八九十\d]+)\s*章\s*(.*)$')
SEC = re.compile(r'第\s*([一二三四五六七八九十\d]+)\s*节\s*(.*)$')
SKIP_FIRST = 6   # 封面/版权/目录

def clean(s):
    s = re.sub(r'[：:]\s*\d+\s*$', '', s)
    s = re.sub(r'\s*\d+\s*$', '', s)
    return s.strip()

def main(index_path, out_path):
    idx = json.load(open(index_path, encoding='utf-8'))
    pages = sorted(idx['pages'].items(), key=lambda x: int(x[0]))
    toc = []
    cur_ch, cur_ch_no, cur_sec_no = None, 0, 0
    for p, info in pages:
        n = int(p)
        if n <= SKIP_FIRST:
            continue
        lines = info['lines']
        for i, line in enumerate(lines):
            m = CH.search(line)
            if not m: continue
            no = cn2int(m.group(1))
            rest = clean(m.group(2))
            if not rest and i + 1 < len(lines):   # OCR 把标题拆到下一行
                rest = clean(lines[i + 1])
            if no and no != cur_ch_no:
                cur_ch_no, cur_sec_no = no, 0
                cur_ch = {'label': f'第{no}章　{rest}', 'page': n, 'children': []}
                toc.append(cur_ch)
                break
        for i, line in enumerate(lines):
            m = SEC.search(line)
            if not m: continue
            no = cn2int(m.group(1))
            rest = clean(m.group(2))
            if not rest and i + 1 < len(lines):   # OCR 把标题拆到下一行
                rest = clean(lines[i + 1])
            if no and no != cur_sec_no and cur_ch is not None:
                cur_sec_no = no
                cur_ch['children'].append({'label': f'{no} 节　{rest}', 'page': n})
                break
    # 补漏：某章第一节缺失（OCR 漏识别）→ 在章起始页补上
    for ch in toc:
        if ch['children'] and not ch['children'][0]['label'].startswith('1 节'):
            ch['children'].insert(0, {'label': '1 节', 'page': ch['page']})
    json.dump(toc, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for ch in toc:
        print(f"{ch['page']:>3}  {ch['label']}")
        for c in ch['children']:
            print(f"   {c['page']:>3}    {c['label']}")

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
