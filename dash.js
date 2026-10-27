// 대시보드 공통 — 데이터 로드·섹션 네비·facet 칩·카드·차트 헬퍼
// 정본: ~/server/trade-collector/docs/infographic-redesign/01-common.md §2·§5
// 필요: Chart.js · chart-defaults.js · region-select.js 를 먼저 로드
//
// 사용 (apt.html 참고):
//   Dash.start({
//     kind: 'apt',                         // data/dash-apt-all.json + data/dash-apt-<sido>.json
//     sections: { price: renderPrice },    // 섹션 id → (ctx) => void. 없는 섹션은 "준비 중"
//   });
//   ctx = { all, data, sido, sgg, region, regionName, rerender }
//     data   = 시도 파일 전체(generated·immature·ytd·facets·regions)
//     region = data.regions[sgg] (sgg '' = 시도 전체)

(function () {
  const isMobile = window.innerWidth < 700;
  if (window.Chart) {
    Chart.defaults.font.family = "'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
    Chart.defaults.font.size = isMobile ? 11 : 12;
  }

  // ─── 포맷 ───────────────────────────────────────────────
  const fmt = n => (n == null || !Number.isFinite(+n)) ? '-' : Math.round(+n).toLocaleString('ko-KR');
  // 만원 → "12.5억" / "8,500만"
  const eok = v => v == null ? '-' : (v >= 10000 ? `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}억` : `${fmt(v)}만`);
  const signPct = p => p == null ? '-' : `${p > 0 ? '+' : ''}${p.toFixed(1)}`;
  const ymText = ym => `${ym.slice(0, 4)}.${ym.slice(4, 6)}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 연도 라벨 — 올해는 "2026(1~10월)"
  function yearLabel(yr, ytd) {
    return ytd && String(yr) === String(ytd.yr) ? `${yr}(1~${ytd.thruMonth}월)` : String(yr);
  }
  function isImmature(ym, data) { return (data.immature || []).includes(ym); }

  // ─── 카드 ───────────────────────────────────────────────
  // c = {label, value, unit, sub, tone:'up'|'down'|'na'}
  function cards(container, list) {
    container.innerHTML = list.map(c => `
      <div class="kcard ${c.tone || ''}">
        <div class="label">${esc(c.label)}</div>
        <div class="value">${c.value == null ? '표본 부족' : esc(c.value)}${c.value != null && c.unit ? `<span class="unit">${esc(c.unit)}</span>` : ''}</div>
        <div class="sub">${c.sub || ''}</div>
      </div>`).join('');
  }
  const toneOf = p => p == null ? 'na' : p > 0 ? 'up' : p < 0 ? 'down' : '';

  // ─── facet 칩 ────────────────────────────────────────────
  // facets = {all:'전체', s:'소형', ...}. 고른 키는 state[key] 에 보관(섹션 재렌더 때 유지)
  const chipState = {};
  function chips(container, key, facets, onPick) {
    if (!(key in chipState) || !(chipState[key] in facets)) chipState[key] = Object.keys(facets)[0];
    container.classList.add('chips');
    container.innerHTML = '';
    for (const [k, label] of Object.entries(facets)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.classList.toggle('active', k === chipState[key]);
      b.onclick = () => { chipState[key] = k; onPick(k); };
      container.appendChild(b);
    }
    return chipState[key];
  }

  // ─── 차트 ───────────────────────────────────────────────
  const charts = {};
  function chart(canvasId, config) {
    if (charts[canvasId]) charts[canvasId].destroy();
    const cv = document.getElementById(canvasId);
    charts[canvasId] = new Chart(cv, config);
    return charts[canvasId];
  }
  // 중앙값 선 + p25~p75 띠 (데이터셋 3개). 반드시 이 순서로 넣어야 fill:'-1' 이 띠가 된다
  function bandDatasets({ label, color, med, p25, p75, yAxisID = 'y', order = 1 }) {
    const common = { type: 'line', yAxisID, pointRadius: 0, borderWidth: 0, tension: .3, spanGaps: false, order };
    return [
      { ...common, label: '_p75', data: p75, borderColor: 'transparent', fill: false },
      { ...common, label: '_p25', data: p25, borderColor: 'transparent', backgroundColor: color + '26', fill: '-1' },
      { type: 'line', label, data: med, yAxisID, borderColor: color, backgroundColor: color, borderWidth: 3, tension: .3,
        pointRadius: 4, pointBackgroundColor: color, pointBorderColor: chartTheme.pointBorder(), pointBorderWidth: 2, spanGaps: false, order },
    ];
  }
  // "_" 로 시작하는 보조 데이터셋은 범례에서 숨긴다
  const legendFilter = item => !String(item.text).startsWith('_');
  // 미완 월·부분연도 막대 색 — 미완은 회색
  function barColors(keys, isPartial, color) {
    return keys.map(k => isPartial(k) ? chartTheme.muted() : color + '55');
  }

  // 순위 가로 막대 — rows = [{key, name, value, on, tip}] (정렬은 호출 쪽). 높이는 행 수에 맞춘다
  function rankBars(canvasId, wrapId, rows, { tick = fmt, onClick, color = '#6366f1' } = {}) {
    document.getElementById(wrapId).style.height = `${Math.max(220, rows.length * (isMobile ? 20 : 24) + 40)}px`;
    return chart(canvasId, {
      type: 'bar',
      data: { labels: rows.map(r => r.name), datasets: [{ data: rows.map(r => r.value), borderRadius: 4,
        backgroundColor: rows.map(r => r.on ? color : chartTheme.muted()) }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: it => rows[it.dataIndex].tip || tick(it.raw) } } },
        scales: { x: { ticks: { callback: v => tick(v) }, grid: { color: chartTheme.grid() } }, y: { grid: { display: false }, ticks: { autoSkip: false } } },
        onClick: (e, els) => { if (els.length && onClick) onClick(rows[els[0].index]); } },
    });
  }
  // 히스토그램 구간 라벨 — edges [40,50,…,100] → ['40 미만','40~50',…,'100 이상']
  function histLabels(edges, unit = '') {
    const out = [`${edges[0]}${unit} 미만`];
    for (let i = 1; i < edges.length; i++) out.push(`${edges[i - 1]}~${edges[i]}${unit}`);
    out.push(`${edges[edges.length - 1]}${unit} 이상`);
    return out;
  }

  // 표 — cols = [{label, get:(row)=>html, cls?}] . 좁은 화면에서는 가로 스크롤
  // onRow(row) 를 주면 행을 누를 수 있다(단지 → 앱 검색 등)
  function table(container, cols, rows, empty = '해당 단지가 없습니다', onRow) {
    if (!rows.length) { container.innerHTML = `<div class="pending">${esc(empty)}</div>`; return; }
    container.innerHTML = `<div class="tbl-wrap"><table class="tbl${onRow ? ' clickable' : ''}"><thead><tr>${cols.map(c => `<th class="${c.cls || ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr data-i="${i}">${cols.map(c => `<td class="${c.cls || ''}">${c.get(r, i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (onRow) container.querySelector('tbody').onclick = e => { const tr = e.target.closest('tr'); if (tr) onRow(rows[+tr.dataset.i]); };
  }

  // URL 의 ?type= 을 읽는다 — 모르는 값이면 첫 키. setType 은 URL 만 갈아끼운다(다시 읽지 않는다)
  function getType(types) {
    const t = new URLSearchParams(location.search).get('type');
    return t && t in types ? t : Object.keys(types)[0];
  }
  function setType(t) {
    try { const q = new URLSearchParams(location.search); q.set('type', t); history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`); } catch (e) { /* 부가 기능 */ }
  }

  // 지역 비교 막대 (시군구 ↔ 시도 칩) — 섹션 안에 cmpHTML(prefix) 를 넣고 compare(ctx, prefix, o) 로 그린다
  // o = {title(mode), desc, pickSgg(region)→{value,tip}|null, pickSido(allSido)→{value,tip}|null, tick, color}
  function compare(ctx, prefix, o) {
    const { data, all, sido, sgg } = ctx;
    const sggCount = Object.keys(data.regions).length - 1;
    const modes = sggCount > 1 ? { sgg: '시군구', sido: '시도' } : { sido: '시도' };
    const mode = chips(document.getElementById(`${prefix}CmpChips`), `${prefix}Cmp`, modes, () => compare(ctx, prefix, o));
    let rows = mode === 'sgg'
      ? Object.entries(data.regions).filter(([k]) => k).map(([k, r]) => ({ key: k, name: r.name, on: k === sgg, ...(o.pickSgg(r) || {}) }))
      : all.sido.map(s => ({ key: s.code, name: s.name, on: s.code === sido, ...(o.pickSido(s) || {}) }));
    rows = rows.filter(r => r.value != null).sort((a, b) => b.value - a.value);
    const rank = rows.findIndex(r => r.on);
    document.getElementById(`${prefix}CmpTitle`).textContent = o.title(mode);
    document.getElementById(`${prefix}CmpDesc`).textContent = o.desc
      + (rank >= 0 ? ` · ${rows[rank].name} ${rank + 1}위 / ${rows.length}` : '')
      + ` · 막대를 누르면 그 ${mode === 'sgg' ? '시군구' : '시도'}로 바뀝니다`;
    rankBars(`${prefix}CmpChart`, `${prefix}CmpWrap`, rows, { color: o.color, tick: o.tick,
      onClick: r => mode === 'sgg' ? ctx.select(sido, r.key) : ctx.select(r.key, '') });
  }
  const cmpHTML = prefix => `
    <div class="sub-title" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span id="${prefix}CmpTitle">비교</span><span id="${prefix}CmpChips"></span></div>
    <div class="sub-desc" id="${prefix}CmpDesc"></div>
    <div class="chart-wrap" id="${prefix}CmpWrap" style="height:360px"><canvas id="${prefix}CmpChart"></canvas></div>`;

  // 단지 이름 칸 — 시도 전체를 볼 때는 시군구 이름을 붙인다. x = {n, d, g, a}
  function complexName(ctx, x, extra = '') {
    const where = ctx.sgg ? x.d : `${(ctx.data.regions[x.g] || {}).name || ''} ${x.d}`;
    return `${esc(x.n)}<div class="faint">${esc(where.trim())}${x.a ? ` · 전용 ${x.a}㎡` : ''}${extra}</div>`;
  }

  // 단지 행을 누르면 단지 상세(complex.html)로 간다 — 웹·앱 공통(2026-10-27 결정: 앱 안에서도 브리지 대신 페이지 이동.
  //   같은 호스트 이동이라 허브 WebView 가 그대로 열고, 뒤로 가기로 돌아온다)
  //   x.k = 단지 키(생성기가 넣는다, 계약 ~/server/trade-serve/docs/contract.md §2), x.a = 전용㎡ → 그 면적 칩으로 연다
  //   k 가 없는 행(키 넣기 전 JSON)만 예전처럼 앱 브리지로 넘긴다 — heatmap.html 과 같은 형식(name·regionCode·umd).
  //   웹이거나 앱이 이 메서드를 모르면 조용히 무시. 브리지 계약 정본: collector docs/infographic-redesign/06-app-hub.md §4.2
  function complexClick(x, kind = 'apt') {
    if (x.k) {
      const q = new URLSearchParams({ key: x.k });
      if (x.a) q.set('area', Math.round(x.a));
      location.href = `complex.html?${q}`;
      return;
    }
    if (!(window.AndroidBridge && window.AndroidBridge.onComplexClick)) return;
    const sgg = new URLSearchParams(location.search).get('sgg');
    const payload = { name: x.n, regionCode: x.g || sgg || null, umd: x.u || x.d || null, area: x.a || null, kind };
    try { window.AndroidBridge.onComplexClick(JSON.stringify(payload)); } catch (e) { /* 앱 쪽 시그니처가 다를 수 있다 */ }
  }

  // 'YYYYMM' → '25.11'
  const monthLabel = ym => `${ym.slice(2, 4)}.${ym.slice(4, 6)}`;

  // ─── 섹션 네비 ───────────────────────────────────────────
  function buildNav(nav) {
    const secs = [...document.querySelectorAll('.dsec')];
    const inner = nav.querySelector('.inner');
    for (const s of secs) {
      const a = document.createElement('a');
      a.href = `#${s.id}`;
      a.textContent = s.dataset.nav || s.id;
      inner.appendChild(a);
    }
    if ('IntersectionObserver' in window) {
      const links = Object.fromEntries([...inner.querySelectorAll('a')].map(a => [a.hash.slice(1), a]));
      const io = new IntersectionObserver(es => {
        for (const e of es) if (e.isIntersecting) {
          Object.values(links).forEach(a => a.classList.remove('active'));
          const a = links[e.target.id];
          if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
        }
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => io.observe(s));
    }
  }

  // ─── 시작 ───────────────────────────────────────────────
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} ${r.status}`);
    return r.json();
  }

  function fail(msg) {
    const box = document.getElementById('dashStatus');
    if (box) { box.textContent = msg; box.style.display = 'block'; }
  }

  async function start(opt) {
    const nav = document.getElementById('dashNav');
    if (nav) buildNav(nav);
    let all;
    try { all = await getJSON(`data/dash-${opt.kind}-all.json`); }
    catch (e) { fail('데이터 로딩 실패 — 잠시 뒤 다시 열어 주세요'); console.error(e); return; }

    const cache = {};
    let seq = 0, firstPaint = true;
    const ctx = { all, sections: opt.sections };

    async function onChange(sido, sgg) {
      const my = ++seq;
      let data = cache[sido];
      if (!data) {
        try { data = cache[sido] = await getJSON(`data/dash-${opt.kind}-${sido}.json`); }
        catch (e) { fail('데이터 로딩 실패 — 잠시 뒤 다시 열어 주세요'); console.error(e); return; }
      }
      if (my !== seq) return;   // 그 사이 다른 지역을 골랐다
      Object.assign(ctx, { data, sido, sgg, region: data.regions[sgg] || data.regions[''] });
      ctx.regionName = sgg ? `${data.sido.name} ${ctx.region.name}` : ctx.region.name;
      render();
      if (firstPaint) {
        firstPaint = false;
        const gen = document.getElementById('genDate');
        if (gen) gen.textContent = `생성일: ${data.generated.slice(0, 10)}`;
        // #price 같은 해시로 열면 렌더가 끝난 뒤 그 섹션으로 (높이가 바뀌므로 렌더 후에 해야 한다)
        const target = location.hash && document.getElementById(location.hash.slice(1));
        if (target && target.classList.contains('dsec')) target.scrollIntoView();
      }
    }

    function render() {
      const cr = document.getElementById('curRegion');
      if (cr) cr.textContent = ctx.regionName;
      for (const sec of document.querySelectorAll('.dsec')) {
        const fn = opt.sections[sec.id];
        const body = sec.querySelector('.dsec-body');
        if (!fn) { if (body && !body.dataset.pending) { body.dataset.pending = 1; body.innerHTML = '<div class="pending">준비 중입니다</div>'; } continue; }
        try { fn(ctx, sec); }
        catch (e) { console.error(`섹션 ${sec.id} 렌더 오류`, e); }
      }
    }
    ctx.rerender = render;
    ctx.select = (sido, sgg) => RegionSelect.select(sido, sgg);

    RegionSelect.init({
      container: '#regionBar',
      sidos: all.sido.map(s => ({ code: s.code, name: s.name })),
      sggOf: sido => (all.sido.find(s => s.code === sido) || {}).sgg || [],
      defaultSido: '11',
      onChange,
    });
  }

  window.Dash = { start, fmt, eok, signPct, ymText, esc, yearLabel, isImmature, cards, toneOf, chips, chart, bandDatasets, legendFilter, barColors, rankBars, monthLabel, histLabels, table, compare, cmpHTML, complexName, complexClick, getType, setType, isMobile };
})();
