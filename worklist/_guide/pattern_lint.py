# -*- coding: utf-8 -*-
"""
HF MB 퍼블리싱 린트 — 마크업 안티패턴과 디자인시스템 이탈을 검출한다.

  python worklist/_guide/pattern_lint.py                 (MB 루트에서 실행)
  python worklist/_guide/pattern_lint.py --rule R01,R05
  python worklist/_guide/pattern_lint.py --severity error
  python worklist/_guide/pattern_lint.py --path "html/ai_service/*.html"
  python worklist/_guide/pattern_lint.py --baseline-write   (현재 클래스를 기준선으로 저장)

퍼블 산출물은 한 화면이 상태별 파일로 여러 벌 복제돼 있어서, 원인 하나가 수십 건으로
불어난다. 그래서 이 린트는 건수가 아니라 **원인(시그니처)** 단위로 묶어 보고한다.
"우선 조치" 표의 위에서부터 고치면 가장 많은 파일이 한 번에 해결된다.

산출물
  worklist/_guide/lint_report.html   사람이 보는 리포트
  worklist/_guide/lint_report.txt    같은 내용 텍스트
  --json <path>                      기계 판독용

콘솔에는 ASCII 요약만 찍는다 (한글은 cp949 콘솔에서 깨진다).
종료코드: error 가 1건이라도 있으면 1 (CI 게이트용).
"""
import argparse
import collections
import glob
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
BASELINE = os.path.join(HERE, "lint_baseline.json")

VOID = set("area base br col embed hr img input link meta param source track wbr".split())
TAG = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>")
# type11, col2, m0 처럼 번호만 다른 모디파이어는 커버리지 집계에서 뺀다
MODIFIER = re.compile(r"^(type|col|m|p|step|w|gap)\d+$")
DIGITS = re.compile(r"\d+")

RULES = {
    "R01": ("error", "label 안에 div",
            "label 의 콘텐츠 모델은 phrasing content 다. div 를 span + display:block 으로 바꾼다."),
    "R02": ("error", "짝 없는 label[for]",
            "for 가 가리키는 id 가 문서에 없다. 라벨을 눌러도 컨트롤이 반응하지 않는다."),
    "R03": ("error", "라벨 없는 체크/라디오",
            "id 가 없거나 대응 label[for] 이 없다. 스크린리더가 무엇을 선택하는지 읽지 못한다."),
    "R04": ("error", "중복 id",
            "같은 id 가 2개 이상이다. label-input 연결과 aria 참조가 첫 번째에만 붙는다."),
    "R05": ("error", "없는 js/css 참조",
            "참조한 파일이 실제로 없다. '동작 안 함' 피드백의 대표 원인이다."),
    "R06": ("error", "태그 불균형",
            "여는 태그와 닫는 태그가 맞지 않는다. 레이아웃이 통째로 깨진다."),
    "R07": ("error", "가짜 선택 카드",
            "선택처럼 보이는 카드에 input 이 없다. 값이 전송되지 않고 키보드로 조작할 수 없다."),
    "R08": ("warn", "빈 label[for]",
            'for="" 는 아무 컨트롤도 가리키지 않는다. 대상 id 를 넣거나 for 를 지운다.'),
    "R09": ("warn", "div/span 에 type=button",
            "div 에는 type 속성이 없다. 오타이거나, 버튼이어야 할 것이 div 로 되어 있다."),
    "R10": ("warn", "팝업 type2~5 충돌",
            "footer.html 이 com_pop_wrap type2~5 를 선점한다. 새 팝업은 type11 부터 쓴다."),
    "R11": ("warn", "닫기 수단 없는 팝업",
            ".close / .end / [data-close-pop] 이 하나도 없어 사용자가 팝업을 닫을 수 없다."),
    "R12": ("warn", "display:none 으로 숨긴 폼 컨트롤",
            "키보드 이동과 보이스오버 포커스가 죽는다. opacity:0 으로 숨긴다."),
    "R13": ("warn", "close 인라인 onclick",
            "팝업 닫기는 include.js 위임 엔진이 처리한다. 개별 바인딩을 두지 않는다."),
    "R16": ("error", "이름 없는 label",
            "label 이 있지만 안이 비어 있어 스크린리더가 읽을 게 없다. "
            '아이콘형 컨트롤은 <label><span class="sr-only">무엇 선택</span></label> 로 이름을 준다.'),
    "R15": ("error", "끊긴 aria 참조",
            "aria-controls / aria-labelledby / aria-describedby 가 가리키는 id 가 없다. "
            "아코디언·탭이 열리지 않거나 스크린리더가 이름을 못 읽는다."),
    "R14": ("warn", "보정 안 되는 고정 버튼",
            ".btn_cont.page.fixed.direction 은 부모가 .container_in 이 아니라 전역 하단 여백 규칙이 걸리지 않는다."),
}


