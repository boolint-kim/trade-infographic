// 전월세 전환 — JunseWolse Android `Utils.java`(calWolse·calJunse·calDeposits_*) 와 `helper/RateConfig.java`(houseCap) 를 옮긴 것(정본은 Android)
// 식을 바꾸면 Android 를 먼저 고치고 여기를 맞춘 뒤 `calc/parity/run.sh` 를 돌린다(Utils.java 는 그대로 컴파일해 비트 대조, RateConfig 는 Android 의존이라 식만 옮김)
// 플랫폼 계획: ~/server/trade-serve/docs/platform-plan.md §12
//
//   JW.wolse(junseWon, ratePercent, depositWon) → 월세(원) — 보증금이 전세보다 크면 0
//   JW.junse(depositWon, wolseWon, ratePercent) → 전세 환산(원) — 보증금·월세 중 하나라도 0 이면 0(정본 그대로)
//   JW.deposits(junseWon, stepWon) → 보증금 단계(원) — step 100만·1000만·5000만 (앱의 calDeposits_100/1000/5000)
//   JW.loadRates() → Promise<{baseRate, houseSpread, houseCap, asOf, remote}> — app-data rates.json, 실패·이상값이면 번들값(앱과 같은 규칙)
(function (root) {
  // Utils.calWolse
  function wolse(junseWon, ratePercent, depositWon) {
    if (junseWon < depositWon) return 0;
    return ((junseWon - depositWon) * ratePercent * 0.01) / 12.0;
  }
  // Utils.calJunse
  function junse(depositWon, wolseWon, ratePercent) {
    if (depositWon === 0 || wolseWon === 0) return 0;
    return ((wolseWon * 12.0) / (ratePercent * 0.01)) + depositWon;
  }
  // Utils.calDeposits_100/1000/5000 — step 부터 step 씩, 전세금 미만까지(누적 덧셈 그대로)
  function deposits(junseWon, step) {
    const out = [];
    if (junseWon <= step) return out;
    for (let it = step; it < junseWon; it = it + step) out.push(it);
    return out;
  }

  // RateConfig 번들값(정본) — 기준금리가 바뀌면 앱과 rates.json 을 고친다. 여기는 받기 실패 때만 쓴다
  const BUNDLE = { baseRate: 3.0, asOf: '2026.8.27', houseSpread: 2.0 };
  const RATES_URL = 'https://app-data.pages.dev/junsewolse/rates.json';
  // RateConfig.parse 와 같은 규칙: schemaVersion 1, 범위 밖이면 그 항목은 버림, baseRate·asOf 는 한 묶음
  function pickRates(j) {
    const r = { ...BUNDLE, remote: false };
    if (!j || j.schemaVersion !== 1) return r;
    const okBase = typeof j.baseRate === 'number' && j.baseRate >= 0 && j.baseRate <= 10;
    const okAsOf = typeof j.asOf === 'string' && /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(j.asOf);
    if (okBase && okAsOf) { r.baseRate = j.baseRate; r.asOf = j.asOf; r.remote = true; }
    if (typeof j.houseSpread === 'number' && j.houseSpread >= 0 && j.houseSpread <= 5) r.houseSpread = j.houseSpread;
    return r;
  }
  let ratesP;
  function loadRates() {
    if (!ratesP) ratesP = fetch(RATES_URL).then(x => x.ok ? x.json() : null).catch(() => null)
      .then(j => { const r = pickRates(j); r.houseCap = r.baseRate + r.houseSpread; return r; });   // RateConfig.houseCap
    return ratesP;
  }

  const JW = { wolse, junse, deposits, loadRates, pickRates, BUNDLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = JW;
  else (root.Calc = root.Calc || {}).junsewolse = JW;
})(typeof window !== 'undefined' ? window : globalThis);
