/* =======================================================
   정육 도감 — Meat Cuts Guide  |  app.js
   ======================================================= */
(function () {
  'use strict';

  var ANIMALS = { beef: window.BEEF, pork: window.PORK };
  var SUBS = { beef: window.SUB_BEEF || [], pork: window.SUB_PORK || [] };
  var PREP = window.PREP || {};
  var GUIDE = window.GUIDE || {};

  var PALETTE = [
    '#b5342e', '#d2603a', '#c98a2e', '#8a9c3b', '#3f8f6b',
    '#3d7f96', '#5b6bab', '#8a5aa3', '#b4477d', '#8d5a44',
    '#6c7a89', '#a8642c'
  ];

  var METHODS = [
    { m: '구이', emo: '🔥' }, { m: '스테이크', emo: '🥩' }, { m: '삶기·수육', emo: '♨️' },
    { m: '국·육수', emo: '🍲' }, { m: '찜', emo: '🫕' }, { m: '볶음', emo: '🍳' },
    { m: '튀김', emo: '🍤' }, { m: '회(육회)', emo: '🍣' }, { m: '전골·샤브샤브', emo: '🥘' },
    { m: '다짐육', emo: '🍔' }
  ];

  /* ---------- storage (safe) ---------- */
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function strip(s) { return String(s || '').replace(/<[^>]*>/g, ''); }
  var uid = 0;

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
    var f = function (v) { v = Math.max(0, Math.min(255, Math.round(v))).toString(16); return v.length < 2 ? '0' + v : v; };
    return '#' + f(r) + f(g) + f(b);
  }

  function primalIndex(animalKey, primalId) {
    var a = ANIMALS[animalKey];
    for (var sk in a.styles) {
      var cs = a.styles[sk].cuts;
      for (var i = 0; i < cs.length; i++) if (cs[i].id === primalId) return i;
    }
    return 0;
  }
  function primalColor(animalKey, primalId) { return PALETTE[primalIndex(animalKey, primalId) % PALETTE.length]; }

  function findCut(animalKey, cutId) {
    var a = ANIMALS[animalKey]; if (!a) return null;
    for (var sk in a.styles) {
      var st = a.styles[sk];
      for (var i = 0; i < st.cuts.length; i++)
        if (st.cuts[i].id === cutId) return { cut: st.cuts[i], style: st, animal: a, animalKey: animalKey, index: i };
    }
    return null;
  }
  function findSub(animalKey, subId) {
    var list = SUBS[animalKey] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === subId) return list[i];
    return null;
  }
  function subsOf(animalKey, primalId) {
    return (SUBS[animalKey] || []).filter(function (s) { return s.p === primalId; });
  }
  /* 소분할 색 = 상위 대분할 색의 명도 변주 */
  function subColor(animalKey, sub) {
    var sib = subsOf(animalKey, sub.p), n = sib.length, i = 0;
    for (var k = 0; k < n; k++) if (sib[k].id === sub.id) i = k;
    var base = primalColor(animalKey, sub.p);
    var amt = n > 1 ? ((i - (n - 1) / 2) / Math.max(1, (n - 1) / 2)) * 0.26 : 0;
    return shade(base, amt);
  }

  function rectPts(r) {
    return r[0] + ',' + r[1] + ' ' + (r[0] + r[2]) + ',' + r[1] + ' ' +
      (r[0] + r[2]) + ',' + (r[1] + r[3]) + ' ' + r[0] + ',' + (r[1] + r[3]);
  }
  function centroid(points) {
    var p = points.trim().split(/\s+/).map(function (s) { var xy = s.split(','); return [+xy[0], +xy[1]]; });
    var x = 0, y = 0;
    for (var i = 0; i < p.length; i++) { x += p[i][0]; y += p[i][1]; }
    return [x / p.length, y / p.length];
  }
  function bbox(points) {
    var p = points.trim().split(/\s+/).map(function (s) { var xy = s.split(','); return [+xy[0], +xy[1]]; });
    var xs = p.map(function (v) { return v[0]; }), ys = p.map(function (v) { return v[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return [x0, y0, x1 - x0, y1 - y0];
  }
  /* 셀 크기에 맞춰 라벨을 줄바꿈·축소 — 줄 수가 적을수록 우선 */
  function fitLabel(name, w, h, max, min) {
    var best = null;
    for (var n = 1; n <= 3; n++) {
      var per = Math.ceil(name.length / n);
      if (per < 1) continue;
      var size = Math.min(max, (w - 8) / (per * 0.99), (h - 6) / (n * 1.16));
      if (!best || size > best.size + 0.4) best = { size: size, n: n };
    }
    if (!best) best = { size: min, n: 1 };
    var size2 = Math.max(min, Math.round(best.size * 10) / 10);
    var out = [], step = Math.ceil(name.length / best.n);
    for (var i = 0; i < name.length; i += step) out.push(name.substr(i, step));
    return { lines: out, size: size2 };
  }
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆'); return s; }
  function barsHtml(n) { var h = ''; for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? 'f' : '') + '"></i>'; return '<div class="bars">' + h + '</div>'; }
  function emoOf(m) { for (var i = 0; i < METHODS.length; i++) if (METHODS[i].m === m) return METHODS[i].emo; return '🍽️'; }

  /* ================= SVG 도해 ================= */
  function chartSvg(animalKey, styleKey, opts) {
    opts = opts || {};
    var a = ANIMALS[animalKey], st = a.styles[styleKey], d = a.deco;
    var level = opts.level === 'sub' ? 'sub' : 'primal';
    var active = opts.active || null;
    var cid = 'clip' + (++uid);
    var s = '<svg class="chart" viewBox="' + a.viewBox + '" role="img" aria-label="' + esc(a.ko) + ' 부위 도해">';
    s += '<defs><clipPath id="' + cid + '"><path d="' + d.body + '"/>' +
      (level === 'primal' ? '' : '') + '</clipPath></defs>';

    /* 실루엣 */
    s += '<path class="silhouette" d="' + d.body + '"/>';
    s += '<path class="silhouette" d="' + d.head + '"/>';
    if (d.ear) s += '<path class="silhouette" d="' + d.ear + '"/>';
    if (d.muzzle) s += '<path class="silhouette" d="' + d.muzzle + '"/>';

    /* 부위 영역 (몸통 실루엣으로 클리핑) */
    var cells = [];
    if (level === 'sub') {
      (SUBS[animalKey] || []).forEach(function (sc) {
        var pts = [rectPts(sc.rect)];
        if (sc.rect2) pts.push(rectPts(sc.rect2));
        cells.push({ id: sc.id, name: sc.name, color: subColor(animalKey, sc), pts: pts, kind: 'sub' });
      });
    } else {
      st.cuts.forEach(function (c, i) {
        var pts = [c.shape]; if (c.shape2) pts.push(c.shape2);
        cells.push({ id: c.id, name: c.name, color: PALETTE[i % PALETTE.length], pts: pts, kind: 'cut' });
      });
    }

    s += '<g clip-path="url(#' + cid + ')">';
    cells.forEach(function (c) {
      var cls = 'cut' + (active ? (active === c.id ? ' hi' : ' dim') : '');
      c.pts.forEach(function (p, k) {
        s += '<polygon class="' + cls + '" fill="' + c.color + '" data-' + c.kind + '="' + c.id + '" points="' + p + '">' +
          (k === 0 ? '<title>' + esc(c.name) + '</title>' : '') + '</polygon>';
      });
    });
    s += '</g>';

    /* 장식 */
    if (d.tail) s += '<path class="deco" d="' + d.tail + '"/>';
    if (d.horn) s += '<path class="deco" d="' + d.horn + '"/>';
    if (d.eye) {
      var e = d.eye.split(/[,\s]+/);
      s += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="' + (e[2] || 6) + '" fill="var(--text-3)" opacity=".6"/>';
    }

    /* 라벨 */
    cells.forEach(function (c) {
      var bb = bbox(c.pts[0]), ct = centroid(c.pts[0]);
      var f = level === 'sub' ? fitLabel(c.name, bb[2], bb[3], 17, 9) : fitLabel(c.name, bb[2], bb[3], 27, 14);
      var total = f.lines.length * f.size * 1.14;
      var y0 = ct[1] - total / 2 + f.size * 0.95;
      var op = (active && active !== c.id) ? ' opacity=".28"' : '';
      f.lines.forEach(function (ln, i) {
        s += '<text class="lbl" x="' + ct[0].toFixed(1) + '" y="' + (y0 + i * f.size * 1.14).toFixed(1) +
          '" font-size="' + f.size + '" text-anchor="middle"' + op + '>' + esc(ln) + '</text>';
      });
    });

    s += '</svg>';
    return s;
  }

  /* 넓은 도해를 활성 부위가 보이도록 가로 스크롤 */
  function centerScroll(root, animalKey, rect) {
    var box = q('.chartscroll', root); if (!box) return;
    var vb = ANIMALS[animalKey].viewBox.split(/\s+/).map(Number);
    var frac = rect ? ((rect[0] + rect[2] / 2) - vb[0]) / vb[2] : 0.14;
    requestAnimationFrame(function () {
      var max = box.scrollWidth - box.clientWidth;
      if (max <= 0) return;
      box.scrollLeft = Math.max(0, Math.min(max, frac * box.scrollWidth - box.clientWidth / 2));
    });
  }

  function bindChart(root, animalKey) {
    qa('[data-cut]', root).forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/cut/' + animalKey + '/' + el.getAttribute('data-cut'); });
    });
    qa('[data-sub]', root).forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/sub/' + animalKey + '/' + el.getAttribute('data-sub'); });
    });
  }

  /* 공통 렌더 조각 */
  function statsHtml(st) {
    var h = '<div class="stats">';
    [['연함', st.tender], ['지방', st.fat], ['풍미', st.flavor], ['가격', st.price]].forEach(function (p) {
      h += '<div class="stat"><b>' + p[0] + '</b>' + barsHtml(p[1]) + '</div>';
    });
    return h + '</div>';
  }
  function cookHtml(cook) {
    var sorted = cook.slice().sort(function (x, y) { return y.s - x.s; });
    var h = '<div class="cook">';
    sorted.forEach(function (k, idx) {
      var cls = 'cookrow' + (idx === 0 && k.s >= 4 ? ' top' : '') + (k.s <= 2 ? ' low' : '');
      h += '<div class="' + cls + '"><div class="ch"><span>' + emoOf(k.m) + '</span><b>' + esc(k.m) + '</b>' +
        '<span class="stars">' + stars(k.s) + '</span></div><p>' + k.tip + '</p></div>';
    });
    return h + '</div>';
  }
  function qualityHtml(c) {
    var h = '<ul class="plist ok">' + c.quality.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    if (c.avoid && c.avoid.length) {
      h += '<div class="sec-h" style="margin-top:16px"><span class="dot" style="background:var(--warn)"></span>이런 건 피하세요</div>';
      h += '<ul class="plist no">' + c.avoid.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    }
    return h;
  }

  /* ================= PAGES ================= */

  function pageHome() {
    var nb = (SUBS.beef || []).length, np = (SUBS.pork || []).length;
    var h = '';
    h += '<div class="hero">';
    h += '<p class="muted" style="font-size:13.5px;margin:0">한국식·서양식 정육 방식으로 나눠 보는</p>';
    h += '<h2 style="margin:2px 0 0;font-size:25px;font-weight:850;letter-spacing:-.035em">소·돼지 부위 도감</h2>';
    h += '<p>대분할·소분할 부위별 특징 · 어울리는 조리법 · 통고기 손질법 · 좋은 고기 고르는 법</p></div>';

    h += '<div class="pickers">';
    h += '<button class="picker beef" data-go="#/chart/beef/kr"><span class="emo">🐄</span><h3>소고기</h3><span>대분할 10 · 소분할 ' + nb + ' · 서양식 9</span></button>';
    h += '<button class="picker pork" data-go="#/chart/pork/kr"><span class="emo">🐖</span><h3>돼지고기</h3><span>대분할 7 · 소분할 ' + np + ' · 서양식 7</span></button>';
    h += '</div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>바로가기</div><div class="qgrid">';
    h += '<button class="qcard" data-go="#/cook"><span class="emo">🍳</span><span><b>조리법으로 찾기</b><i>구이·수육·육수·회…</i></span></button>';
    h += '<button class="qcard" data-go="#/guide"><span class="emo">🏷️</span><span><b>등급·선도 가이드</b><i>1<sup>++</sup> · USDA · 고르는 법</i></span></button>';
    h += '<button class="qcard" data-go="#/search"><span class="emo">🔍</span><span><b>부위 검색</b><i>' + (33 + nb + np) + '개 부위</i></span></button>';
    h += '<button class="qcard" data-go="#/guide#temp"><span class="emo">🌡️</span><span><b>조리 온도표</b><i>스테이크 굽기 정도</i></span></button>';
    h += '</div></div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>한국식 vs 서양식, 무엇이 다른가</div>';
    h += '<div class="note" style="margin-top:0">' +
      '<b>한국식</b>은 근육의 결(근막)을 따라 하나씩 발라냅니다. 큰 덩어리를 <b>대분할</b>, 그 안의 근육 단위를 <b>소분할</b>이라 하며, 소는 대분할 10 / 소분할 ' + nb + ', 돼지는 대분할 7 / 소분할 ' + np + '부위로 나눕니다.<br><br>' +
      '<b>서양식</b>은 뼈를 기준으로 큰 덩어리(Primal)를 톱으로 자릅니다. 뼈를 가로질러 자르므로 <b>티본·폭찹</b> 같은 큰 단면이 나오고, 오븐 로스팅과 가공(베이컨·햄)에 최적화되어 있습니다.<br><br>' +
      '각 부위 페이지 아래에서 <b>반대 방식의 대응 부위</b>로 바로 이동할 수 있습니다.' +
      '</div></div>';

    h += '<div class="disclaimer">부위 명칭과 분할 기준은 축산물 표준 분할·분할육 기준(한국) 및 북미 프라이멀 관행을 바탕으로 정리했습니다. 지역·정육점에 따라 명칭과 경계가 다를 수 있으며, 도해는 위치 이해를 위한 <b>모식도</b>로 실제 해부학적 경계와 차이가 있습니다.</div>';
    return { title: '정육 도감', body: h, back: false };
  }

  function pageChart(animalKey, styleKey, level) {
    var a = ANIMALS[animalKey]; if (!a) return pageHome();
    if (!a.styles[styleKey]) styleKey = 'kr';
    if (styleKey !== 'kr') level = 'primal';
    var st = a.styles[styleKey];
    var isSub = level === 'sub';
    var subs = SUBS[animalKey] || [];
    var h = '';

    h += '<div class="seg" id="seg">';
    ['kr', 'ws'].forEach(function (k) {
      h += '<button data-style="' + k + '" class="' + (k === styleKey ? 'on' : '') + '">' +
        a.styles[k].label + ' <span style="font-weight:600;opacity:.7">' + a.styles[k].cuts.length + '</span></button>';
    });
    h += '</div>';

    if (styleKey === 'kr') {
      h += '<div class="seg lvl" id="lvl">';
      h += '<button data-lvl="primal" class="' + (isSub ? '' : 'on') + '">대분할 <span style="font-weight:600;opacity:.7">' + st.cuts.length + '</span></button>';
      h += '<button data-lvl="sub" class="' + (isSub ? 'on' : '') + '">소분할 <span style="font-weight:600;opacity:.7">' + subs.length + '</span></button>';
      h += '</div>';
    }

    h += '<div class="note">' + (isSub
      ? '<b>소분할</b>은 대분할 덩어리를 근육 결을 따라 한 번 더 발라낸 단위입니다. 정육점 가격과 용도가 실제로 갈리는 지점이라, 같은 대분할이라도 <b>어느 소분할을 샀는지</b>가 훨씬 중요합니다. 색이 비슷한 칸끼리가 같은 대분할에 속하며, 부위를 누르면 상세 설명으로 이동합니다.'
      : st.note) + '</div>';

    h += '<div class="chartwrap' + (isSub ? ' wide' : '') + '" id="chartwrap"><div class="chartscroll">' +
      chartSvg(animalKey, styleKey, { level: isSub ? 'sub' : 'primal' }) + '</div></div>';
    h += '<p class="tiny" style="text-align:center;margin:8px 0 0">' +
      (isSub ? '좌우로 밀어 보세요 · 부위를 누르면 상세 설명' : '도해에서 부위를 눌러보세요') +
      ' · <b>' + esc(st.sub) + '</b></p>';

    if (isSub) {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>소분할 부위 ' + subs.length + '개</div>';
      st.cuts.forEach(function (c, ci) {
        var mine = subsOf(animalKey, c.id);
        if (!mine.length) return;
        h += '<div class="grp"><div class="grph"><i style="background:' + PALETTE[ci % PALETTE.length] + '"></i>' + esc(c.name) +
          '<span>' + mine.length + '</span></div><div class="cutlist">';
        mine.forEach(function (s2) {
          var best = s2.cook.slice().sort(function (x, y) { return y.s - x.s; }).slice(0, 3).map(function (x) { return x.m; }).join(' · ');
          h += '<button class="cutrow" data-go="#/sub/' + animalKey + '/' + s2.id + '">' +
            '<span class="sw" style="background:' + subColor(animalKey, s2) + ';font-size:11px">' + esc(s2.name.slice(0, 2)) + '</span>' +
            '<span class="tx"><b>' + esc(s2.name) + '</b><i>' + esc(s2.en) + ' · ' + esc(best) + '</i></span><span class="go">›</span></button>';
        });
        h += '</div></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>부위 목록</div><div class="cutlist">';
      st.cuts.forEach(function (c, i) {
        var best = c.cook.slice().sort(function (x, y) { return y.s - x.s; }).slice(0, 3).map(function (x) { return x.m; }).join(' · ');
        var ns = subsOf(animalKey, c.id).length;
        h += '<button class="cutrow" data-go="#/cut/' + animalKey + '/' + c.id + '">' +
          '<span class="sw" style="background:' + PALETTE[i % PALETTE.length] + '">' + (i + 1) + '</span>' +
          '<span class="tx"><b>' + esc(c.name) + (ns ? ' <span class="mini">소분할 ' + ns + '</span>' : '') + '</b><i>' + esc(c.en) + ' · ' + esc(best) + '</i></span>' +
          '<span class="go">›</span></button>';
      });
      h += '</div></div>';
    }

    return {
      title: a.ko + ' 부위', body: h, back: '#/',
      after: function (root) {
        bindChart(root, animalKey);
        if (isSub) centerScroll(root, animalKey, null);
        qa('#seg button', root).forEach(function (b) {
          b.addEventListener('click', function () { location.hash = '#/chart/' + animalKey + '/' + b.getAttribute('data-style'); });
        });
        qa('#lvl button', root).forEach(function (b) {
          b.addEventListener('click', function () {
            var v = b.getAttribute('data-lvl');
            location.hash = '#/chart/' + animalKey + '/' + styleKey + (v === 'sub' ? '/sub' : '');
          });
        });
      }
    };
  }

  function pageCut(animalKey, cutId) {
    var f = findCut(animalKey, cutId);
    if (!f) return pageHome();
    var c = f.cut, st = f.style, a = f.animal;
    var col = PALETTE[f.index % PALETTE.length];
    var prep = PREP[animalKey + ':' + cutId];
    var mine = st.key === 'kr' ? subsOf(animalKey, cutId) : [];
    var h = '';

    h += '<div class="dhead"><div class="en">' + esc(a.ko) + ' · ' + st.label + ' 대분할 · ' + esc(c.en) + '</div>';
    h += '<h2 style="color:' + col + '">' + esc(c.name) + '</h2>';
    h += '<div class="chips">' + c.tags.map(function (t) {
      return '<span class="chip" style="background:' + col + '18;color:' + col + '">' + esc(t) + '</span>';
    }).join('') + '</div></div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>어느 부위인가 — 위치</div>';
    h += '<div class="minimap">' + chartSvg(animalKey, st.key, { active: c.id }) + '</div>';
    h += '<p class="body" style="margin-top:10px">' + c.pos + '</p></div>';

    h += statsHtml(c.stats);

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>부위 특징</div><div class="body" style="margin-top:0">' + c.feature + '</div></div>';

    /* 소분할 목록 */
    if (mine.length) {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>소분할 부위 ' + mine.length + '개 — 눌러서 상세 보기</div><div class="cutlist">';
      mine.forEach(function (s2) {
        h += '<button class="cutrow" data-go="#/sub/' + animalKey + '/' + s2.id + '">' +
          '<span class="sw" style="background:' + subColor(animalKey, s2) + ';font-size:11px">' + esc(s2.name.slice(0, 2)) + '</span>' +
          '<span class="tx"><b>' + esc(s2.name) + '</b><i>' + esc(s2.en) + ' · ' + esc(strip(s2.feature).slice(0, 34)) + '…</i></span>' +
          '<span class="go">›</span></button>';
      });
      h += '</div></div>';
    } else if (c.sub && c.sub.length) {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>세부 부위 (' + c.sub.length + ')</div><div class="subgrid">';
      c.sub.forEach(function (s2) {
        h += '<div class="subitem"><b>' + esc(s2.ko) + '</b><em>' + esc(s2.en) + '</em><p>' + esc(s2.note) + '</p></div>';
      });
      h += '</div></div>';
    }

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>어울리는 조리법</div>' + cookHtml(c.cook);
    h += '<div class="sec-h" style="margin-top:16px"><span class="dot"></span>대표 요리</div>';
    h += '<div class="chips">' + c.dishes.map(function (d) { return '<span class="chip">' + esc(d) + '</span>'; }).join('') + '</div></div>';

    if (prep) {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>통고기(덩어리) 구매 시 손질법</div>';
      h += '<div class="kv"><span>📦 ' + esc(prep.buy) + '</span><span>📊 ' + esc(prep.yieldRate) + '</span></div>';
      h += '<div class="kv">' + prep.tools.map(function (t) { return '<span>🔪 ' + esc(t) + '</span>'; }).join('') + '</div>';
      h += '<div class="card" style="padding:15px 15px 14px"><div class="steps">';
      prep.steps.forEach(function (s2) { h += '<div class="step"><b>' + esc(s2.t) + '</b><p>' + s2.d + '</p></div>'; });
      h += '</div></div>';
      h += '<div class="note"><b>보관</b><br>' + prep.store + '</div>';
      if (prep.note) h += '<div class="note tip"><b>💡 팁</b><br>' + prep.note + '</div>';
      h += '</div>';
    }

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>좋은 고기 고르는 법</div>' + qualityHtml(c) + '</div>';

    if (c.xref) {
      var other = st.key === 'kr' ? '서양식' : '한국식';
      h += '<div class="sec"><button class="xref" data-go="#/cut/' + animalKey + '/' + c.xref.key + '">' +
        '<span style="font-size:20px">🔄</span><span><i>' + other + '으로는 이 부위</i><b>' + esc(c.xref.label) + '</b></span>' +
        '<span class="go" style="margin-left:auto">›</span></button></div>';
    }

    h += '<div class="disclaimer">도해는 위치 이해를 위한 모식도이며 실제 해부학적 경계와 차이가 있습니다. 조리 온도·시간은 일반적인 기준으로, 고기의 두께·초기 온도·기구에 따라 달라집니다.</div>';

    return { title: c.name, body: h, back: '#/chart/' + animalKey + '/' + st.key, after: function (root) { bindChart(root, animalKey); } };
  }

  function pageSub(animalKey, subId) {
    var s = findSub(animalKey, subId);
    if (!s) return pageHome();
    var a = ANIMALS[animalKey];
    var parent = findCut(animalKey, s.p);
    var col = subColor(animalKey, s);
    var h = '';

    h += '<div class="dhead"><div class="en">' + esc(a.ko) + ' · 한국식 소분할 · ' + esc(s.en) + '</div>';
    h += '<h2 style="color:' + col + '">' + esc(s.name) + '</h2>';
    h += '<div class="chips">' +
      '<span class="chip" style="background:var(--surface-2);color:var(--text-2)">대분할 ' + esc(parent ? parent.cut.name : '') + '</span>' +
      s.tags.map(function (t) { return '<span class="chip" style="background:' + col + '18;color:' + col + '">' + esc(t) + '</span>'; }).join('') +
      '</div></div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>어느 부위인가 — 위치</div>';
    h += '<div class="minimap wide"><div class="chartscroll">' + chartSvg(animalKey, 'kr', { level: 'sub', active: s.id }) + '</div></div>';
    h += '<p class="body" style="margin-top:10px">' + s.pos + '</p></div>';

    h += statsHtml(s.stats);

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>부위 특징</div><div class="body" style="margin-top:0">' + s.feature + '</div></div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>어울리는 조리법</div>' + cookHtml(s.cook);
    h += '<div class="sec-h" style="margin-top:16px"><span class="dot"></span>대표 요리</div>';
    h += '<div class="chips">' + s.dishes.map(function (d) { return '<span class="chip">' + esc(d) + '</span>'; }).join('') + '</div></div>';

    if (s.prep && s.prep.length) {
      h += '<div class="sec"><div class="sec-h"><span class="dot"></span>손질 포인트</div>';
      h += '<div class="card" style="padding:15px 15px 14px"><div class="steps">';
      s.prep.forEach(function (t, i) { h += '<div class="step"><p>' + t + '</p></div>'; });
      h += '</div></div></div>';
    }

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>좋은 고기 고르는 법</div>' + qualityHtml(s) + '</div>';

    if (parent) {
      h += '<div class="sec"><button class="xref" data-go="#/cut/' + animalKey + '/' + s.p + '">' +
        '<span style="font-size:20px">📦</span><span><i>상위 대분할 · 통고기 손질법 보기</i><b>' + esc(parent.cut.name) + '</b></span>' +
        '<span class="go" style="margin-left:auto">›</span></button></div>';
    }

    h += '<div class="disclaimer">도해는 위치 이해를 위한 모식도이며 실제 해부학적 경계와 차이가 있습니다. 소분할 명칭은 지역·정육점에 따라 다르게 불릴 수 있습니다.</div>';

    return {
      title: s.name, body: h, back: '#/chart/' + animalKey + '/kr/sub',
      after: function (root) { bindChart(root, animalKey); centerScroll(root, animalKey, s.rect); }
    };
  }

  function pageCook() {
    var sel = store.get('mg_method') || '구이';
    var lvl = store.get('mg_cooklvl') || 'primal';
    var h = '';
    h += '<p class="tiny" style="margin:0 0 10px">조리법을 고르면 그 요리에 가장 잘 맞는 부위를 순서대로 보여줍니다.</p>';
    h += '<div class="seg" id="clvl"><button data-lvl="primal" class="' + (lvl === 'primal' ? 'on' : '') + '">대분할·서양식</button>' +
      '<button data-lvl="sub" class="' + (lvl === 'sub' ? 'on' : '') + '">소분할</button></div>';
    h += '<div class="mgrid" id="mgrid">';
    METHODS.forEach(function (m) {
      h += '<button class="mbtn ' + (m.m === sel ? 'on' : '') + '" data-m="' + esc(m.m) + '"><span class="emo">' + m.emo + '</span>' + esc(m.m) + '</button>';
    });
    h += '</div><div id="mres"></div>';

    function results(method, level) {
      var list = [];
      ['beef', 'pork'].forEach(function (ak) {
        if (level === 'sub') {
          (SUBS[ak] || []).forEach(function (s) {
            s.cook.forEach(function (k) {
              if (k.m === method && k.s >= 4)
                list.push({ ak: ak, id: s.id, route: 'sub', name: s.name, sub: '소분할', s: k.s, tip: k.tip, col: subColor(ak, s) });
            });
          });
        } else {
          var a = ANIMALS[ak];
          for (var sk in a.styles) {
            a.styles[sk].cuts.forEach(function (c, i) {
              c.cook.forEach(function (k) {
                if (k.m === method && k.s >= 4)
                  list.push({ ak: ak, id: c.id, route: 'cut', name: c.name, sub: a.styles[sk].label, s: k.s, tip: k.tip, col: PALETTE[i % PALETTE.length] });
              });
            });
          }
        }
      });
      list.sort(function (x, y) { return y.s - x.s; });
      if (!list.length) return '<div class="empty"><span class="emo">🤔</span>이 조리법에 특별히 추천할 부위가 없습니다.</div>';
      var o = '<div class="sec"><div class="sec-h"><span class="dot"></span>' + esc(method) + '에 어울리는 부위 ' + list.length + '개</div><div class="cutlist">';
      list.forEach(function (r) {
        o += '<button class="cutrow" data-go="#/' + r.route + '/' + r.ak + '/' + r.id + '">' +
          '<span class="sw" style="background:' + r.col + '">' + (r.ak === 'beef' ? '소' : '돈') + '</span>' +
          '<span class="tx"><b>' + esc(r.name) + ' <span class="mini">' + esc(r.sub) + '</span></b><i>' + esc(strip(r.tip)) + '</i></span>' +
          '<span class="stars" style="font-size:10px">' + stars(r.s) + '</span></button>';
      });
      return o + '</div></div>';
    }

    return {
      title: '조리법으로 찾기', body: h, back: '#/',
      after: function (root) {
        var res = q('#mres', root);
        function draw() { res.innerHTML = results(sel, lvl); bindGo(res); }
        draw();
        qa('#mgrid .mbtn', root).forEach(function (b) {
          b.addEventListener('click', function () {
            qa('#mgrid .mbtn', root).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on'); sel = b.getAttribute('data-m'); store.set('mg_method', sel); draw();
          });
        });
        qa('#clvl button', root).forEach(function (b) {
          b.addEventListener('click', function () {
            qa('#clvl button', root).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on'); lvl = b.getAttribute('data-lvl'); store.set('mg_cooklvl', lvl); draw();
          });
        });
      }
    };
  }

  function pageGuide() {
    var h = '';
    h += '<div class="sec" style="margin-top:6px"><div class="sec-h"><span class="dot"></span>등급 체계</div>';
    GUIDE.grade.forEach(function (g, i) {
      h += '<details class="acc"' + (i === 0 ? ' open' : '') + '><summary><span class="chip">' + esc(g.badge) + '</span>' + esc(g.title) + '</summary><div class="accb">';
      h += '<p class="body" style="margin-top:0">' + g.lead + '</p>';
      g.blocks.forEach(function (b) {
        h += '<div class="gh">' + esc(b.h) + '</div>';
        if (b.rows) h += '<table class="gtable">' + b.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>';
        if (b.list) h += '<ul class="plist">' + b.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
        if (b.note) h += '<div class="note">' + b.note + '</div>';
      });
      h += '</div></details>';
    });
    h += '</div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>선도 판별 — 5가지 체크</div>';
    GUIDE.fresh.forEach(function (f) {
      h += '<details class="acc"><summary><span>' + f.icon + '</span>' + esc(f.h) + '</summary><div class="accb">' +
        '<ul class="plist">' + f.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></details>';
    });
    h += '</div>';

    h += '<div class="sec"><div class="sec-h"><span class="dot"></span>보관 · 해동</div>';
    GUIDE.store.forEach(function (s) {
      h += '<details class="acc"><summary>❄️ ' + esc(s.h) + '</summary><div class="accb">' +
        '<ul class="plist">' + s.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></details>';
    });
    h += '</div>';

    h += '<div class="sec" id="temp"><div class="sec-h"><span class="dot"></span>' + esc(GUIDE.temp.h) + '</div>';
    h += '<div class="card" style="padding:14px 15px">';
    h += '<div class="gh">🐄 소고기 (스테이크 굽기 정도)</div><table class="gtable">' +
      GUIDE.temp.beef.map(function (r) { return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b> — ' + r[2] + '</td></tr>'; }).join('') + '</table>';
    h += '<div class="gh">🐖 돼지고기</div><table class="gtable">' +
      GUIDE.temp.pork.map(function (r) { return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b> — ' + r[2] + '</td></tr>'; }).join('') + '</table>';
    h += '</div><div class="note">' + GUIDE.temp.note + '</div></div>';

    h += '<div class="disclaimer">등급 기준과 안전 온도는 관련 기관의 공표 기준이 개정될 수 있습니다. 실제 구매·조리 시에는 축산물품질평가원(한국) 및 USDA(미국)의 최신 고시를 함께 확인하세요.</div>';
    return { title: '등급 · 선도 가이드', body: h, back: '#/' };
  }

  function buildIndex() {
    var out = [];
    ['beef', 'pork'].forEach(function (ak) {
      var a = ANIMALS[ak];
      for (var sk in a.styles) {
        a.styles[sk].cuts.forEach(function (c, i) {
          out.push({
            ak: ak, route: 'cut', id: c.id, name: c.name, en: c.en, badge: a.styles[sk].label + ' 대분할',
            col: PALETTE[i % PALETTE.length], desc: c.dishes.slice(0, 3).join(', '),
            hay: [c.name, c.en, a.styles[sk].label, a.ko, c.tags.join(' '), c.dishes.join(' '),
              (c.sub || []).map(function (s) { return s.ko + ' ' + s.en; }).join(' '),
              c.cook.filter(function (k) { return k.s >= 4; }).map(function (k) { return k.m; }).join(' '),
              strip(c.pos)].join(' ').toLowerCase()
          });
        });
      }
      (SUBS[ak] || []).forEach(function (s) {
        var par = findCut(ak, s.p);
        out.push({
          ak: ak, route: 'sub', id: s.id, name: s.name, en: s.en,
          badge: '소분할 · ' + (par ? par.cut.name : ''), col: subColor(ak, s),
          desc: s.dishes.slice(0, 3).join(', '),
          hay: [s.name, s.en, a.ko, '소분할', par ? par.cut.name : '', s.tags.join(' '), s.dishes.join(' '),
            s.cook.filter(function (k) { return k.s >= 4; }).map(function (k) { return k.m; }).join(' '),
            strip(s.pos)].join(' ').toLowerCase()
        });
      });
    });
    return out;
  }
  var DB = null;

  function pageSearch() {
    if (!DB) DB = buildIndex();
    var h = '<div class="searchbar"><span>🔍</span><input id="sq" type="search" placeholder="부위·요리·조리법 검색 (예: 아롱사태, 항정살, 수육)" autocomplete="off"></div><div id="sres"></div>';

    function render(term) {
      term = (term || '').trim().toLowerCase();
      if (!term) return '<div class="empty"><span class="emo">🥩</span>' + DB.length + '개 부위에서 검색합니다.<br><span class="tiny">예: 아롱사태 · 항정살 · 차돌박이 · 갈매기살 · 돈까스 · 수육</span></div>';
      var r = DB.filter(function (x) { return x.hay.indexOf(term) >= 0; });
      if (!r.length) return '<div class="empty"><span class="emo">🔎</span>"' + esc(term) + '" 검색 결과가 없습니다.</div>';
      var o = '<div class="sec"><div class="sec-h"><span class="dot"></span>검색 결과 ' + r.length + '개</div><div class="cutlist">';
      r.forEach(function (x) {
        o += '<button class="cutrow" data-go="#/' + x.route + '/' + x.ak + '/' + x.id + '">' +
          '<span class="sw" style="background:' + x.col + '">' + (x.ak === 'beef' ? '소' : '돈') + '</span>' +
          '<span class="tx"><b>' + esc(x.name) + ' <span class="mini">' + esc(x.badge) + '</span></b><i>' + esc(x.en) + ' · ' + esc(x.desc) + '</i></span><span class="go">›</span></button>';
      });
      return o + '</div></div>';
    }

    return {
      title: '검색', body: h, back: '#/',
      after: function (root) {
        var input = q('#sq', root), res = q('#sres', root);
        res.innerHTML = render('');
        input.addEventListener('input', function () { res.innerHTML = render(input.value); bindGo(res); });
        setTimeout(function () { try { input.focus(); } catch (e) {} }, 120);
      }
    };
  }

  /* ================= ROUTER ================= */
  function bindGo(root) {
    qa('[data-go]', root).forEach(function (el) {
      if (el.__b) return; el.__b = 1;
      el.addEventListener('click', function () { location.hash = el.getAttribute('data-go'); });
    });
  }

  function route() {
    var hash = location.hash.replace(/^#\/?/, ''), anchor = '';
    if (hash.indexOf('#') >= 0) { anchor = hash.split('#')[1]; hash = hash.split('#')[0]; }
    var p = hash.split('/').filter(Boolean), page;
    if (!p.length) page = pageHome();
    else if (p[0] === 'chart') page = pageChart(p[1] || 'beef', p[2] || 'kr', p[3] || 'primal');
    else if (p[0] === 'cut') page = pageCut(p[1], p[2]);
    else if (p[0] === 'sub') page = pageSub(p[1], p[2]);
    else if (p[0] === 'cook') page = pageCook();
    else if (p[0] === 'guide') page = pageGuide();
    else if (p[0] === 'search') page = pageSearch();
    else page = pageHome();

    var app = q('#app');
    var bar = '<header class="appbar" id="appbar">' +
      (page.back ? '<button class="back" id="backbtn" aria-label="뒤로">‹</button>' : '<span style="width:2px"></span>') +
      '<h1>' + esc(page.title) + '</h1></header>';
    app.innerHTML = bar + '<main class="page" id="pg">' + page.body + '</main>' + navHtml(p[0] || '', p[1] || '');

    var pg = q('#pg');
    bindGo(pg); bindGo(q('.nav'));
    if (page.back) q('#backbtn').addEventListener('click', function () {
      if (history.length > 1) history.back(); else location.hash = page.back;
    });
    if (page.after) page.after(pg);

    window.scrollTo(0, 0);
    if (anchor) {
      var t = document.getElementById(anchor);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 90);
    }
  }

  function navHtml(seg, sub) {
    var items = [
      { go: '#/', ic: '🏠', t: '홈', on: seg === '' },
      { go: '#/chart/beef/kr', ic: '🐄', t: '소고기', on: (seg === 'chart' && sub === 'beef') },
      { go: '#/chart/pork/kr', ic: '🐖', t: '돼지', on: (seg === 'chart' && sub === 'pork') },
      { go: '#/cook', ic: '🍳', t: '조리법', on: seg === 'cook' },
      { go: '#/guide', ic: '🏷️', t: '가이드', on: seg === 'guide' }
    ];
    return '<nav class="nav">' + items.map(function (i) {
      return '<button data-go="' + i.go + '" class="' + (i.on ? 'on' : '') + '"><span class="ic">' + i.ic + '</span>' + i.t + '</button>';
    }).join('') + '</nav>';
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', function () {
    var b = document.getElementById('appbar');
    if (b) b.classList.toggle('scrolled', window.scrollY > 4);
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();
})();