def strip_noise(s):
    """주석과 인라인 스크립트/스타일 '내용'만 지운다.
    태그 자체는 남겨야 한다 — 통째로 지우면 <script src> 참조 검사(R05)가
    스크립트를 전부 놓친다."""
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"(<script\b[^>]*>).*?(</script>)", r"\1\2", s, flags=re.S | re.I)
    s = re.sub(r"(<style\b[^>]*>).*?(</style>)", r"\1\2", s, flags=re.S | re.I)
    return s


def line_of(s, pos):
    return s.count("\n", 0, pos) + 1


def close_index(s, start):
    """start 위치 태그의 닫는 태그 끝 인덱스. 깊이 카운터로 센다."""
    m = TAG.match(s, start)
    if not m:
        return None
    tag = m.group(2).lower()
    if tag in VOID or m.group(3):
        return m.end()
    d, pos = 0, start
    while True:
        mm = TAG.search(s, pos)
        if not mm:
            return None
        t = mm.group(2).lower()
        if t == tag and t not in VOID and not mm.group(3):
            d += 1 if not mm.group(1) else -1
            if d == 0:
                return mm.end()
        pos = mm.end()


def label_bodies(s):
    """label 요소의 (내부 HTML, 시작 위치) 목록."""
    out = []
    for m in re.finditer(r"<label\b[^>]*>", s):
        end = close_index(s, m.start())
        if end is None:
            continue
        inner = s[m.end():end]
        inner = inner[:inner.rfind("</label>")] if "</label>" in inner else inner
        out.append((inner, m.start()))
    return out


_asset_cache = {}


def asset_missing(url, htmlpath):
    """절대(/resources/...) · 상대(../../resources/...) 참조 모두 실재를 확인한다."""
    clean = url.split("?")[0].split("#")[0]
    if clean.startswith("//") or "://" in clean:
        return False                      # 외부 호스트는 판단하지 않는다
    if clean.startswith("/"):
        p = os.path.join(ROOT, clean.lstrip("/").replace("/", os.sep))
    else:
        p = os.path.normpath(os.path.join(os.path.dirname(htmlpath),
                                          clean.replace("/", os.sep)))
    if p not in _asset_cache:
        _asset_cache[p] = not os.path.isfile(p)
    return _asset_cache[p]


_inc_ids = {}


def include_ids(abspath, raw):
    """data-include 로 붙는 조각(header/footer 등)이 제공하는 id 집합.

    조각은 런타임에 같은 문서로 합쳐지므로, 페이지가 참조하는 id 가 조각에 있으면
    끊긴 참조가 아니다. 조각끼리도 항상 같이 실리므로 inc 폴더는 서로를 본다."""
    targets = set()
    for m in re.finditer(r'data-include="([^"]+)"', raw):
        targets.add(os.path.normpath(os.path.join(os.path.dirname(abspath),
                                                  m.group(1).replace("/", os.sep))))
    if os.path.basename(os.path.dirname(abspath)) == "inc":
        targets.update(glob.glob(os.path.join(os.path.dirname(abspath), "*.html")))

    out = set()
    for t in targets:
        if t == abspath:
            continue
        if t not in _inc_ids:
            try:
                txt = io.open(t, encoding="utf-8", errors="replace").read()
                txt = re.sub(r"<!--.*?-->", "", txt, flags=re.S)
                _inc_ids[t] = set(re.findall(r'\sid="([^"]+)"', txt))
            except OSError:
                _inc_ids[t] = set()
        out |= _inc_ids[t]
    return out


