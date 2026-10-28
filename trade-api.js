// trade-kr 서빙 API 공용 — complex·compare·search 페이지가 같이 쓴다
// 계약 정본: ~/server/trade-serve/docs/contract.md (필드 이름·경로를 여기 다시 적지 말고 그 문서를 볼 것)
//
//   TradeApi.complex(key, hint) → {schemaVersion, asOf, complex, deals:{cols,rows}, rents:{cols,rows}} | null(404)
//   TradeApi.summary(key, hint) → §3.4 요약 조각 | null
//     v0.5(계약 §9): 단지 파일이 없고 읍면동 묶음 umd/{10}/rows 와 umd/{10}.summaries 에서 꺼낸다.
//     hint = {umd: 10자리} | {sgg: 5자리} — 링크가 알면 넘긴다(읍면동을 찾는 요청이 줄어든다). 없으면 단지 마스터 idx/complex/{sgg} 로 찾는다
//   TradeApi.locate(key, hint)  → 읍면동 버킷 10자리 | null
//   TradeApi.sgg(sgg)           → §3.5 시군구 통계 + 이름 색인 | null
//   TradeApi.resolvePnu(pnu)    → 단지 키 배열 (없으면 [])
//   TradeApi.rows(block)        → cols 로 읽은 객체 배열 (열 순서를 코드에 박지 않는다 — 계약 §3.3)
//   TradeApi.regionNames()      → {sido:[{code,name,sgg:[…]}], sggName(code) → '서울 강남구'}
//
// 저장은 gzip 이지만 브라우저가 알아서 푼다 — Accept-Encoding 을 손으로 넣지 말 것

(function () {
  // ?api=local — 로컬(127.0.0.1·localhost)에서만: 같은 출처의 /v1/ 로 생성기 출력(data/serve)을 시험한다(배포 전 확인용 목 서버)
  const LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && new URLSearchParams(location.search).get('api') === 'local';
  const BASE = LOCAL ? '/v1/' : 'https://trade-kr.boolint.com/v1/';
  const TYPE_NAME = { apt: '아파트', right: '분양권·입주권', office: '오피스텔' };

  // 키는 ':' 를 그대로 두고 조각만 인코딩한다(한글·괄호) — 계약 §2
  const keyPath = key => String(key).split(':').map(encodeURIComponent).join(':');
  const isKey = key => /^(apt|right|office):.+/.test(key || '');

  // 404 는 null — 계약상 404·400 외 상태코드는 없다
  async function get(path) {
    const r = await fetch(BASE + path);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    return r.json();
  }

  function rows(block) {
    if (!block || !block.cols) return [];
    const cols = block.cols;
    return block.rows.map(r => {
      const o = {};
      for (let i = 0; i < cols.length; i++) o[cols[i]] = r[i];
      return o;
    });
  }

  // PNU 19자리 → 단지 키. 색인은 시군구별 파일 하나(앞 5자리), 값은 배열 또는 {keys, legacy}. v0.5 부터 파일에 umd{key: 10자리}
  async function resolvePnu(pnu) {
    if (!/^\d{19}$/.test(pnu || '')) return [];
    const idx = await get(`idx/pnu/${pnu.slice(0, 5)}`);
    const hit = idx && idx.map && idx.map[pnu];
    if (!hit) return [];
    const keys = Array.isArray(hit) ? hit : (hit.keys || []);
    for (const k of keys) if (idx.umd && idx.umd[k]) umdOf.set(k, idx.umd[k]);
    return keys;
  }

  // ─── 키 → 읍면동 (계약 §9) ───────────────────────────────
  const memo = new Map();   // 경로 → Promise(같은 파일을 두 번 받지 않는다)
  const once = path => memo.get(path) || memo.set(path, get(path).catch(e => { memo.delete(path); throw e; })).get(path);
  const umdOf = new Map();  // key → 10자리(찾은 것 기억)
  const bucket = c => `${c.sgg}${c.umdCd || '00000'}`;
  async function fromMaster(sgg, key) {
    if (!/^\d{5}$/.test(sgg || '')) return null;
    const f = await once(`idx/complex/${sgg}`);
    const c = f && f.items.find(x => x.key === key);
    return c ? bucket(c) : null;
  }
  async function locate(key, hint = {}) {
    if (hint.umd && /^\d{10}$/.test(hint.umd)) return hint.umd;
    if (umdOf.has(key)) return umdOf.get(key);
    const [type, rest] = [key.split(':')[0], key.slice(key.indexOf(':') + 1)];
    // 후보 시군구: 링크가 준 것 → 키에 든 것(분양권·오피스텔은 시군구, 아파트는 aptSeq 접두 = 처음 등록된 시군구) → 옛→새 코드표
    const guess = type === 'apt' ? rest.split('-')[0] : rest.split(':')[0];
    let u = null;
    for (const s of [hint.sgg, guess]) { if (!u && s) u = await fromMaster(s, key); }
    if (!u && guess) {
      const map = await once('idx/bjd-map').catch(() => null);
      // remap = { 옛 5자리: [새 5자리, …] }(지역번들) ∪ observed = { aptSeq 접두: { 현재 시군구: 단지 수 } }(실거래 관찰 — remap 에 없는 화성 41590 등).
      //   관찰은 단지 수가 많은 순으로 먼저 본다. 분구된 곳은 후보가 여럿이라 마스터를 몇 번 더 받을 수 있다
      const obs = (map && map.observed && map.observed[guess]) || {};
      const nus = [...new Set([...Object.keys(obs).sort((a, b) => obs[b] - obs[a]), ...[].concat((map && map.remap && map.remap[guess]) || [])])];
      for (const nu of nus) { if (!u) u = await fromMaster(nu, key); }
    }
    if (u) umdOf.set(key, u);
    return u;
  }

  async function complex(key, hint) {
    const u = await locate(key, hint);
    const b = u && await once(`umd/${u}/rows`);
    const x = b && b.complexes && b.complexes[key];
    if (x) return { schemaVersion: b.schemaVersion, asOf: b.asOf, ...x };
    return get(`c/${keyPath(key)}`);   // 전환 기간 폴백(v0.4 단지 파일) — c/ 가 지워진 뒤에는 404 → null
  }
  async function summary(key, hint) {
    const u = await locate(key, hint);
    const f = u && await once(`umd/${u}`);
    if (f && f.summaries && f.summaries[key]) return f.summaries[key];
    return get(`c/${keyPath(key)}/summary`);   // 전환 기간 폴백
  }

  // 시도·시군구 이름 — 서빙 파일에는 이름이 없어서 대시보드 목록(이 레포 data/)을 빌린다
  let regionPromise;
  function regionNames() {
    if (!regionPromise) regionPromise = fetch('data/dash-apt-all.json').then(r => r.json()).then(all => {
      const map = {};
      for (const s of all.sido) for (const g of s.sgg || []) map[g.code] = `${s.name} ${g.name}`;
      return { sido: all.sido, sggName: code => map[code] || '' };
    }).catch(() => ({ sido: [], sggName: () => '' }));
    return regionPromise;
  }

  window.TradeApi = {
    BASE, TYPE_NAME, keyPath, isKey, rows, resolvePnu, regionNames,
    complex, summary, locate,
    sgg: code => get(`sgg/${code}`),
    meta: () => get('meta'),
  };
})();
