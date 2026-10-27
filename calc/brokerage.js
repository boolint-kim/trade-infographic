// 중개보수 상한 — RealEstateCal Android `helper/CalHelper.java` 를 그대로 옮긴 것(정본은 Android)
// 요율·환산식을 바꾸면 Android 를 먼저 고치고 여기를 맞춘 뒤 `calc/parity/run.sh`(Java·JS 12,000건 비트 대조)를 돌린다
// 플랫폼 계획: ~/server/trade-serve/docs/platform-plan.md §12 (계산기 앱의 결과를 단지 상세에)
//
//   Brokerage.fee(objectType, tradeType, price1, price2) → 원(실수, 표시는 반올림)
//     objectType '주택' | '오피스텔' | '그외'   tradeType '매매' | '전세' | '월세'
//     price1 = 매매가·보증금(만원), price2 = 월세(만원, 매매·전세는 0)
//   Brokerage.convert(deposit, rent) → 거래금액(만원) — 월세 환산: 보증금 + 월세×100, 5천만 미만이면 ×70
//   Brokerage.rate(objectType, tradeType, price1, price2) → {rate:'0.4', limit:만원|0} | null
//   부가세 별도. '오피스텔' 요율은 주거용(전용 85㎡ 이하·부엌·화장실 등) 조건 — 아니면 '그외'(0.9%)
(function (root) {
  // [물건, 매매|임대차, 하한, 상한(-1 = 없음), 요율(‰ 문자열), 한도(만원 문자열)] — CalHelper.createRateList() 순서 그대로
  const RATES = [
    ['주택', '매매', 0, 5000, '6', '25'],
    ['주택', '매매', 5000, 20000, '5', '80'],
    ['주택', '매매', 20000, 90000, '4', '0'],
    ['주택', '매매', 90000, 120000, '5', '0'],
    ['주택', '매매', 120000, 150000, '6', '0'],
    ['주택', '매매', 150000, -1, '7', '0'],
    ['주택', '임대차', 0, 5000, '5', '20'],
    ['주택', '임대차', 5000, 10000, '4', '30'],
    ['주택', '임대차', 10000, 60000, '3', '0'],
    ['주택', '임대차', 60000, 120000, '4', '0'],
    ['주택', '임대차', 120000, 150000, '5', '0'],
    ['주택', '임대차', 150000, -1, '6', '0'],
    ['오피스텔', '매매', 0, -1, '5', '0'],
    ['오피스텔', '임대차', 0, -1, '4', '0'],
    ['그외', '매매', 0, -1, '9', '0'],
    ['그외', '임대차', 0, -1, '9', '0'],
  ];

  // CalHelper.calConvertPrice — 정수(만원). Java int 와 같게 |0
  function convert(price1, price2) {
    let v = (price1 + price2 * 100) | 0;
    if (v < 5000) v = (price1 + price2 * 70) | 0;
    return v;
  }

  // CalHelper.getRateItem + getFeeRateItem — 첫 번째로 맞는 줄
  function item(objectType, tradeType, price1, price2) {
    const price = tradeType === '월세' ? convert(price1, price2) : price1;
    const kind = tradeType === '매매' ? '매매' : '임대차';
    for (const r of RATES) {
      if (r[0] !== objectType || r[1] !== kind) continue;
      const [, , min, max] = r;
      if (min === 0 && max === -1) return r;
      if (max === -1) { if (price >= min) return r; }
      else if (price >= min && price < max) return r;
    }
    return null;
  }

  // CalHelper.calFee(region, objectType, tradeType, price1, price2) — 같은 순서의 double 연산(결과 비트가 같아야 한다)
  //   ⚠️ 정본은 요율 구간은 (월세만) 환산가로 고르고, 금액은 거래 종류와 상관없이 calConvertPrice(price1, price2) 로 곱한다
  function fee(objectType, tradeType, price1, price2) {
    const r = item(objectType, tradeType, price1, price2);
    if (!r) return 0;
    const dPrice = convert(price1, price2) * 10000;
    const dRate = parseInt(r[4], 10) * 0.001;
    const dLimit = parseInt(r[5], 10) * 10000;
    let d = dPrice * dRate;
    if (dLimit > 0 && d > dLimit) d = dLimit;
    return d;
  }

  function rate(objectType, tradeType, price1, price2) {
    const r = item(objectType, tradeType, price1, price2);
    return r ? { rate: (parseInt(r[4], 10) / 10).toString(), limit: parseInt(r[5], 10) } : null;
  }

  const Brokerage = { fee, convert, rate, RATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = Brokerage;
  else (root.Calc = root.Calc || {}).brokerage = Brokerage;
})(typeof window !== 'undefined' ? window : globalThis);