def check(raw, abspath):
    """한 파일 검사 → (rule, line, detail, sig) 목록.
    sig 는 '같은 원인'을 묶는 키다. 숫자만 다른 것은 같은 원인으로 본다."""
    s = strip_noise(raw)
    f = []

    # R01 label 안 div  /  R16 이름 없는 label
    for body, pos in label_bodies(s):
        m = re.search(r"<div\b[^>]*>", body)
        if m:
            f.append(("R01", line_of(s, pos),
                      re.sub(r"\s+", " ", body).strip()[:90],
                      DIGITS.sub("N", m.group(0))))
        # sr-only 안 글자도 이름으로 친다. img(alt) 가 들어 있으면 판단하지 않는다.
        text = re.sub(r"&[a-zA-Z]+;|&#\d+;", " ", re.sub(r"<[^>]+>", "", body)).strip()
        if not text and "<img" not in body:
            fm = re.search(r'\sfor="([^"]*)"', s[pos:s.find(">", pos) + 1])
            tgt = fm.group(1) if fm else "(for없음)"
            f.append(("R16", line_of(s, pos), "for=%s" % tgt,
                      "for=%s" % DIGITS.sub("N", tgt)))

    ids = re.findall(r'\sid="([^"]+)"', s)
    # 참조 확인용 집합에는 data-include 로 합쳐질 조각의 id 도 넣는다.
    # (중복 검사 R04 는 이 파일 자체의 ids 만 본다)
    idset = set(ids) | include_ids(abspath, raw)

    # R02 짝 없는 label[for] / R08 빈 for
    for m in re.finditer(r'<label\b[^>]*\sfor="([^"]*)"', s):
        v = m.group(1)
        if v == "":
            f.append(("R08", line_of(s, m.start()), 'for=""', 'for=""'))
        elif v not in idset:
            f.append(("R02", line_of(s, m.start()), v, DIGITS.sub("N", v)))

    # R03 라벨 없는 체크/라디오
    for m in re.finditer(r"<input\b[^>]*>", s):
        if not re.search(r'type="(checkbox|radio)"', m.group(0)):
            continue
        tid = re.search(r'\sid="([^"]+)"', m.group(0))
        if not tid:
            f.append(("R03", line_of(s, m.start()), "id 없음: " + m.group(0)[:60], "id 없음"))
        elif ('for="%s"' % tid.group(1)) not in s:
            f.append(("R03", line_of(s, m.start()), tid.group(1), DIGITS.sub("N", tid.group(1))))

    # R15 끊긴 aria 참조 (여러 id 를 공백으로 나열할 수 있으므로 토큰 단위로 본다)
    for attr in ("aria-controls", "aria-labelledby", "aria-describedby"):
        for m in re.finditer(r'\s%s="([^"]+)"' % attr, s):
            for t in m.group(1).split():
                if t not in idset:
                    f.append(("R15", line_of(s, m.start()), "%s=%s" % (attr, t),
                              "%s=%s" % (attr, DIGITS.sub("N", t))))

    # R04 중복 id
    for i, c in collections.Counter(ids).items():
        if c > 1:
            m = re.search(r'\sid="%s"' % re.escape(i), s)
            f.append(("R04", line_of(s, m.start()) if m else 0,
                      "%s (%d회)" % (i, c), DIGITS.sub("N", i)))

    # R05 없는 js/css 참조 (절대·상대 경로 모두)
    for m in re.finditer(r'<(?:script|link)\b[^>]*(?:src|href)="([^"]*resources/[^"]+)"', s):
        url = m.group(1)
        if asset_missing(url, abspath):
            # 상대/절대 표기가 달라도 같은 파일이면 한 원인으로 묶는다
            sig = "/" + url.split("resources/", 1)[1].split("?")[0]
            f.append(("R05", line_of(s, m.start()), url, "resources/" + sig.lstrip("/")))

    # R06 태그 불균형 (pre 안은 예시 코드라 제외)
    body = re.sub(r"<pre\b[^>]*>.*?</pre>", "", s, flags=re.S | re.I)
    stack, broke = [], False
    for m in TAG.finditer(body):
        t = m.group(2).lower()
        if t in VOID or m.group(3) or t == "!doctype":
            continue
        if not m.group(1):
            stack.append((t, line_of(body, m.start())))
        else:
            if not stack:
                f.append(("R06", line_of(body, m.start()), "</%s> 짝 없음" % t, "</%s> 짝 없음" % t))
                broke = True
                break
            top, tl = stack.pop()
            if top != t:
                f.append(("R06", line_of(body, m.start()),
                          "</%s> 인데 열린 태그는 <%s> (L%d)" % (t, top, tl),
                          "</%s> vs <%s>" % (t, top)))
                broke = True
                break
    if not broke:
        for t, tl in stack:
            f.append(("R06", tl, "<%s> 닫히지 않음" % t, "<%s> 미닫힘" % t))

    # R07 가짜 선택 카드
    for m in re.finditer(r'<div class="[^"]*\bhf_rate_card\b[^"]*\bon\b[^"]*">', s):
        f.append(("R07", line_of(s, m.start()), m.group(0)[:70], "hf_rate_card on"))

    # R09 div/span/li 에 type=button
    for m in re.finditer(r'<(div|span|li)\b[^>]*\stype="button"', s):
        f.append(("R09", line_of(s, m.start()), m.group(0)[:70], "<%s type=button>" % m.group(1)))

    # R10 팝업 type2~5
    for m in re.finditer(r'class="[^"]*com_pop_wrap[^"]*\b(type[2-5])\b[^"]*"', s):
        f.append(("R10", line_of(s, m.start()), m.group(0)[:70], m.group(1)))

    # R11 닫기 수단 없는 팝업
    for m in re.finditer(r'<div class="[^"]*\bcom_pop_wrap\b[^"]*">', s):
        end = close_index(s, m.start())
        if end is None:
            continue
        seg = s[m.start():end]
        if not re.search(r'class="[^"]*\b(close|end)\b[^"]*"', seg) and "data-close-pop" not in seg:
            f.append(("R11", line_of(s, m.start()), m.group(0)[:70], "닫기 수단 없음"))

    # R12 display:none 으로 숨긴 폼 컨트롤
    for m in re.finditer(r'<(?:input|select|textarea)\b[^>]*style="[^"]*display:\s*none[^"]*"', s):
        f.append(("R12", line_of(s, m.start()), m.group(0)[:70], "display:none"))

    # R13 close 인라인 onclick
    for m in re.finditer(r'<[^>]*class="[^"]*\bclose\b[^"]*"[^>]*\sonclick=', s):
        f.append(("R13", line_of(s, m.start()), m.group(0)[:70], "close onclick"))

    # R14 보정 안 되는 고정 버튼
    for m in re.finditer(r'class="[^"]*btn_cont[^"]*\bpage\b[^"]*\bfixed\b[^"]*\bdirection\b[^"]*"', s):
        f.append(("R14", line_of(s, m.start()), m.group(0)[:70], "fixed direction"))

    return f


