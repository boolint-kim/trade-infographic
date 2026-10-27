// 취득세 — AcqTax Android `Utils.java` 의 세율 함수를 그대로 옮긴 것(정본은 Android)
// 세율·식을 바꾸면 Android 를 먼저 고치고 여기를 맞춘 뒤 `calc/parity/run.sh` 를 돌린다
// 플랫폼 계획: ~/server/trade-serve/docs/platform-plan.md §12
//
//   AcqTax.houseRate(reason, presenterQty, receiverQty, jojung, corp, excessGungmin, price원, junggwaExclude) → {chi, ji, nong} (%)
//   AcqTax.etcRate(reason) → {chi, ji, nong}         — 오피스텔·상가·건물·토지(농지 제외)
//   AcqTax.amount(rate, price원) → 원(실수)          — HouseActivity.updateValue() 의 합계 = (chi+nong+ji) × price / 100
//   AcqTax.dealTax(type, amountManwon, area) → {rate:%, tax:원} — 단지 상세용: 아파트 = 1주택·매매·비조정과 같음(1주택은 조정 여부 무관),
//                                                            오피스텔 = 그 이외(4.6%). 분양권은 null(취득은 입주 때)
(function (root) {
  const R = (chi, ji, nong) => ({ chi, ji, nong });

  // Utils.getAcqTaxRateEtc
  function etcRate(reason) {
    let chi = 0, ji = 0, nong = 0;
    switch (reason) {
      case '매매': chi = 4; nong = 0.2; ji = 0.4; break;
      case '상속': chi = 2.8; nong = 0.2; ji = 0.16; break;
      case '원시': chi = 2.8; nong = 0.2; ji = 0.16; break;
      case '증여': chi = 3.5; nong = 0.2; ji = 0.3; break;
    }
    return R(chi, ji, nong);
  }

  // Java Math.round(double) = floor(x + 0.5) (반올림 방향이 JS Math.round 와 같다 — 음수 .5 도 +∞ 쪽)
  const jround = x => Math.floor(x + 0.5);

  // Utils.getAcqTaxRateHouse — 분기·연산 순서 그대로
  function houseRate(reason, presenterQty, receiverQty, jojung, corp, excessGungmin, price, junggwaExclude) {
    let chi = 0, ji = 0, nong = 0;
    const mid = () => { chi = (2.0 / 3.0) * (price / 100000000.0) - 3; chi = jround(chi * 100.0) / 100.0; nong = 0.2; ji = chi * 0.1; };
    const oneHouse = () => {
      if (price <= 600000000) { chi = 1; nong = 0.2; ji = 0.1; }
      else if (price <= 900000000) mid();
      else { chi = 3; nong = 0.2; ji = 0.3; }
    };
    switch (reason) {
      case '매매':
        if (receiverQty === 1) oneHouse();
        else if (receiverQty === 2) { if (jojung) { chi = 8; nong = 0.6; ji = 0.4; } else oneHouse(); }
        else if (receiverQty === 3) { if (jojung) { chi = 12; nong = 1; ji = 0.4; } else { chi = 8; nong = 0.6; ji = 0.4; } }
        else if (receiverQty === 4) { chi = 12; nong = 1; ji = 0.4; }
        if (corp) { chi = 12; nong = 1; ji = 0.4; }
        if (!corp && price <= 100000000) { chi = 1; nong = 0.2; ji = 0.1; }
        if (corp && junggwaExclude && price <= 200000000) { chi = 1; nong = 0.2; ji = 0.1; }
        break;
      case '상속':
        chi = 2.8; nong = 0.2; ji = 0.16;
        if (receiverQty === 1) chi = 0.8;
        break;
      case '원시': chi = 2.8; nong = 0.2; ji = 0.16; break;
      case '증여':
        chi = 3.5; nong = 0.2; ji = 0.3;
        if (jojung && presenterQty > 1 && price >= 300000000) { chi = 12.0; nong = 1; ji = 0.4; }
        break;
    }
    if (!excessGungmin) nong = 0;   // 전용 85㎡ 이하 — 농특세 없음
    return R(chi, ji, nong);
  }

  // HouseActivity.updateValue() — dTot = chi + nong + ji (이 순서), 금액 = dTot × price / 100.0
  const total = r => r.chi + r.nong + r.ji;
  const amount = (r, price) => total(r) * price / 100.0;

  function dealTax(type, amountManwon, area) {
    const price = amountManwon * 10000;
    let r;
    if (type === 'apt') r = houseRate('매매', 1, 1, false, false, area > 85, price, false);
    else if (type === 'office') r = etcRate('매매');
    else return null;
    return { rate: total(r), tax: amount(r, price) };
  }

  const AcqTax = { houseRate, etcRate, amount, total, dealTax };
  if (typeof module !== 'undefined' && module.exports) module.exports = AcqTax;
  else (root.Calc = root.Calc || {}).acqtax = AcqTax;
})(typeof window !== 'undefined' ? window : globalThis);
