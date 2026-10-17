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

  window.Dash = { start, fmt, eok, signPct, ymText, esc, yearLabel, isImmature, cards, toneOf, chips, chart, bandDatasets, legendFilter, barColors, rankBars, monthLabel, isMobile };
})();