def guide_classes():
    p = os.path.join(ROOT, "worklist", "mobile_guide.html")
    if not os.path.isfile(p):
        return set()
    g = io.open(p, encoding="utf-8", errors="replace").read()
    out = set(x for m in re.finditer(r'class="([^"]+)"', g) for x in m.group(1).split())
    for m in re.finditer(r"class=&quot;([^&]+)&quot;", g):
        for x in m.group(1).split():
            out.add(x)
    return out


def esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;")
                  .replace(">", "&gt;").replace('"', "&quot;"))


def ordered(findings):
    return sorted(findings.items(),
                  key=lambda kv: (RULES[kv[0]][0] != "error", -len(kv[1]), kv[0]))


def signatures(items):
    """(sig -> 파일 집합, 건수, 대표 예시) 를 파일 수 내림차순으로."""
    agg = collections.defaultdict(lambda: [set(), 0, None])
    for rel, line, detail, sig in items:
        a = agg[sig]
        a[0].add(rel)
        a[1] += 1
        if a[2] is None:
            a[2] = (rel, line, detail)
    rows = [(len(v[0]), v[1], k, v[2]) for k, v in agg.items()]
    rows.sort(reverse=True)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=None, help="검사 대상 glob (기본 html/**/*.html)")
    ap.add_argument("--rule", default=None, help="쉼표로 구분한 규칙 코드")
    ap.add_argument("--severity", default=None, choices=["error", "warn"])
    ap.add_argument("--limit", type=int, default=12, help="원인당 표시할 파일 수")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--json", default=None)
    ap.add_argument("--report", default=os.path.join(HERE, "lint_report.html"))
    ap.add_argument("--baseline-write", action="store_true")
    args = ap.parse_args()

    pat = args.path or os.path.join(ROOT, "html", "**", "*.html")
    if not os.path.isabs(pat):
        pat = os.path.join(ROOT, pat)
    files = sorted(glob.glob(pat, recursive=True))
    only = set(x.strip().upper() for x in args.rule.split(",")) if args.rule else None

    findings = collections.defaultdict(list)
    cls_files = collections.defaultdict(set)

    for p in files:
        raw = io.open(p, encoding="utf-8", errors="replace").read()
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        for rule, line, detail, sig in check(raw, p):
            if only and rule not in only:
                continue
            if args.severity and RULES[rule][0] != args.severity:
                continue
            findings[rule].append((rel, line, detail, sig))
        for m in re.finditer(r'class="([^"]+)"', raw):
            for c in m.group(1).split():
                cls_files[c].add(rel)

    gcls = guide_classes()
    undoc = sorted(((len(v), k) for k, v in cls_files.items()
                    if k not in gcls and not MODIFIER.match(k)), reverse=True)
    base = json.loads(io.open(BASELINE, encoding="utf-8").read()) if os.path.isfile(BASELINE) else {}
    known = set(base.get("classes", []))
    drift = sorted((len(cls_files[k]), k) for k in cls_files
                   if known and k not in known and k not in gcls)
    drift.reverse()

    if args.baseline_write:
        io.open(BASELINE, "w", encoding="utf-8").write(json.dumps(
            {"classes": sorted(cls_files), "files": len(files)}, ensure_ascii=False, indent=1))
        print("baseline written: %d classes, %d files" % (len(cls_files), len(files)))
        return 0

    n_err = sum(len(v) for r, v in findings.items() if RULES[r][0] == "error")
    n_warn = sum(len(v) for r, v in findings.items() if RULES[r][0] == "warn")
    n_sig = sum(len(signatures(v)) for v in findings.values())

    write_text(args, files, findings, undoc, drift, n_err, n_warn, n_sig)
    write_html(args, files, findings, undoc, drift, n_err, n_warn, n_sig)
    if args.json:
        io.open(args.json, "w", encoding="utf-8").write(json.dumps(
            {"files": len(files), "errors": n_err, "warnings": n_warn, "causes": n_sig,
             "findings": {r: [list(x) for x in v] for r, v in findings.items()},
             "undocumented": undoc[:200], "drift": drift[:200]},
            ensure_ascii=False, indent=1))

    print("files=%d errors=%d warnings=%d causes=%d undocumented=%d drift=%d"
          % (len(files), n_err, n_warn, n_sig, len(undoc), len(drift)))
    print("report: %s" % args.report)
    return 1 if n_err else 0


