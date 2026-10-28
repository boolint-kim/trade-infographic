// 물건별 대시보드 섹션 렌더러 — apt·office·multi·right.html 이 같이 쓴다 (dash.js 다음에 로드)
// 정본: ~/server/trade-collector/docs/infographic-redesign/02-apt.md(섹션 스펙) · 03(물건별 차이)
// 사용:
//   DashSections.setAccent('#06b6d4');
//   Dash.start({ kind: 'office', sections: DashSections.pick('price', 'volume', 'jeonse', 'yield', 'wolse') });
// price 섹션은 페이지에 껍데기(#priceChips·#priceCards·#priceChart·#cmp* 등)가 있어야 한다 — apt.html 의 <section id="price"> 를 복사
// 나머지 섹션은 <section class="dsec" id="volume"><div class="dsec-head">…</div><div class="dsec-body"></div></section> 만 있으면 스스로 채운다

(function () {
let ACCENT = '#6366f1';
const D = Dash;

// ─── price (02 E2) ─────────────────────────────────────────
function renderPrice(ctx, sec) {
  const { data, region, all } = ctx;
  const facets = data.facets.size;
  const f = D.chips(document.getElementById('priceChips'), 'size', facets, () => renderPrice(ctx, sec));
  const p = region.price;
  const fl = f === 'all' ? '' : ` · ${facets[f]}`;
  const ytd = data.ytd;

  // 카드 3장 — 최근 완결 12개월 / 전년 동기(완결 월) / 10년 상승률(완결연도)
  const rc = p.recent.by[f], yc = p.ytd[f], rs = p.rise[f];
  D.cards(document.getElementById('priceCards'), [
    { label: `최근 12개월 평당가 중앙값${fl}`, value: rc.med == null ? null : D.fmt(rc.med), unit: '만원/평',
      tone: rc.med == null ? 'na' : '',
      sub: rc.med == null ? `${D.ymText(p.recent.from)}~${D.ymText(p.recent.to)} · ${D.fmt(rc.cnt)}건`
        : `가운데 50%: ${D.fmt(rc.p25)}~${D.fmt(rc.p75)}<br>${D.ymText(p.recent.from)}~${D.ymText(p.recent.to)} · ${D.fmt(rc.cnt)}건 · 거래가 중앙값 ${D.eok(rc.amt)}` },
    yc ? { label: `전년 동기 대비 (1~${ytd.cmpThruMonth}월)`, value: yc.pct == null ? null : D.signPct(yc.pct), unit: '%', tone: D.toneOf(yc.pct),
      sub: yc.pct == null ? '비교할 거래가 부족합니다'
        : `${ytd.yr - 1}년 ${D.fmt(yc.prev.med)} → ${ytd.yr}년 ${D.fmt(yc.cur.med)} 만원/평<br>거래 ${D.fmt(yc.prev.cnt)} → ${D.fmt(yc.cur.cnt)}건 (신고 중인 최근 ${data.immature.length}개월 제외)` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '연초에는 비교할 완결 월이 없습니다' },
    { label: rs ? `${rs.from}→${rs.to} 상승률` : '장기 상승률', value: rs ? D.signPct(rs.pct) : null, unit: '%', tone: rs ? D.toneOf(rs.pct) : 'na',
      sub: rs ? `${D.fmt(rs.fromMed)} → ${D.fmt(rs.toMed)} 만원/평<br>완결 연도끼리 · 거래 30건 이상인 첫 해 기준` : '거래 30건 이상인 해가 부족합니다' },
  ]);

  // 연도 콤보 — 막대 거래량 + 중앙값 선 + p25~p75 띠
  const cells = p.by[f];
  const labels = p.years.map(y => D.yearLabel(y, ytd));
  const partial = y => y === ytd.yr;
  document.getElementById('priceTitle').textContent = `${ctx.regionName}${fl} — 연도별 평당가 + 거래량`;
  D.chart('priceChart', {
    type: 'bar',
    data: { labels, datasets: [
      ...D.bandDatasets({ label: '평당가 중앙값(만원/평)', color: ACCENT,
        med: cells.map(c => c.med ?? null), p25: cells.map(c => c.p25 ?? null), p75: cells.map(c => c.p75 ?? null) }),
      { type: 'bar', label: '거래 건수', data: cells.map(c => c.cnt), yAxisID: 'y1', order: 2, borderRadius: 4,
        backgroundColor: D.barColors(p.years, partial, ACCENT) },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14, filter: D.legendFilter } },
        tooltip: { filter: it => !it.dataset.label.startsWith('_'), callbacks: {
          label: it => it.dataset.yAxisID === 'y1' ? `거래 ${D.fmt(it.raw)}건`
            : `중앙값 ${D.fmt(it.raw)}만원/평`,
          afterBody: items => { const c = cells[items[0].dataIndex]; return c.med == null ? ['표본 부족(5건 미만)']
            : [`가운데 50%: ${D.fmt(c.p25)}~${D.fmt(c.p75)}`, `거래가 중앙값 ${D.eok(c.amt)}`]; } } } },
      scales: { x: { grid: { display: false } },
        y: { position: 'left', ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() }, title: { display: !D.isMobile, text: '만원/평' } },
        y1: { position: 'right', ticks: { callback: v => D.fmt(v) }, grid: { display: false } } } },
  });
  document.getElementById('priceNote').innerHTML =
    `<b>${D.yearLabel(ytd.yr, ytd)}</b> 막대(회색)는 아직 한 해가 끝나지 않았고, 최근 ${data.immature.length}개월(${data.immature.map(D.ymText).join('·')})은 신고가 계속 들어오는 중입니다 — 건수가 적어 보이는 건 하락이 아닙니다.`;

  renderCompare(ctx, f);
}

// 비교 막대 — 시도 안 시군구 / 전국 시도 (최근 완결 12개월 평당가 중앙값)
function renderCompare(ctx, f) {
  const { data, all, sido, sgg } = ctx;
  const facets = data.facets.size;
  const sggCount = Object.keys(data.regions).length - 1;
  const modes = sggCount > 1 ? { sgg: '시군구', sido: '시도' } : { sido: '시도' };
  const mode = D.chips(document.getElementById('cmpChips'), 'cmp', modes, () => renderCompare(ctx, f));
  const fl = f === 'all' ? '' : ` · ${facets[f]}`;
  const recent = data.regions[''].price.recent;

  let rows;
  if (mode === 'sgg') {
    rows = Object.entries(data.regions).filter(([k]) => k)
      .map(([k, r]) => ({ key: k, name: r.name, med: r.price.recent.by[f].med, cnt: r.price.recent.by[f].cnt, on: k === sgg }));
    document.getElementById('cmpTitle').textContent = `${data.sido.name} 시군구 비교${fl}`;
  } else {
    rows = all.sido.map(s => ({ key: s.code, name: s.name, med: s.price[f].med, cnt: s.price[f].cnt, on: s.code === sido }));
    document.getElementById('cmpTitle').textContent = `전국 시도 비교${fl}`;
  }
  rows = rows.filter(r => r.med != null).sort((a, b) => b.med - a.med);
  const rank = rows.findIndex(r => r.on);
  document.getElementById('cmpDesc').textContent =
    `${D.ymText(recent.from)}~${D.ymText(recent.to)} 평당가 중앙값 · 거래 5건 미만 지역은 뺐습니다`
    + (rank >= 0 ? ` · ${rows[rank].name} ${rank + 1}위 / ${rows.length}` : '')
    + (mode === 'sgg' ? ' · 막대를 누르면 그 시군구로 바뀝니다' : ' · 막대를 누르면 그 시도로 바뀝니다');

  D.rankBars('cmpChart', 'cmpWrap', rows.map(r => ({ ...r, value: r.med, tip: `${D.fmt(r.med)}만원/평 · ${D.fmt(r.cnt)}건` })), {
    color: ACCENT, onClick: r => mode === 'sgg' ? ctx.select(sido, r.key) : ctx.select(r.key, ''),
  });
}

