// trade-kr 서빙 API 공용 — complex·compare·search 페이지가 같이 쓴다
// 계약 정본: ~/server/trade-serve/docs/contract.md (필드 이름·경로를 여기 다시 적지 말고 그 문서를 볼 것)
//
//   TradeApi.complex(key)       → {schemaVersion, asOf, complex, deals:{cols,rows}, rents:{cols,rows}} | null(404)
//   TradeApi.summary(key)       → §3.4 요약 조각 | null
//   TradeApi.sgg(sgg)           → §3.5 시군구 통계 + 이름 색인 | null
//   TradeApi.resolvePnu(pnu)    → 단지 키 배열 (없으면 [])
//   TradeApi.rows(block)        → cols 로 읽은 객체 배열 (열 순서를 코드에 박지 않는다 — 계약 §3.3)
//   TradeApi.regionNames()      → {sido:[{code,name,sgg:[…]}], sggName(code) → '서울 강남구'}
//
// 저장은 gzip 이지만 브라우저가 알아서 푼다 — Accept-Encoding 을 손으로 넣지 말 것

(function () {
  const BASE = 'https://trade-kr.boolint.com/v1/';
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

  // PNU 19자리 → 단지 키. 색인은 시군구별 파일 하나(앞 5자리), 값은 배열 또는 {keys, legacy}
  async function resolvePnu(pnu) {
    if (!/^\d{19}$/.test(pnu || '')) return [];
    const idx = await get(`idx/pnu/${pnu.slice(0, 5)}`);
    const hit = idx && idx.map && idx.map[pnu];
    if (!hit) return [];
    return Array.isArray(hit) ? hit : (hit.keys || []);
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
    complex: key => get(`c/${keyPath(key)}`),
    summary: key => get(`c/${keyPath(key)}/summary`),
    sgg: code => get(`sgg/${code}`),
    meta: () => get('meta'),
  };
})();