def top_actions(findings, n=10):
    """규칙을 가로질러 '고치면 파일이 가장 많이 줄어드는 원인' 상위 N."""
    rows = []
    for rule, items in findings.items():
        for nfiles, ncount, sig, ex in signatures(items):
            rows.append((nfiles, ncount, rule, sig, ex))
    rows.sort(reverse=True)
    return rows[:n]


def write_text(args, files, findings, undoc, drift, n_err, n_warn, n_sig):
    o = io.open(os.path.splitext(args.report)[0] + ".txt", "w", encoding="utf-8")
    o.write("HF MB 퍼블리싱 린트\n")
    o.write("검사 %d개 파일 · error %d건 · warn %d건 · 원인 %d종\n\n"
            % (len(files), n_err, n_warn, n_sig))

    o.write("=== 우선 조치 (고치면 가장 많은 파일이 해결되는 순서) ===\n")
    for nfiles, ncount, rule, sig, ex in top_actions(findings):
        o.write("  %-5s %-34s %4d개 파일 / %4d건\n" % (rule, sig[:34], nfiles, ncount))
        o.write("        예: %s:%d\n" % (ex[0], ex[1]))
    o.write("\n")

    for rule, items in ordered(findings):
        sev, name, why = RULES[rule]
        sigs = signatures(items)
        nf = len(set(x[0] for x in items))
        o.write("[%s] %s  %s — %d건 / %d개 파일 / 원인 %d종\n"
                % (sev.upper(), rule, name, len(items), nf, len(sigs)))
        o.write("      %s\n" % why)
        for nfiles, ncount, sig, ex in sigs:
            o.write("   · %s   (%d개 파일 / %d건)\n" % (sig, nfiles, ncount))
            rels = sorted(set(x[0] for x in items if x[3] == sig))
            shown = rels[: (10 ** 9 if args.full else args.limit)]
            for rel in shown:
                ln = min(x[1] for x in items if x[0] == rel and x[3] == sig)
                o.write("       %s:%d\n" % (rel, ln))
            if len(rels) > len(shown):
                o.write("       ... 외 %d개 파일 (--full)\n" % (len(rels) - len(shown)))
        o.write("\n")

    o.write("[백로그] 가이드 미수록 클래스 %d종 (상위 40)\n" % len(undoc))
    for c, name in undoc[:40]:
        o.write("      %5d개 파일  %s\n" % (c, name))
    if drift:
        o.write("\n[드리프트] 기준선 이후 새로 등장한 클래스 %d종\n" % len(drift))
        for c, name in drift[:60]:
            o.write("      %5d개 파일  %s\n" % (c, name))
    o.close()


