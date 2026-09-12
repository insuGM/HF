# -*- coding: utf-8 -*-
"""
mobile_guide.html 에 패턴 카드를 추가한다.

  python worklist/_guide/build.py          (MB 루트에서 실행)

patterns_add.json 한 곳만 고치면 카드의 3요소
  (1) data-search 검색 인덱스  (2) 라이브 데모  (3) 코드블록
가 전부 같은 마크업에서 생성된다. 손으로 3벌 쓰지 않는다.

이미 들어간 카드는 <!-- pg-auto:KEY --> 주석으로 표시해 두고 다시 넣지 않는다.
"""
import io
import json
import os
import re
import glob
import collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GUIDE = os.path.join(ROOT, "worklist", "mobile_guide.html")
DATA = os.path.join(ROOT, "worklist", "_guide", "patterns_add.json")

MARK = "<!-- pg-auto:%s -->"
# 데모에서 id/for/name 을 카드별로 바꿔 페이지 안 중복을 막는다.
IDATTR = re.compile(r'\b(id|for|name|aria-controls|aria-labelledby)="([^"]+)"')


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def uniquify(html, suffix):
    """데모용: id/for/name 계열 값에 카드 접미사를 붙인다."""
    def rep(m):
        attr, val = m.group(1), m.group(2)
        if val.startswith("#"):
            return m.group(0)
        return '%s="%s_%s"' % (attr, val, suffix)
    return IDATTR.sub(rep, html)


def usage_counts(keys):
    """각 클래스가 등장하는 html 파일 수."""
    cnt = collections.Counter()
    for p in glob.glob(os.path.join(ROOT, "html", "**", "*.html"), recursive=True):
        s = io.open(p, encoding="utf-8", errors="replace").read()
        present = set(x for m in re.finditer(r'class="([^"]+)"', s)
                      for x in m.group(1).split())
        for k in keys:
            if k in present:
                cnt[k] += 1
    return cnt


def card(no, it, use):
    cid = "pg%03d" % no
    demo = uniquify(it["html"], cid)
    code = esc(it["html"])
    search = esc(" ".join([it["name"], it["key"], it["cat"], it["note"]]) + " " + it["html"])
    note = it["note"] + "  예시 출처: " + it["file"]
    return (
        '    %s\n'
        '    <section class="pg-card" id="%s" data-cat="%s" data-name="%s" data-search="%s">\n'
        '        <header><span class="pg-no">%03d</span><h3>%s</h3>'
        '<code class="pg-key">%s</code><span class="pg-use">사용 %d개 파일</span></header>\n'
        '        <p class="pg-note">%s</p>\n'
        '        <div class="pg-split">\n'
        '            <div class="pg-demo"><div class="wrapper sub"><div class="pg-demo-inner">\n'
        '%s\n'
        '</div></div></div>\n'
        '            <pre class="pg-code">%s</pre>\n'
        '        </div>\n'
        '    </section>\n'
    ) % (MARK % it["key"], cid, esc(it["cat"]), esc(it["name"]), search,
         no, esc(it["name"]), esc(it["key"]), use, esc(note), demo, code)


def main():
    items = json.loads(io.open(DATA, encoding="utf-8").read())
    src = io.open(GUIDE, encoding="utf-8", newline="").read()

    todo = [it for it in items if (MARK % it["key"]) not in src]
    if not todo:
        print("추가할 패턴 없음 (모두 반영됨)")
        return

    print("사용 빈도 집계 중...")
    cnt = usage_counts([it["key"] for it in todo])

    nos = [int(m.group(1)) for m in re.finditer(r'id="pg(\d+)"', src)]
    start = max(nos) + 1 if nos else 1

    blocks = []
    for i, it in enumerate(todo):
        blocks.append(card(start + i, it, cnt.get(it["key"], 0)))

    anchor = "    </main>"
    assert src.count(anchor) == 1, "삽입 위치(</main>)를 특정할 수 없음"
    out = src.replace(anchor, "".join(blocks) + anchor)
    io.open(GUIDE, "w", encoding="utf-8", newline="").write(out)
    print("추가 %d개 (pg%03d ~ pg%03d)" % (len(todo), start, start + len(todo) - 1))


if __name__ == "__main__":
    main()
