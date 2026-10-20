// 시도 버튼 + 시군구 <select> 공통 — 대시보드·특화 페이지가 같이 쓴다
// 정본: ~/server/trade-collector/docs/infographic-redesign/01-common.md §2·§3
//
// URL 계약 (앱과의 약속 — 이름을 바꾸지 말 것)
//   ?sido=26            시도만 (시군구 = 시도 전체)
//   ?sido=26&sgg=26440  sgg 가 오면 sido 는 sgg 앞 2자리로 덮어쓴다
//   파라미터 없음        defaultSido
//   모르는 코드는 조용히 기본값으로 간다. 변경 때 history.replaceState 로 URL 갱신(다른 파라미터·#해시 유지)
//
// 사용:
//   RegionSelect.init({
//     container: '#regionBar',
//     sidos: [{code:'11', name:'서울'}, ...],      // 버튼 순서 그대로
//     sggOf: sido => [{code:'11680', name:'강남구'}, ...],
//     defaultSido: '11',
//     onChange: (sido, sgg) => {...}               // sgg 가 '' 이면 시도 전체
//   });
//   RegionSelect.select('26', '26440');           // 코드에서 바꿀 때 (차트 클릭 등)
//   RegionSelect.current()                        // {sido, sgg}

(function () {
  let opt, sidoBox, sggSel, cur = { sido: '', sgg: '' };

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.assign(e, attrs || {});
    if (text != null) e.textContent = text;
    return e;
  }

  function validSido(code) { return opt.sidos.some(s => s.code === code); }
  function validSgg(sido, sgg) { return (opt.sggOf(sido) || []).some(g => g.code === sgg); }

  // URL → 첫 선택
  function fromUrl() {
    const q = new URLSearchParams(location.search);
    let sido = q.get('sido') || '', sgg = q.get('sgg') || '';
    if (sgg && sgg.length === 5) sido = sgg.slice(0, 2);
    if (!validSido(sido)) { sido = opt.defaultSido; sgg = ''; }
    if (sgg && !validSgg(sido, sgg)) sgg = '';
    return { sido, sgg };
  }

  function writeUrl() {
    try {
      const q = new URLSearchParams(location.search);
      q.set('sido', cur.sido);
      if (cur.sgg) q.set('sgg', cur.sgg); else q.delete('sgg');
      history.replaceState(null, '', `${location.pathname}?${q.toString()}${location.hash}`);
    } catch (e) { /* file:// 등 — URL 갱신은 부가 기능 */ }
  }

  function fillSgg() {
    sggSel.innerHTML = '';
    const name = (opt.sidos.find(s => s.code === cur.sido) || {}).name || '';
    sggSel.appendChild(el('option', { value: '' }, `${name} 전체`));
    // 자치구 먼저, 그다음 시·군 — 각각 가나다순(네이버부동산과 같은 순서)
    // 데이터는 행정코드순으로 오는데, 앱 select 다이얼로그는 검색이 없어 이름으로 찾아야 한다
    // 자치구 = 한 단어 '…구'. '수원시 장안구' 같은 일반구는 시 쪽에 남는다
    const rank = g => /^[^ ]+구$/.test(g.name) ? 0 : 1;
    const list = [...(opt.sggOf(cur.sido) || [])].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ko'));
    for (const g of list) sggSel.appendChild(el('option', { value: g.code }, g.name));
    sggSel.value = cur.sgg;
    // 시군구가 하나뿐인 시도(세종)는 고를 것이 없다
    sggSel.disabled = (opt.sggOf(cur.sido) || []).length <= 1;
  }

  function paint() {
    sidoBox.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.code === cur.sido));
  }

  function select(sido, sgg, silent) {
    if (!validSido(sido)) return;
    if (sgg && !validSgg(sido, sgg)) sgg = '';
    const sidoChanged = sido !== cur.sido;
    cur = { sido, sgg: sgg || '' };
    if (sidoChanged) fillSgg(); else sggSel.value = cur.sgg;
    paint();
    writeUrl();
    if (!silent) opt.onChange(cur.sido, cur.sgg);
  }

  function init(o) {
    opt = Object.assign({ defaultSido: '11' }, o);
    const box = typeof opt.container === 'string' ? document.querySelector(opt.container) : opt.container;
    box.classList.add('region-bar');
    box.innerHTML = '';
    sidoBox = el('div', { className: 'sido-btns' });
    for (const s of opt.sidos) {
      const b = el('button', { type: 'button' }, s.name);
      b.dataset.code = s.code;
      b.onclick = () => select(s.code, '');
      sidoBox.appendChild(b);
    }
    const row = el('label', { className: 'sgg-row' });
    row.appendChild(el('span', null, '시군구'));
    sggSel = el('select', { id: 'sggSel' });
    sggSel.onchange = () => select(cur.sido, sggSel.value);
    row.appendChild(sggSel);
    box.appendChild(sidoBox);
    box.appendChild(row);

    const first = fromUrl();
    select(first.sido, first.sgg);
  }

  window.RegionSelect = { init, select, current: () => ({ ...cur }) };
})();