CSS = """body{margin:0;background:#f4f5f7;font:14px/1.6 -apple-system,'Malgun Gothic',sans-serif;color:#1e2124}
.wrap{max-width:112rem;margin:0 auto;padding:24px}
h1{font-size:22px;margin:0 0 4px}.lead{color:#5b6169;margin:0 0 20px;max-width:70ch}
.sum{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.sum b{display:block;font-size:22px}
.sum div{background:#fff;border:1px solid #e2e5e8;border-radius:10px;padding:12px 18px;min-width:104px}
.box{background:#fff;border:1px solid #e2e5e8;border-radius:10px;margin-bottom:14px;overflow:hidden}
.box>h2{margin:0;padding:12px 16px;font-size:15px;display:flex;gap:8px;align-items:center;
  border-bottom:1px solid #eef0f2;flex-wrap:wrap}
.sev{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;color:#fff}
.error{background:#d92d20}.warn{background:#e5900a}.info{background:#5b6169}
.cnt{margin-left:auto;color:#5b6169;font-size:12px;font-weight:400}
.why{margin:0;padding:10px 16px;background:#fafbfc;color:#5b6169;font-size:13px;border-bottom:1px solid #eef0f2}
table{width:100%;border-collapse:collapse;font-size:13px}
td,th{padding:7px 16px;border-bottom:1px solid #f1f3f5;vertical-align:top;text-align:left}
th{font-size:12px;color:#8a9199;font-weight:600;background:#fafbfc}
td.f{width:56%;word-break:break-all;color:#2563eb}
td.d,code{font-family:Consolas,monospace;font-size:12px;color:#3d444b;word-break:break-all}
details{border-bottom:1px solid #f1f3f5}
details>summary{padding:9px 16px;cursor:pointer;font-size:13px;list-style:none}
details>summary::-webkit-details-marker{display:none}
details>summary::before{content:'\\25b8';margin-right:8px;color:#8a9199}
details[open]>summary::before{content:'\\25be'}
details>summary b{color:#d92d20;font-weight:600}
.files{padding:0 16px 12px 34px;margin:0;font-size:12px;color:#5b6169}
.files li{word-break:break-all;padding:2px 0}
.ok{background:#fff;border:1px solid #e2e5e8;border-radius:10px;padding:24px;text-align:center;color:#12805c}"""