// ─── volume (02 E5) ────────────────────────────────────────
function renderVolume(ctx, sec) {
  const { data, region } = ctx;
  const ytd = data.ytd;
  const body = sec.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="chips" id="volChips" style="margin-bottom:12px"></div>
      <div class="cards" id="volCards"></div>
      <div class="sub-title" id="volMTitle">월별 거래량</div>
      <div class="sub-desc">막대 = 계약월 기준 건수, 선 = 1년 전 같은 달 · 회색 테두리 막대는 신고가 아직 들어오는 중인 달</div>
      <div class="chart-wrap" style="height:300px"><canvas id="volMChart"></canvas></div>
      <div class="sub-title">연도별 거래량</div>
      <div class="sub-desc" id="volYDesc"></div>
      <div class="chart-wrap" style="height:260px"><canvas id="volYChart"></canvas></div>
      <div class="sub-title" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <span id="volCmpTitle">비교</span><span id="volCmpChips"></span></div>
      <div class="sub-desc" id="volCmpDesc"></div>
      <div class="chart-wrap" id="volCmpWrap" style="height:360px"><canvas id="volCmpChart"></canvas></div>`;
  }
  // 계열이 여럿이면(토지 지목·지분, 건물 일반·집합) 칩으로 고른다
  const vf = region.volume.by ? D.chips(document.getElementById('volChips'), 'vol', data.facets.volume, () => renderVolume(ctx, sec)) : null;
  if (!vf) document.getElementById('volChips').innerHTML = '';
  const v = vf ? region.volume.by[vf] : region.volume;
  const imm = m => D.isImmature(m, data);
  const ytdLabel = ytd.cmpThruMonth ? `1~${ytd.cmpThruMonth}월` : '';

  // 카드 — 전년 동기 / 최근 완결 월 vs 1년 전 / 최다 거래월(완결 월 중)
  const done = v.months.map((m, i) => ({ m, c: v.cnt[i], p: v.prev[i] })).filter(x => !imm(x.m));
  const last = done[done.length - 1];
  const top = done.reduce((a, b) => b.c > a.c ? b : a, done[0]);
  const lastPct = last && last.p > 0 ? Math.round((last.c - last.p) / last.p * 1000) / 10 : null;
  D.cards(document.getElementById('volCards'), [
    v.ytd ? { label: `전년 동기 대비 (${ytdLabel})`, value: v.ytd.pct == null ? null : D.signPct(v.ytd.pct), unit: '%', tone: D.toneOf(v.ytd.pct),
      sub: `${ytd.yr - 1}년 ${D.fmt(v.ytd.prev)}건 → ${ytd.yr}년 ${D.fmt(v.ytd.cur)}건<br>신고 중인 최근 ${data.immature.length}개월은 빼고 비교` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '연초에는 비교할 완결 월이 없습니다' },
    { label: last ? `${D.ymText(last.m)} (최근 완결 월)` : '최근 완결 월', value: last ? D.fmt(last.c) : null, unit: '건', tone: '',
      sub: last ? `1년 전 같은 달 ${D.fmt(last.p)}건${lastPct == null ? '' : ` · ${D.signPct(lastPct)}%`}` : '' },
    { label: '최근 24개월 최다 거래월', value: top ? D.fmt(top.c) : null, unit: '건', tone: '',
      sub: top ? `${D.ymText(top.m)} · 완결 월 중에서` : '' },
  ]);

  // 월별 — 미완 월 회색 + 테두리, 전년 같은 달 선(미완 월에서 끊는다)
  document.getElementById('volMTitle').textContent = `${ctx.regionName} — 월별 거래량 (최근 24개월)`;
  D.chart('volMChart', {
    type: 'bar',
    data: { labels: v.months.map(D.monthLabel), datasets: [
      { type: 'line', label: '1년 전 같은 달', data: v.months.map((m, i) => imm(m) ? null : v.prev[i]), borderColor: '#f59e0b', backgroundColor: '#f59e0b',
        borderWidth: 2, borderDash: [5, 4], pointRadius: 2, tension: .3, spanGaps: false, order: 1 },
      { type: 'bar', label: '거래 건수', data: v.cnt, order: 2, borderRadius: 3,
        backgroundColor: D.barColors(v.months, imm, ACCENT),
        borderColor: v.months.map(m => imm(m) ? chartTheme.axis() : 'transparent'), borderWidth: v.months.map(m => imm(m) ? 1 : 0) },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14 } },
        tooltip: { callbacks: { label: it => `${it.dataset.label} ${D.fmt(it.raw)}건`,
          footer: items => imm(v.months[items[0].dataIndex]) ? '집계 중 — 신고는 계약 후 30일 안에 들어옵니다' : '' } } },
      scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 6 } },
        y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } } } },
  });

  // 연도별 — 올해는 완결 월(색) + 신고 중(회색)을 쌓고, 뒤에 작년 같은 기간을 테두리 상자로 (Chart.js 막대는 점선 테두리 미지원)
  const n = v.years.length, curDone = v.ytd ? v.ytd.cur : 0;
  const isCur = i => v.years[i] === ytd.yr;
  document.getElementById('volYDesc').textContent = v.ytd
    ? `${D.yearLabel(ytd.yr, ytd)}: 진한 부분 = ${ytdLabel}(완결), 회색 = 신고 중인 최근 ${data.immature.length}개월, 테두리 상자 = ${ytd.yr - 1}년 ${ytdLabel}`
    : `${D.yearLabel(ytd.yr, ytd)} 은 아직 한 해가 끝나지 않았습니다`;
  D.chart('volYChart', {
    type: 'bar',
    data: { labels: v.years.map(y => D.yearLabel(y, ytd)), datasets: [
      { label: '거래 건수', data: v.yearly.map((c, i) => isCur(i) && v.ytd ? curDone : c), backgroundColor: ACCENT + '88', borderRadius: 3, stack: 'a', order: 1 },
      { label: '_신고 중', data: v.yearly.map((c, i) => isCur(i) ? (v.ytd ? c - curDone : c) : null), backgroundColor: chartTheme.muted(), borderRadius: 3, stack: 'a', order: 1 },
      { label: '_작년 같은 기간', data: v.years.map((y, i) => isCur(i) && v.ytd ? v.ytd.prev : null), grouped: false, stack: 'g', order: 2,
        backgroundColor: 'transparent', borderColor: chartTheme.axis(), borderWidth: 1.5, barPercentage: 1 },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { filter: it => it.raw != null, callbacks: {
        label: it => it.datasetIndex === 0 ? `${isCur(it.dataIndex) && v.ytd ? ytdLabel + ' ' : ''}${D.fmt(it.raw)}건`
          : it.datasetIndex === 1 ? `신고 중 ${D.fmt(it.raw)}건` : `${ytd.yr - 1}년 ${ytdLabel} ${D.fmt(it.raw)}건` } } },
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } } } },
  });

  renderVolumeCompare(ctx, vf);
}

// 비교 — 시군구/시도별 전년 동기 거래량 증감 (작년 30건 미만은 뺀다 — 몇 건 차이가 수십 %가 된다)
function renderVolumeCompare(ctx, vf) {
  const { data, all, sido, sgg } = ctx;
  const ytd = data.ytd;
  const sggCount = Object.keys(data.regions).length - 1;
  const modes = sggCount > 1 ? { sgg: '시군구', sido: '시도' } : { sido: '시도' };
  const mode = D.chips(document.getElementById('volCmpChips'), 'volCmp', modes, () => renderVolumeCompare(ctx, vf));
  let rows = mode === 'sgg'
    ? Object.entries(data.regions).filter(([k]) => k).map(([k, r]) => ({ key: k, name: r.name, y: vf ? r.volume.by[vf].ytd : r.volume.ytd, on: k === sgg }))
    : all.sido.map(s => ({ key: s.code, name: s.name, y: vf ? (s.volumeBy || {})[vf] : s.volume, on: s.code === sido }));
  rows = rows.filter(r => r.y && r.y.prev >= 30 && r.y.pct != null)
    .map(r => ({ ...r, value: r.y.pct, tip: `${D.signPct(r.y.pct)}% · ${D.fmt(r.y.prev)} → ${D.fmt(r.y.cur)}건` }))
    .sort((a, b) => b.value - a.value);
  const rank = rows.findIndex(r => r.on);
  const vl = vf ? ` · ${data.facets.volume[vf]}` : '';
  document.getElementById('volCmpTitle').textContent = (mode === 'sgg' ? `${data.sido.name} 시군구 거래량 증감` : '전국 시도 거래량 증감') + vl;
  document.getElementById('volCmpDesc').textContent = !ytd.cmpThruMonth ? '연초에는 비교할 완결 월이 없습니다'
    : `${ytd.yr}년 1~${ytd.cmpThruMonth}월 vs ${ytd.yr - 1}년 같은 기간 · 작년 30건 미만 지역은 뺐습니다`
      + (rank >= 0 ? ` · ${rows[rank].name} ${rank + 1}위 / ${rows.length}` : '');
  D.rankBars('volCmpChart', 'volCmpWrap', rows, { color: ACCENT, tick: v => `${v > 0 ? '+' : ''}${Math.round(v)}%`,
    onClick: r => mode === 'sgg' ? ctx.select(sido, r.key) : ctx.select(r.key, '') });
}


// 공용 블록은 dash.js 로 (특화 페이지도 쓴다)
const compareBlock = (ctx, prefix, o) => D.compare(ctx, prefix, { color: ACCENT, ...o });
const cmpHTML = D.cmpHTML;
const aptName = D.complexName;
// 연도 추이 라벨 — 올해는 완결 월까지만 들어 있다
const matchYearLabel = (y, ytd) => y === ytd.yr ? `${y}(1~${ytd.cmpThruMonth}월)` : y;

// 히스토그램 + 연도 추이 (jeonse·yield 공통)
function histAndTrend(ctx, prefix, sec, { unit, digits, colorOf, refLine }) {
  const { data } = ctx;
  D.chart(`${prefix}Hist`, {
    type: 'bar',
    data: { labels: D.histLabels(sec.edges, unit), datasets: [{ data: sec.hist, borderRadius: 3, backgroundColor: sec.hist.map((_, i) => colorOf(i)) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: it => `${D.fmt(it.raw)}개 (${sec.pairs ? Math.round(it.raw / sec.pairs * 100) : 0}%)` } } },
      scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false, font: { size: D.isMobile ? 9 : 11 } } },
        y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() }, title: { display: !D.isMobile, text: '단지·면적 짝 수' } } } },
  });
  const ds = [{ type: 'line', label: '중앙값', data: sec.trend.map(t => t.med), borderColor: ACCENT, backgroundColor: ACCENT, borderWidth: 3, tension: .3,
    pointRadius: 4, pointBorderColor: chartTheme.pointBorder(), pointBorderWidth: 2, spanGaps: false }];
  if (refLine) ds.push({ type: 'line', label: refLine.label, data: sec.years.map(() => refLine.value), borderColor: '#ef4444', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 });
  D.chart(`${prefix}Trend`, {
    type: 'line',
    data: { labels: sec.years.map(y => matchYearLabel(y, data.ytd)), datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: !!refLine, position: 'top', labels: { usePointStyle: true } },
        tooltip: { callbacks: { label: it => it.datasetIndex === 0 ? `중앙값 ${it.raw == null ? '표본 부족' : it.raw.toFixed(digits) + unit} · 짝 ${D.fmt(sec.trend[it.dataIndex].pairs)}개` : `${refLine.label}` } } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => +v.toFixed(digits) + unit }, grid: { color: chartTheme.grid() } } } },
  });
}

// ─── jeonse (02 E4) ────────────────────────────────────────
function renderJeonse(ctx, secEl) {
  const { data, region } = ctx;
  const j = region.jeonse;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="jeCards"></div>
      <div class="grid2">
        <div><div class="sub-title">전세가율 분포</div><div class="sub-desc" id="jeHistDesc"></div>
          <div class="chart-wrap" style="height:240px"><canvas id="jeHist"></canvas></div></div>
        <div><div class="sub-title">연도별 중앙값</div><div class="sub-desc">그 해 안에서 매매·전세가 각 3건 이상인 짝 · 2021년 전월세 신고제 이후</div>
          <div class="chart-wrap" style="height:240px"><canvas id="jeTrend"></canvas></div></div>
      </div>
      <div class="sub-title">전세가율 80% 이상 — 매매가에 비해 전세가 높은 단지</div>
      <div class="sub-desc">집값이 조금만 내려도 보증금을 돌려받기 어려울 수 있는 곳(이른바 깡통전세 후보). 높은 순 최대 20개</div>
      <div id="jeHigh"></div>
      <div class="sub-title">전세가율 60% 이하 — 매매가와 전세가 차이가 큰 단지</div>
      <div class="sub-desc">매매에 기대가격(재건축·입지)이 붙은 곳이 많습니다. 낮은 순 최대 20개</div>
      <div id="jeLow"></div>
      ${cmpHTML('je')}
      <div class="note">전세 = 월세 0원인 계약(신규·갱신 모두). 매매는 계약 해제 신고된 거래 제외. 같은 단지라도 전용면적(㎡, 반올림)이 다르면 다른 짝입니다.
        지역 평균끼리 나누는 방식은 매매와 전세가 서로 다른 집이라 쓰지 않습니다.</div>`;
  }
  const period = `${D.ymText(j.from)}~${D.ymText(j.to)}`;
  D.cards(document.getElementById('jeCards'), [
    { label: '전세가율 중앙값 (최근 6개월)', value: j.med == null ? null : j.med.toFixed(1), unit: '%',
      sub: j.med == null ? `짝 ${j.pairs}개 — 5개 미만` : `가운데 50%: ${j.p25.toFixed(1)}~${j.p75.toFixed(1)}%<br>${period} · 단지·면적 짝 ${D.fmt(j.pairs)}개` },
    { label: '80% 이상 짝', value: j.pairs ? D.fmt(j.highCnt) : null, unit: '개', tone: j.highCnt ? 'up' : '',
      sub: j.pairs ? `전체 짝의 ${Math.round(j.highCnt / j.pairs * 100)}%` : '' },
    { label: '60% 이하 짝', value: j.pairs ? D.fmt(j.lowCnt) : null, unit: '개', tone: j.lowCnt ? 'down' : '',
      sub: j.pairs ? `전체 짝의 ${Math.round(j.lowCnt / j.pairs * 100)}%` : '' },
  ]);
  document.getElementById('jeHistDesc').textContent = `${period} · 같은 단지·같은 면적에서 매매 3건 이상, 전세 3건 이상인 짝`;
  // 구간 색: 60 미만 파랑, 80 이상 빨강
  histAndTrend(ctx, 'je', j, { unit: '%', digits: 1,
    colorOf: i => { const lo = i === 0 ? -1 : j.edges[i - 1]; return lo >= 80 ? '#ef4444cc' : (i < j.edges.length && j.edges[i] <= 60) ? '#3b82f6aa' : ACCENT + '77'; } });

  const cols = cls => [
    { label: '#', cls: 'num faint', get: (x, i) => i + 1 },
    { label: '단지', cls: 'name', get: x => aptName(ctx, x) },
    { label: '전세가율', cls: `num ${cls}`, get: x => `${x.r.toFixed(1)}%` },
    { label: '매매 중앙값', cls: 'num', get: x => `${D.eok(x.s)}<div class="faint">${x.sc}건</div>` },
    { label: '전세 중앙값', cls: 'num', get: x => `${D.eok(x.j)}<div class="faint">${x.jc}건</div>` },
  ];
  D.table(document.getElementById('jeHigh'), cols('hi'), j.high, '80% 이상인 짝이 없습니다');
  D.table(document.getElementById('jeLow'), cols('lo'), j.low, '60% 이하인 짝이 없습니다');

  compareBlock(ctx, 'je', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 전세가율` : '전국 시도 전세가율',
    desc: `${period} 짝들의 중앙값 · 짝 5개 미만 지역은 뺐습니다`,
    pickSgg: r => r.jeonse.med == null ? null : { value: r.jeonse.med, tip: `${r.jeonse.med.toFixed(1)}% · 짝 ${D.fmt(r.jeonse.pairs)}개` },
    pickSido: s => s.jeonse.med == null ? null : { value: s.jeonse.med, tip: `${s.jeonse.med.toFixed(1)}% · 짝 ${D.fmt(s.jeonse.pairs)}개` },
    tick: v => `${v}%`,
  });
}

// ─── yield (02 P8) ─────────────────────────────────────────
function renderYield(ctx, secEl) {
  const { data, region } = ctx;
  const y = region.yield, base = data.baseRate;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="yiCards"></div>
      <div class="grid2">
        <div><div class="sub-title">수익률 분포</div><div class="sub-desc" id="yiHistDesc"></div>
          <div class="chart-wrap" style="height:240px"><canvas id="yiHist"></canvas></div></div>
        <div><div class="sub-title">연도별 중앙값</div><div class="sub-desc" id="yiTrendDesc"></div>
          <div class="chart-wrap" style="height:240px"><canvas id="yiTrend"></canvas></div></div>
      </div>
      <div class="sub-title">수익률 높은 단지 TOP 20</div>
      <div class="sub-desc">보증금이 매매가의 절반을 넘는 짝은 뺐습니다 — 실투자금이 작아 수익률이 부풀려집니다</div>
      <div id="yiTop"></div>
      ${cmpHTML('yi')}
      <div class="note">수익률(캡레이트) = 월세 중앙값 × 12 ÷ (매매가 중앙값 − 월세 보증금 중앙값). 같은 단지·같은 전용면적에서 최근 12개월 매매 3건 이상, 월세 3건 이상인 짝만.
        세금·관리비·공실·대출이자는 빼지 않은 값입니다. 기준금리는 한국은행 발표값${base == null ? '' : `(${data.baseRateAsOf} 결정)`}.</div>`;
  }
  const period = `${D.ymText(y.from)}~${D.ymText(y.to)}`;
  const gap = y.med != null && base != null ? Math.round((y.med - base) * 100) / 100 : null;
  D.cards(document.getElementById('yiCards'), [
    { label: '임대수익률 중앙값 (최근 12개월)', value: y.med == null ? null : y.med.toFixed(2), unit: '%',
      sub: y.med == null ? `짝 ${y.pairs}개 — 5개 미만` : `가운데 50%: ${y.p25.toFixed(2)}~${y.p75.toFixed(2)}%<br>${period} · 단지·면적 짝 ${D.fmt(y.pairs)}개` },
    { label: base == null ? '기준금리와 비교' : `기준금리 ${base.toFixed(2)}% 대비`, value: gap == null ? null : `${gap > 0 ? '+' : ''}${gap.toFixed(2)}`, unit: '%p',
      tone: gap == null ? 'na' : gap > 0 ? 'up' : 'down', sub: gap == null ? '' : gap > 0 ? '중앙값이 기준금리보다 높습니다' : '중앙값이 기준금리보다 낮습니다' },
    { label: '기준금리보다 높은 짝', value: y.aboveBase == null || !y.pairs ? null : D.fmt(y.aboveBase), unit: '개', tone: '',
      sub: y.pairs && y.aboveBase != null ? `전체 짝의 ${Math.round(y.aboveBase / y.pairs * 100)}%` : '' },
  ]);
  document.getElementById('yiHistDesc').textContent = `${period} · 단지·면적 짝 ${D.fmt(y.pairs)}개`;
  document.getElementById('yiTrendDesc').textContent = base == null ? '그 해 안에서 매매·월세 각 3건 이상인 짝'
    : `그 해 안에서 매매·월세 각 3건 이상인 짝 · 빨간 점선 = 지금 기준금리(과거 금리 아님)`;
  histAndTrend(ctx, 'yi', y, { unit: '%', digits: 2,
    colorOf: i => { const lo = i === 0 ? -1 : y.edges[i - 1]; return base != null && lo >= base ? '#10b981bb' : ACCENT + '77'; },
    refLine: base == null ? null : { label: `기준금리 ${base}%`, value: base } });

  D.table(document.getElementById('yiTop'), [
    { label: '#', cls: 'num faint', get: (x, i) => i + 1 },
    { label: '단지', cls: 'name', get: x => aptName(ctx, x) },
    { label: '수익률', cls: 'num hi', get: x => `${x.y.toFixed(2)}%` },
    { label: '매매 중앙값', cls: 'num', get: x => `${D.eok(x.s)}<div class="faint">${x.sc}건</div>` },
    { label: '보증금 / 월세', cls: 'num', get: x => `${D.eok(x.dep)} / ${D.fmt(x.rent)}만<div class="faint">${x.wc}건</div>` },
  ], y.top, '조건에 맞는 짝이 없습니다');

  compareBlock(ctx, 'yi', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 임대수익률` : '전국 시도 임대수익률',
    desc: `${period} 짝들의 중앙값 · 짝 5개 미만 지역은 뺐습니다`,
    pickSgg: r => r.yield.med == null ? null : { value: r.yield.med, tip: `${r.yield.med.toFixed(2)}% · 짝 ${D.fmt(r.yield.pairs)}개` },
    pickSido: s => s.yield.med == null ? null : { value: s.yield.med, tip: `${s.yield.med.toFixed(2)}% · 짝 ${D.fmt(s.yield.pairs)}개` },
    tick: v => `${v}%`,
  });
}


// ─── wolse (02 P2) ─────────────────────────────────────────
function renderWolse(ctx, secEl) {
  const { data, region } = ctx;
  const w = region.wolse, ytd = data.ytd;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="woCards"></div>
      <div class="sub-title" id="woTitle">연도별 전세·월세 건수와 월세 비중</div>
      <div class="sub-desc">막대 = 계약 건수(전세 + 월세 쌓기), 선 = 월세 비중 · 2021년 6월 전월세 신고제 전후로 자료 출처가 달라 그 앞뒤를 바로 비교할 때는 주의</div>
      <div class="chart-wrap" style="height:300px"><canvas id="woChart"></canvas></div>
      ${cmpHTML('wo')}
      <div class="note">전세 = 월세 0원·보증금 있는 계약, 월세 = 월세가 있는 계약(반전세 포함). 신규·갱신 모두.
        ${w.conv ? '시장 전환율 = 같은 단지·같은 면적·같은 달의 전세 보증금 중앙값과 월세 계약을 짝지어 월세 × 12 ÷ (전세 − 월세 보증금). 1% 미만·20% 초과와 보증금이 전세의 80%를 넘는 월세는 뺐습니다.' : ''}
        법정 전환율(전월세 전환 상한) = 기준금리 + 2%p.</div>`;
  }
  const r = w.recent, cv = w.conv;
  const period = `${D.ymText(r.from)}~${D.ymText(r.to)}`;
  // 전환율 — 시군구 표본 부족이면 시도 값, 그것도 없으면 법정
  const sidoConv = cv ? data.regions[''].wolse.conv.rate : null;
  const conv = cv ? (cv.rate ?? sidoConv ?? data.legalRate) : null;
  const convSrc = !cv ? '' : cv.rate != null ? `표본 ${D.fmt(cv.n)}건` : sidoConv != null ? `표본 ${D.fmt(cv.n)}건이라 ${data.sido.name} 전체 값` : '표본 부족 — 법정 전환율';
  D.cards(document.getElementById('woCards'), [
    { label: '월세 비중 (최근 12개월)', value: r.share == null ? null : r.share.toFixed(1), unit: '%',
      sub: `${period}<br>전세 ${D.fmt(r.j)}건 · 월세 ${D.fmt(r.w)}건` },
    w.ytd ? { label: `전년 동기 대비 (1~${ytd.cmpThruMonth}월)`, value: w.ytd.diff == null ? null : `${w.ytd.diff > 0 ? '+' : ''}${w.ytd.diff.toFixed(1)}`, unit: '%p',
      tone: D.toneOf(w.ytd.diff), sub: w.ytd.diff == null ? '' : `${ytd.yr - 1}년 ${w.ytd.prev.share.toFixed(1)}% → ${ytd.yr}년 ${w.ytd.cur.share.toFixed(1)}%` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '연초에는 비교할 완결 월이 없습니다' },
    cv ? { label: '시장 전환율 (최근 6개월)', value: conv == null ? null : conv.toFixed(2), unit: '%',
      sub: `${convSrc} · ${D.ymText(cv.from)}~${D.ymText(cv.to)}${data.legalRate != null ? `<br>법정 상한 ${data.legalRate}% (기준금리 ${data.baseRate}% + 2%p)` : ''}` }
      : { label: '법정 전환율 상한', value: data.legalRate == null ? null : data.legalRate.toFixed(2), unit: '%',
        sub: `기준금리 ${data.baseRate}% + 2%p<br>단지 구분이 없어 시장 전환율은 계산하지 않습니다` },
    { label: `월세 계약 중앙값${r.wolseOf ? ` (${r.wolseOf})` : ''}`, value: r.wolseRent == null ? null : `${D.eok(r.wolseDep)} / ${D.fmt(r.wolseRent)}만`, unit: '',
      sub: r.jeonseDep == null ? period : `보증금 / 월세 · 전세 보증금 중앙값 ${D.eok(r.jeonseDep)}<br>${period}` },
  ]);

  document.getElementById('woTitle').textContent = `${ctx.regionName} — 연도별 전세·월세 건수와 월세 비중`;
  const partial = i => w.years[i] === ytd.yr;
  D.chart('woChart', {
    type: 'bar',
    data: { labels: w.years.map(y => data.rentBreak && y === data.rentBreak.slice(0, 4) ? `${y}(신고제)` : D.yearLabel(y, ytd)), datasets: [
      { type: 'line', label: '월세 비중(%)', data: w.yearly.map(c => c.share), yAxisID: 'y1', borderColor: '#f97316', backgroundColor: '#f97316',
        borderWidth: 3, tension: .3, pointRadius: 4, pointBorderColor: chartTheme.pointBorder(), pointBorderWidth: 2, order: 1 },
      { label: '전세', data: w.yearly.map(c => c.j), stack: 's', order: 2, borderRadius: 3, backgroundColor: w.years.map((_, i) => partial(i) ? chartTheme.muted() : '#3b82f677') },
      { label: '월세', data: w.yearly.map(c => c.w), stack: 's', order: 2, borderRadius: 3, backgroundColor: w.years.map((_, i) => partial(i) ? chartTheme.muted() : '#f9731677') },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14 } },
        tooltip: { callbacks: { label: it => it.dataset.yAxisID === 'y1' ? `월세 비중 ${it.raw ?? '-'}%` : `${it.dataset.label} ${D.fmt(it.raw)}건` } } },
      scales: { x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } },
        y1: { position: 'right', min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } } } },
  });

  compareBlock(ctx, 'wo', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 월세 비중` : '전국 시도 월세 비중',
    desc: `${period} · 전월세 100건 미만 지역은 뺐습니다`,
    pickSgg: x => { const q = x.wolse.recent; return q.share == null || q.j + q.w < 100 ? null : { value: q.share, tip: `${q.share}% · 전세 ${D.fmt(q.j)} / 월세 ${D.fmt(q.w)}건` }; },
    pickSido: x => x.wolse.share == null ? null : { value: x.wolse.share, tip: `${x.wolse.share}% · 월세 ${D.fmt(x.wolse.w)}건 · 전환율 ${x.wolse.conv ?? '-'}%` },
    tick: v => `${v}%`,
  });
}


const AGE_COLORS = { n5: '#10b981', n10: '#06b6d4', n20: '#6366f1', n30: '#f59e0b', o30: '#ef4444' };
const SIZE_COLORS = { s: '#06b6d4', m: '#6366f1', l: '#f59e0b', xl: '#ef4444' };
const RATIO_MIN = 30;   // 배율 비교는 두 구간 모두 30건 이상인 지역만 — 몇 건짜리 단지 하나가 배율을 뒤집는다
const times = v => v == null ? '-' : `×${v.toFixed(2)}`;
const okCell = c => c && c.med != null && c.cnt >= RATIO_MIN;

// ─── age (02 P9) ───────────────────────────────────────────
function renderAge(ctx, secEl) {
  const { data, region } = ctx;
  const a = region.age, groups = data.facets.age, ytd = data.ytd;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="agCards"></div>
      <div class="grid2">
        <div><div class="sub-title">연식별 평당가 (최근 12개월)</div><div class="sub-desc" id="agBarDesc"></div>
          <div class="chart-wrap" style="height:260px"><canvas id="agBar"></canvas></div></div>
        <div><div class="sub-title">연식별 평당가 추이</div><div class="sub-desc">연도별 중앙값 · 5건 미만인 해는 비움</div>
          <div class="chart-wrap" style="height:260px"><canvas id="agTrend"></canvas></div></div>
      </div>
      ${cmpHTML('ag')}
      <div class="note">연식 = 계약연도 − 준공연도. 재건축 프리미엄 = 30년 초과 ÷ 11~20년 평당가 중앙값 — 1보다 크면 오래된 아파트가 오히려 비싸게 거래된다는 뜻(재건축 기대).
        신축 프리미엄 = 5년 이내 ÷ 30년 초과. 배율은 두 구간 모두 ${RATIO_MIN}건 이상일 때만 냅니다.</div>`;
  }
  const r = a.recent, period = `${D.ymText(a.from)}~${D.ymText(a.to)}`;
  const reb = okCell(r.o30) && okCell(r.n20) ? a.rebuild : null;
  const neu = okCell(r.n5) && okCell(r.o30) ? a.newPrem : null;
  // 시도 안에서 재건축 프리미엄이 가장 큰 시군구
  const cand = Object.entries(data.regions).filter(([k, x]) => k && okCell(x.age.recent.o30) && okCell(x.age.recent.n20) && x.age.rebuild != null)
    .sort((p, q) => q[1].age.rebuild - p[1].age.rebuild);
  D.cards(document.getElementById('agCards'), [
    { label: '재건축 프리미엄 (30년 초과 ÷ 11~20년)', value: reb == null ? null : times(reb), tone: reb == null ? 'na' : reb > 1 ? 'up' : '',
      sub: reb == null ? `두 구간 중 ${RATIO_MIN}건 미만인 구간이 있습니다` : `${D.fmt(r.o30.med)} ÷ ${D.fmt(r.n20.med)} 만원/평<br>${reb > 1 ? '오래된 아파트가 더 비쌉니다' : '오래될수록 쌉니다'} · ${period}` },
    { label: '신축 프리미엄 (5년 이내 ÷ 30년 초과)', value: neu == null ? null : times(neu), tone: neu == null ? 'na' : '',
      sub: neu == null ? `두 구간 중 ${RATIO_MIN}건 미만인 구간이 있습니다` : `${D.fmt(r.n5.med)} ÷ ${D.fmt(r.o30.med)} 만원/평` },
    cand.length ? { label: `${data.sido.name}에서 재건축 프리미엄이 가장 큰 곳`, value: cand[0][1].name, tone: '',
      sub: `${times(cand[0][1].age.rebuild)}${cand.length > 1 ? ` · 2위 ${D.esc(cand[1][1].name)} ${times(cand[1][1].age.rebuild)}` : ''}` }
      : { label: '재건축 프리미엄 가장 큰 곳', value: null, tone: 'na', sub: '비교할 시군구가 부족합니다' },
  ]);
  document.getElementById('agBarDesc').textContent = `${ctx.regionName} · ${period} · 건수는 막대에 손을 대면 보입니다`;
  const keys = Object.keys(groups);
  D.chart('agBar', {
    type: 'bar',
    data: { labels: keys.map(k => groups[k]), datasets: [{ data: keys.map(k => r[k].med ?? null), borderRadius: 4, backgroundColor: keys.map(k => AGE_COLORS[k] + 'bb') }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: it => { const c = r[keys[it.dataIndex]]; return c.med == null ? `표본 부족(${c.cnt}건)` : [`중앙값 ${D.fmt(c.med)}만원/평 · ${D.fmt(c.cnt)}건`, `가운데 50%: ${D.fmt(c.p25)}~${D.fmt(c.p75)}`]; } } } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } } } },
  });
  D.chart('agTrend', {
    type: 'line',
    data: { labels: a.years.map(y => D.yearLabel(y, ytd)), datasets: keys.map(k => ({ label: groups[k], data: a.by[k].map(c => c.med), borderColor: AGE_COLORS[k], backgroundColor: AGE_COLORS[k],
      borderWidth: 2, pointRadius: 2, tension: .3, spanGaps: false })) },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
        tooltip: { callbacks: { label: it => `${it.dataset.label} ${D.fmt(it.raw)}만원/평 · ${D.fmt(a.by[keys[it.datasetIndex]][it.dataIndex].cnt)}건` } } },
      scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } }, y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } } } },
  });
  compareBlock(ctx, 'ag', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 재건축 프리미엄` : '전국 시도 재건축 프리미엄',
    desc: `30년 초과 ÷ 11~20년 · ${period} · 두 구간 모두 ${RATIO_MIN}건 이상인 지역만`,
    pickSgg: x => okCell(x.age.recent.o30) && okCell(x.age.recent.n20) && x.age.rebuild != null ? { value: x.age.rebuild, tip: times(x.age.rebuild) } : null,
    pickSido: x => x.age.rebuild == null ? null : { value: x.age.rebuild, tip: times(x.age.rebuild) },
    tick: v => `×${v}`,
  });
}

// ─── size (02 P5) — price 의 면적대 값으로 그린다 ───────────────
function renderSize(ctx, secEl) {
  const { data, region } = ctx;
  const p = region.price, facets = data.facets.size;
  const keys = Object.keys(facets).filter(k => k !== 'all');
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="szCards"></div>
      <div class="grid2">
        <div><div class="sub-title">면적대별 평당가 (최근 12개월)</div><div class="sub-desc" id="szBarDesc"></div>
          <div class="chart-wrap" style="height:260px"><canvas id="szBar"></canvas></div></div>
        <div><div class="sub-title">면적대별 장기 상승률</div><div class="sub-desc">완결 연도끼리 · 그 면적대에서 30건 이상인 첫 해 → 작년</div>
          <div class="chart-wrap" style="height:260px"><canvas id="szRise"></canvas></div></div>
      </div>
      ${cmpHTML('sz')}
      <div class="note">평당가는 전용면적 기준. 총액으로 비교하면 큰 평수가 늘 비싸 보이지만, 평당가로 보면 소형이 더 비싼 지역이 많습니다.
        소형 프리미엄 = 소형(60㎡ 이하) ÷ 중대형(85~135㎡) 평당가 중앙값, 두 구간 모두 ${RATIO_MIN}건 이상일 때만.</div>`;
  }
  const r = p.recent.by, period = `${D.ymText(p.recent.from)}~${D.ymText(p.recent.to)}`;
  const prem = okCell(r.s) && okCell(r.l) ? Math.round(r.s.med / r.l.med * 100) / 100 : null;
  const rises = keys.filter(k => p.rise[k]).map(k => ({ k, ...p.rise[k] })).sort((x, y) => y.pct - x.pct);
  D.cards(document.getElementById('szCards'), [
    { label: '소형 프리미엄 (소형 ÷ 중대형)', value: prem == null ? null : times(prem), tone: prem == null ? 'na' : prem > 1 ? 'up' : '',
      sub: prem == null ? `두 구간 중 ${RATIO_MIN}건 미만인 구간이 있습니다` : `${D.fmt(r.s.med)} ÷ ${D.fmt(r.l.med)} 만원/평<br>${prem > 1 ? '평당가는 소형이 더 비쌉니다' : '평당가도 큰 평수가 더 비쌉니다'} · ${period}` },
    rises.length ? { label: `가장 많이 오른 면적대 (${rises[0].from}→${rises[0].to})`, value: D.signPct(rises[0].pct), unit: '%', tone: D.toneOf(rises[0].pct), sub: facets[rises[0].k] }
      : { label: '가장 많이 오른 면적대', value: null, tone: 'na', sub: '30건 이상인 해가 부족합니다' },
    rises.length > 1 ? { label: `가장 덜 오른 면적대 (${rises.at(-1).from}→${rises.at(-1).to})`, value: D.signPct(rises.at(-1).pct), unit: '%', tone: D.toneOf(rises.at(-1).pct), sub: facets[rises.at(-1).k] }
      : { label: '가장 덜 오른 면적대', value: null, tone: 'na', sub: '비교할 면적대가 부족합니다' },
  ]);
  document.getElementById('szBarDesc').textContent = `${ctx.regionName} · ${period}`;
  D.chart('szBar', {
    type: 'bar',
    data: { labels: keys.map(k => facets[k]), datasets: [{ data: keys.map(k => r[k].med ?? null), borderRadius: 4, backgroundColor: keys.map(k => SIZE_COLORS[k] + 'bb') }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: it => { const c = r[keys[it.dataIndex]]; return c.med == null ? `표본 부족(${c.cnt}건)` : [`중앙값 ${D.fmt(c.med)}만원/평 · ${D.fmt(c.cnt)}건`, `거래가 중앙값 ${D.eok(c.amt)}`]; } } } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: D.isMobile ? 9 : 11 } } }, y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } } } },
  });
  D.chart('szRise', {
    type: 'bar',
    data: { labels: keys.map(k => facets[k]), datasets: [{ data: keys.map(k => p.rise[k] ? p.rise[k].pct : null), borderRadius: 4, backgroundColor: keys.map(k => SIZE_COLORS[k] + 'bb') }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: it => { const x = p.rise[keys[it.dataIndex]]; return x ? `${x.from}→${x.to} ${D.signPct(x.pct)}% (${D.fmt(x.fromMed)} → ${D.fmt(x.toMed)})` : '표본 부족'; } } } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: D.isMobile ? 9 : 11 } } }, y: { ticks: { callback: v => +v.toFixed(1) + '%' }, grid: { color: chartTheme.grid() } } } },
  });
  compareBlock(ctx, 'sz', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 소형 프리미엄` : '전국 시도 소형 프리미엄',
    desc: `소형 ÷ 중대형 평당가 · ${period} · 두 구간 모두 ${RATIO_MIN}건 이상인 지역만`,
    pickSgg: x => { const b = x.price.recent.by; return okCell(b.s) && okCell(b.l) ? { value: Math.round(b.s.med / b.l.med * 100) / 100, tip: `${times(b.s.med / b.l.med)} · ${D.fmt(b.s.med)} ÷ ${D.fmt(b.l.med)}` } : null; },
    pickSido: x => { const b = x.price; return b.s.med != null && b.l.med != null && b.s.cnt >= RATIO_MIN && b.l.cnt >= RATIO_MIN ? { value: Math.round(b.s.med / b.l.med * 100) / 100, tip: times(b.s.med / b.l.med) } : null; },
    tick: v => `×${v}`,
  });
}

// ─── renewal (02 P1) ───────────────────────────────────────
function renderRenewal(ctx, secEl) {
  const { data, region } = ctx;
  const n = region.renewal, ytd = data.ytd;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `
      <div class="cards" id="rnCards"></div>
      <div class="sub-title" id="rnTitle">연도별 신규·갱신 계약</div>
      <div class="sub-desc">막대 = 계약 건수(신규 + 갱신 쌓기), 선 = 갱신 비율 · 전월세 계약은 2년 주기라 비율이 한 해 걸러 오르내립니다</div>
      <div class="chart-wrap" style="height:280px"><canvas id="rnChart"></canvas></div>
      ${cmpHTML('rn')}
      <div class="note" id="rnNote"></div>`;
  }
  const period = `${D.ymText(n.from)}~${D.ymText(n.to)}`;
  const ji = n.jeonseInc, wi = n.wolseInc;
  D.cards(document.getElementById('rnCards'), [
    { label: '갱신 비율 (최근 12개월)', value: n.share == null ? null : n.share.toFixed(1), unit: '%',
      sub: `${period}<br>신규 ${D.fmt(n.newCnt)}건 · 갱신 ${D.fmt(n.renCnt)}건` },
    { label: '갱신 중 갱신요구권 사용', value: n.rrShare == null ? null : n.rrShare.toFixed(1), unit: '%',
      sub: '세입자가 계약갱신요구권(1회, 인상 5% 상한)을 쓴 갱신의 비율' },
    { label: '전세 갱신 보증금 인상률', value: ji.med == null ? null : ji.med.toFixed(1), unit: '%',
      sub: ji.med == null ? `표본 ${D.fmt(ji.cnt)}건` : `중앙값 · 가운데 50%: ${ji.p25.toFixed(1)}~${ji.p75.toFixed(1)}% · ${D.fmt(ji.cnt)}건` },
    { label: '월세 갱신 월세 인상률', value: wi.med == null ? null : wi.med.toFixed(1), unit: '%',
      sub: wi.med == null ? `표본 ${D.fmt(wi.cnt)}건` : `중앙값 · 가운데 50%: ${wi.p25.toFixed(1)}~${wi.p75.toFixed(1)}% · ${D.fmt(wi.cnt)}건` },
  ]);
  document.getElementById('rnTitle').textContent = `${ctx.regionName} — 연도별 신규·갱신 계약`;
  D.chart('rnChart', {
    type: 'bar',
    data: { labels: n.years.map(y => matchYearLabel(y, ytd)), datasets: [
      { type: 'line', label: '갱신 비율(%)', data: n.yearly.map(c => c.share), yAxisID: 'y1', borderColor: '#10b981', backgroundColor: '#10b981',
        borderWidth: 3, tension: .3, pointRadius: 4, pointBorderColor: chartTheme.pointBorder(), pointBorderWidth: 2, order: 1 },
      { label: '신규', data: n.yearly.map(c => c.n), stack: 's', order: 2, borderRadius: 3, backgroundColor: ACCENT + '66' },
      { label: '갱신', data: n.yearly.map(c => c.r), stack: 's', order: 2, borderRadius: 3, backgroundColor: '#10b98166' },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14 } },
        tooltip: { callbacks: { label: it => it.dataset.yAxisID === 'y1' ? `갱신 비율 ${it.raw ?? '-'}%` : `${it.dataset.label} ${D.fmt(it.raw)}건` } } },
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } },
        y1: { position: 'right', min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } } } },
  });
  document.getElementById('rnNote').textContent =
    `계약구분(신규·갱신)이 신고된 계약만 셉니다. 공공임대 단지(LH·SH·행복주택·국민임대·장기전세 등 이름 패턴) ${D.fmt(n.pubExcluded)}건은 뺐습니다 — 공공임대는 갱신이 대부분이라 동네 비율을 왜곡합니다. `
    + `보증금 인상률 = 전세 갱신(지금·종전 모두 월세 0)의 (보증금 − 종전 보증금) ÷ 종전 보증금, 월세 인상률 = 월세 갱신의 (월세 − 종전 월세) ÷ 종전 월세. `
    + `연도별은 전월세 신고제(2021년 6월) 이후, ${ytd.yr}년은 1~${ytd.cmpThruMonth}월.`;
  compareBlock(ctx, 'rn', {
    title: m => m === 'sgg' ? `${data.sido.name} 시군구 갱신 비율` : '전국 시도 갱신 비율',
    desc: `${period} · 신규+갱신 100건 미만 지역은 뺐습니다`,
    pickSgg: x => { const q = x.renewal; return q.share == null || q.newCnt + q.renCnt < 100 ? null : { value: q.share, tip: `${q.share}% · 갱신 ${D.fmt(q.renCnt)} / 신규 ${D.fmt(q.newCnt)}건` }; },
    pickSido: x => x.renewal.share == null ? null : { value: x.renewal.share, tip: `${x.renewal.share}% · 보증금 인상률 ${x.renewal.jeonseInc ?? '-'}%` },
    tick: v => `${v}%`,
  });
}



// ─── pyeong (04 S5) — 읍면동별 대지 평당가 (단독) ─────────────────
function renderPyeong(ctx, secEl) {
  const { data, region } = ctx;
  const p = region.pyeong, rc = region.price.recent.by.all;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) { body.dataset.built = 1; body.innerHTML = `<div class="cards" id="pyCards"></div><div class="sub-title" id="pyTitle"></div><div class="sub-desc" id="pyDesc"></div><div id="pyTable"></div>`; }
  const sggs = Object.entries(data.regions).filter(([k, r]) => k && r.price.recent.by.all.med != null).sort((a, b) => b[1].price.recent.by.all.med - a[1].price.recent.by.all.med);
  const rank = ctx.sgg ? sggs.findIndex(([k]) => k === ctx.sgg) : -1;
  const yt = region.price.ytd.all;
  D.cards(document.getElementById('pyCards'), [
    { label: '대지 평당가 중앙값 (최근 12개월)', value: rc.med == null ? null : D.fmt(rc.med), unit: '만원/평', sub: rc.med == null ? '' : `가운데 50%: ${D.fmt(rc.p25)}~${D.fmt(rc.p75)} · ${D.fmt(rc.cnt)}건` },
    ctx.sgg ? { label: `${data.sido.name} 안 순위`, value: rank >= 0 ? `${rank + 1}위` : null, unit: rank >= 0 ? ` / ${sggs.length}` : '', sub: '시군구 대지 평당가 중앙값 기준' }
      : { label: '시군구 수', value: D.fmt(sggs.length), unit: '곳', sub: '거래 5건 이상' },
    yt ? { label: `전년 동기 대비 (1~${data.ytd.cmpThruMonth}월)`, value: yt.pct == null ? null : D.signPct(yt.pct), unit: '%', tone: D.toneOf(yt.pct), sub: yt.pct == null ? '' : `${D.fmt(yt.prev.med)} → ${D.fmt(yt.cur.med)} 만원/평` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '' },
  ]);
  document.getElementById('pyTitle').textContent = `${ctx.regionName} 읍면동별 대지 평당가`;
  document.getElementById('pyDesc').textContent = `${D.ymText(p.from)}~${D.ymText(p.to)} · ${p.min}건 이상인 동만 · 높은 순 최대 40곳`;
  D.table(document.getElementById('pyTable'), [
    { label: '#', cls: 'num faint', get: (x, i) => i + 1 },
    { label: '읍면동', cls: 'name', get: x => D.esc(x.name) },
    { label: '대지 평당가', cls: 'num hi', get: x => `${D.fmt(x.med)}<div class="faint">만원/평</div>` },
    { label: '가운데 50%', cls: 'num', get: x => `${D.fmt(x.p25)}~${D.fmt(x.p75)}` },
    { label: '거래', cls: 'num', get: x => `${x.cnt}건` },
  ], p.umd, `${p.min}건 이상 거래된 동이 없습니다`);
}

// ─── jimok (04 L3) — 지목별 평당가 + 대(垈) 읍면동 (토지) ──────────
function renderJimok(ctx, secEl) {
  const { data, region } = ctx;
  const j = region.jimok, f = data.facets.size;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `<div class="cards" id="jmCards"></div>
      <div class="sub-title">지목별 평당가 (최근 12개월, 비지분)</div><div class="sub-desc" id="jmDesc"></div>
      <div class="chart-wrap" style="height:260px"><canvas id="jmChart"></canvas></div>
      <div class="sub-title" id="jmUmdTitle"></div><div class="sub-desc" id="jmUmdDesc"></div><div id="jmTable"></div>`;
  }
  const dae = j.by.dae, yt = region.price.ytd.dae;
  const sggs = Object.entries(data.regions).filter(([k, r]) => k && r.jimok.by.dae.med != null).sort((a, b) => b[1].jimok.by.dae.med - a[1].jimok.by.dae.med);
  const rank = ctx.sgg ? sggs.findIndex(([k]) => k === ctx.sgg) : -1;
  D.cards(document.getElementById('jmCards'), [
    { label: '대(垈) 평당가 중앙값', value: dae.med == null ? null : D.fmt(dae.med), unit: '만원/평', sub: dae.med == null ? `${dae.cnt}건 — 5건 미만` : `가운데 50%: ${D.fmt(dae.p25)}~${D.fmt(dae.p75)} · ${D.fmt(dae.cnt)}건` },
    ctx.sgg ? { label: `${data.sido.name} 안 순위 (대 기준)`, value: rank >= 0 ? `${rank + 1}위` : null, unit: rank >= 0 ? ` / ${sggs.length}` : '', sub: '' }
      : { label: '대(垈) 거래 5건 이상 시군구', value: D.fmt(sggs.length), unit: '곳', sub: '' },
    yt ? { label: `대(垈) 전년 동기 대비 (1~${data.ytd.cmpThruMonth}월)`, value: yt.pct == null ? null : D.signPct(yt.pct), unit: '%', tone: D.toneOf(yt.pct), sub: yt.pct == null ? '' : `${D.fmt(yt.prev.med)} → ${D.fmt(yt.cur.med)} 만원/평` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '' },
  ]);
  const keys = Object.keys(f).filter(k => k !== 'all');
  document.getElementById('jmDesc').textContent = `${ctx.regionName} · ${D.ymText(j.from)}~${D.ymText(j.to)} · 지목에 따라 수십 배 차이가 납니다 — 막대에 손을 대면 건수·가운데 50%`;
  D.chart('jmChart', {
    type: 'bar',
    data: { labels: keys.map(k => f[k]), datasets: [{ data: keys.map(k => j.by[k].med ?? null), borderRadius: 4, backgroundColor: ACCENT + 'aa' }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: it => { const c = j.by[keys[it.dataIndex]]; return c.med == null ? `표본 부족(${c.cnt}건)` : [`중앙값 ${D.fmt(c.med)}만원/평 · ${D.fmt(c.cnt)}건`, `가운데 50%: ${D.fmt(c.p25)}~${D.fmt(c.p75)}`]; } } } },
      scales: { x: { type: 'logarithmic', ticks: { callback: v => [1, 10, 100, 1000, 10000, 100000].includes(v) ? D.fmt(v) : '' }, grid: { color: chartTheme.grid() }, title: { display: true, text: '만원/평 (로그 눈금)' } }, y: { grid: { display: false } } } },
  });
  document.getElementById('jmUmdTitle').textContent = `${ctx.regionName} 읍면동별 대(垈) 평당가`;
  document.getElementById('jmUmdDesc').textContent = `비지분 · ${j.min}건 이상인 동만 · 높은 순 최대 40곳`;
  D.table(document.getElementById('jmTable'), [
    { label: '#', cls: 'num faint', get: (x, i) => i + 1 },
    { label: '읍면동', cls: 'name', get: x => D.esc(x.name) },
    { label: '대(垈) 평당가', cls: 'num hi', get: x => `${D.fmt(x.med)}<div class="faint">만원/평</div>` },
    { label: '가운데 50%', cls: 'num', get: x => `${D.fmt(x.p25)}~${D.fmt(x.p75)}` },
    { label: '거래', cls: 'num', get: x => `${x.cnt}건` },
  ], j.umd, `${j.min}건 이상 거래된 동이 없습니다`);
}

// ─── factory (04 F1·F2) — 공장·창고·지식산업센터 (건물 페이지) ─────
const FACTORY_MIN = 10;   // 시군구 최근 12개월이 이보다 적으면 시도 값으로 대신한다(공장 시군구 표본은 수도권 몇 곳뿐)
function renderFactory(ctx, secEl) {
  const { data } = ctx;
  const body = secEl.querySelector('.dsec-body');
  if (!body.dataset.built) {
    body.dataset.built = 1;
    body.innerHTML = `<div class="chips" id="faChips" style="margin-bottom:12px"></div><div class="cards" id="faCards"></div>
      <div class="sub-title" id="faTitle"></div><div class="sub-desc" id="faDesc"></div>
      <div class="chart-wrap" style="height:300px"><canvas id="faChart"></canvas></div>
      <div class="sub-title">분기별 거래 건수</div><div class="sub-desc">월은 표본이 너무 적어 분기로 셉니다 · 회색 = 신고가 아직 들어오는 분기</div>
      <div class="chart-wrap" style="height:220px"><canvas id="faQChart"></canvas></div>
      ${cmpHTML('fa')}`;
  }
  const f = D.chips(document.getElementById('faChips'), 'fa', data.facets.factory, () => renderFactory(ctx, secEl));
  // 시군구 표본이 적으면 시도 값
  let reg = ctx.region, fallback = false;
  if (ctx.sgg && reg.factory.price.recent.by[f].cnt < FACTORY_MIN) { reg = data.regions['']; fallback = true; }
  const p = reg.factory.price, rc = p.recent.by[f], yt = p.ytd[f], rs = p.rise[f];
  const where = fallback ? `${data.sido.name} 전체` : ctx.regionName;
  D.cards(document.getElementById('faCards'), [
    { label: `평당가 중앙값 (최근 12개월)${fallback ? ' · 시도 기준' : ''}`, value: rc.med == null ? null : D.fmt(rc.med), unit: '만원/평',
      sub: (fallback ? `${ctx.region.name} 거래가 최근 12개월 ${ctx.region.factory.price.recent.by[f].cnt}건뿐이라 ${data.sido.name} 전체 값<br>` : '') + (rc.med == null ? `${rc.cnt}건` : `가운데 50%: ${D.fmt(rc.p25)}~${D.fmt(rc.p75)} · ${D.fmt(rc.cnt)}건 · 거래가 중앙값 ${D.eok(rc.amt)}`) },
    yt ? { label: `전년 동기 대비 (1~${data.ytd.cmpThruMonth}월)`, value: yt.pct == null ? null : D.signPct(yt.pct), unit: '%', tone: D.toneOf(yt.pct), sub: yt.pct == null ? '표본 부족' : `${D.fmt(yt.prev.med)} → ${D.fmt(yt.cur.med)} · ${yt.prev.cnt} → ${yt.cur.cnt}건` }
      : { label: '전년 동기 대비', value: null, tone: 'na', sub: '' },
    { label: rs ? `${rs.from}→${rs.to} 상승률` : '장기 상승률', value: rs ? D.signPct(rs.pct) : null, unit: '%', tone: rs ? D.toneOf(rs.pct) : 'na', sub: rs ? `${D.fmt(rs.fromMed)} → ${D.fmt(rs.toMed)}` : '거래 30건 이상인 해가 부족합니다' },
  ]);
  document.getElementById('faTitle').textContent = `${where} — ${data.facets.factory[f]}`;
  document.getElementById('faDesc').textContent = '선 = 중앙값, 띠 = 가운데 50%, 막대 = 거래 건수(지분 거래 제외)';
  const cells = p.by[f];
  D.chart('faChart', {
    type: 'bar',
    data: { labels: p.years.map(y => D.yearLabel(y, data.ytd)), datasets: [
      ...D.bandDatasets({ label: '평당가 중앙값(만원/평)', color: ACCENT, med: cells.map(c => c.med ?? null), p25: cells.map(c => c.p25 ?? null), p75: cells.map(c => c.p75 ?? null) }),
      { type: 'bar', label: '거래 건수', data: cells.map(c => c.cnt), yAxisID: 'y1', order: 2, borderRadius: 4, backgroundColor: D.barColors(p.years, y => y === data.ytd.yr, ACCENT) },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, filter: D.legendFilter } }, tooltip: { filter: it => !it.dataset.label.startsWith('_') } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => D.fmt(v) }, grid: { color: chartTheme.grid() } }, y1: { position: 'right', ticks: { precision: 0 }, grid: { display: false } } } },
  });
  const qs = data.quarters, qi = new Set(data.quarterImmature), qd = reg.factory.quarters[f];
  D.chart('faQChart', {
    type: 'bar',
    data: { labels: qs.map(q => q.replace('Q', ' Q')), datasets: [{ data: qd, borderRadius: 3, backgroundColor: qs.map(q => qi.has(q) ? chartTheme.muted() : ACCENT + '88') }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: it => `${D.fmt(it.raw)}건${qi.has(qs[it.dataIndex]) ? ' (집계 중)' : ''}` } } },
      scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 }, grid: { color: chartTheme.grid() } } } },
  });
  compareBlock(ctx, 'fa', {
    title: m => `${m === 'sgg' ? `${data.sido.name} 시군구` : '전국 시도'} 평당가 · ${data.facets.factory[f]}`,
    desc: `최근 12개월 중앙값 · ${FACTORY_MIN}건 미만 지역은 뺐습니다`,
    pickSgg: r => { const c = r.factory.price.recent.by[f]; return c.cnt >= FACTORY_MIN && c.med != null ? { value: c.med, tip: `${D.fmt(c.med)}만원/평 · ${c.cnt}건` } : null; },
    pickSido: s => { const c = (s.factory || {})[f]; return c && c.cnt >= FACTORY_MIN && c.med != null ? { value: c.med, tip: `${D.fmt(c.med)}만원/평 · ${c.cnt}건` } : null; },
    tick: v => D.fmt(v),
  });
}

const ALL = { price: renderPrice, volume: renderVolume, jeonse: renderJeonse, yield: renderYield, wolse: renderWolse, age: renderAge, size: renderSize, renewal: renderRenewal, pyeong: renderPyeong, jimok: renderJimok, factory: renderFactory };
window.DashSections = {
  setAccent(c) { ACCENT = c; document.documentElement.style.setProperty('--accent', c); document.documentElement.style.setProperty('--accent-soft', c + '22'); },
  pick: (...ids) => Object.fromEntries(ids.map(id => [id, ALL[id]])),
  all: ALL,
};
})();