def write_html(args, files, findings, undoc, drift, n_err, n_warn, n_sig):
    p = ["<!doctype html><html lang=ko><head><meta charset=utf-8>",
         "<meta name=viewport content='width=device-width,initial-scale=1'>",
         "<title>HF MB 퍼블리싱 린트</title><style>%s</style></head><body><div class=wrap>" % CSS,
         "<h1>HF MB 퍼블리싱 린트</h1>",
         "<p class=lead>검사 %d개 파일. 한 화면이 상태별 파일로 복제돼 있어 원인 하나가 수십 건으로 "
         "불어난다. 건수가 아니라 <b>원인</b> 기준으로 보라 — 우선 조치 위에서부터 고치면 "
         "가장 많은 파일이 한 번에 해결된다.</p>" % len(files),
         "<div class=sum><div><b>%d</b>error</div><div><b>%d</b>warn</div><div><b>%d</b>원인</div>"
         "<div><b>%d</b>미수록 클래스</div><div><b>%d</b>신규 클래스</div></div>"
         % (n_err, n_warn, n_sig, len(undoc), len(drift))]

    if findings:
        p.append("<section class=box><h2><span class='sev info'>우선</span>우선 조치"
                 "<span class=cnt>고치면 가장 많은 파일이 해결되는 순서</span></h2>"
                 "<table><tr><th>규칙</th><th>원인</th><th>영향</th><th>예시 위치</th></tr>")
        for nfiles, ncount, rule, sig, ex in top_actions(findings):
            p.append("<tr><td><span class='sev %s'>%s</span> %s</td><td class=d>%s</td>"
                     "<td>%d개 파일 / %d건</td><td class=f>%s:%d</td></tr>"
                     % (RULES[rule][0], RULES[rule][0], rule, esc(sig), nfiles, ncount,
                        esc(ex[0]), ex[1]))
        p.append("</table></section>")
    else:
        p.append("<div class=ok>검출된 위반이 없습니다.</div>")

    for rule, items in ordered(findings):
        sev, name, why = RULES[rule]
        sigs = signatures(items)
        nf = len(set(x[0] for x in items))
        p.append("<section class=box><h2><span class='sev %s'>%s</span>%s %s"
                 "<span class=cnt>%d건 / %d개 파일 / 원인 %d종</span></h2>"
                 % (sev, sev, rule, esc(name), len(items), nf, len(sigs)))
        p.append("<p class=why>%s</p>" % esc(why))
        for nfiles, ncount, sig, ex in sigs:
            rels = sorted(set(x[0] for x in items if x[3] == sig))
            shown = rels[: (10 ** 9 if args.full else args.limit)]
            p.append("<details><summary><code>%s</code> — <b>%d개 파일</b> / %d건</summary><ul class=files>"
                     % (esc(sig), nfiles, ncount))
            for rel in shown:
                ln = min(x[1] for x in items if x[0] == rel and x[3] == sig)
                p.append("<li>%s:%d</li>" % (esc(rel), ln))
            if len(rels) > len(shown):
                p.append("<li>… 외 %d개 파일 (--full 로 전체 보기)</li>" % (len(rels) - len(shown)))
            p.append("</ul></details>")
        p.append("</section>")

    p.append("<section class=box><h2><span class='sev info'>info</span>백로그 · 가이드 미수록 클래스"
             "<span class=cnt>%d종</span></h2>" % len(undoc))
    p.append("<p class=why>사용 빈도 순. 위에서부터 mobile_guide.html 에 채우면 커버리지가 빨리 오른다.</p>"
             "<table><tr><th>클래스</th><th>사용</th></tr>")
    for c, name in undoc[:60]:
        p.append("<tr><td class=f>%s</td><td class=d>%d개 파일</td></tr>" % (esc(name), c))
    p.append("</table></section>")

    if drift:
        p.append("<section class=box><h2><span class='sev warn'>warn</span>드리프트 · 기준선 이후 신규 클래스"
                 "<span class=cnt>%d종</span></h2>" % len(drift))
        p.append("<p class=why>기준선을 찍은 뒤 새로 등장한 클래스다. 의도한 신규 컴포넌트라면 가이드에 "
                 "추가하고 --baseline-write 로 기준선을 갱신한다.</p>"
                 "<table><tr><th>클래스</th><th>사용</th></tr>")
        for c, name in drift[:120]:
            p.append("<tr><td class=f>%s</td><td class=d>%d개 파일</td></tr>" % (esc(name), c))
        p.append("</table></section>")

    p.append("</div></body></html>")
    io.open(args.report, "w", encoding="utf-8").write("\n".join(p))


if __name__ == "__main__":
    sys.exit(main())
