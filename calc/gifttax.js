// 증여세 + 증여 취득세 — GiftTax Android `taxutil/GiftTax.java`(숫자 계산 전체)와 `taxutil/AcqTax.java`(증여 분기)를 옮긴 것(정본은 Android)
// 식을 바꾸면 Android 를 먼저 고치고(iOS 는 GiftTax iOS Tools/parity) 여기를 맞춘 뒤 `calc/parity/run.sh` 를 돌린다
// 플랫폼 계획: ~/server/trade-serve/docs/platform-plan.md §12
//
//   GT.giftTax({presenter, giftAmount, marriageBirth, noTax, burden, alreadyGift, alreadyPaid, appraisal, grandSon, minor, jagyung, priorTaxBase})
//     → {finalTax, calc34, taxableBase, deduction, taxRate, priorCredit, voluntary} (원). presenter = 'SPOUSE'|'ANCESTOR'|'DESCENDANT'|'RELATIVE'|'ETC'
//        (증여자가 수증자의 무엇인가 — 부모가 자녀에게 = 'ANCESTOR')
//   GT.giftAcqHouse(buyPrice, presenterQty, jojung, excessGungmin, totalHousePrice, standardPrice, spouseOrLineal) → {chi, ji, nong, total(%), tax(원)}
//   GT.giftAcqEtc(buyPrice) → 같은 모양 — 오피스텔·건물·토지(농지 제외)
//   ⚠️ 취득세는 증여(GIFT) 분기만 옮겼다. 매매·상속 분기는 calc/acqtax.js(AcqTax 앱 정본)를 쓴다
(function (root) {
  const DEDUCTION = { SPOUSE: 600000000, ANCESTOR: 50000000, DESCENDANT: 50000000, RELATIVE: 10000000, ETC: 0 };

  // GiftTax.calculateGiftTaxData() 의 숫자 부분 — 같은 순서의 double 연산
  function giftTax(o) {
    const giftAmount = o.giftAmount, noTax = o.noTax || 0, burden = o.burden || 0, alreadyGift = o.alreadyGift || 0;
    const alreadyPaid = o.alreadyPaid || 0, minor = !!o.minor, grandSon = !!o.grandSon, jagyung = !!o.jagyung;
    const priorTaxBase = o.priorTaxBase == null ? -1 : o.priorTaxBase;
    let appraisal = o.appraisal || 0, marriage = o.marriageBirth || 0;

    const taxableValue = giftAmount - noTax - burden + alreadyGift;
    let deduction = DEDUCTION[o.presenter];
    if (deduction == null) deduction = 0;
    if (o.presenter === 'ANCESTOR' && minor) deduction = 20000000;
    if (appraisal > 5000000) appraisal = 5000000;
    if (marriage > 100000000) marriage = 100000000;
    const taxableBase = Math.max(0, taxableValue - deduction - appraisal - marriage);
    const stop = taxableBase < 500000;   // 과세표준 50만원 미만 과세 제외(상증법 55조②)

    let prog, rate;
    if (taxableBase <= 100000000.0) { prog = 0; rate = 0.1; }
    else if (taxableBase <= 500000000.0) { prog = 10000000; rate = 0.2; }
    else if (taxableBase <= 1000000000.0) { prog = 60000000; rate = 0.3; }
    else if (taxableBase <= 3000000000.0) { prog = 160000000; rate = 0.4; }
    else { prog = 460000000; rate = 0.5; }
    const calc32 = (taxableBase * rate) - prog;
    let extra = 0;
    if (grandSon) { extra = calc32 * 0.3; if (minor && giftAmount > 2000000000) extra = calc32 * 0.4; }
    const calc34 = calc32 + extra;
    const jag = jagyung ? (calc34 <= 100000000 ? calc34 : 100000000) : 0;
    const priorBase = priorTaxBase >= 0 ? priorTaxBase : Math.max(0, alreadyGift - deduction);
    const creditLimit = taxableBase > 0 ? calc34 * Math.min(priorBase, taxableBase) / taxableBase : 0;
    const priorCredit = Math.min(alreadyPaid, creditLimit);
    const after = Math.max(0, calc34 - jag - priorCredit);
    const voluntary = after * 0.03;
    const finalTax = stop ? 0 : after - voluntary;
    return { finalTax, calc34, taxableBase, deduction, taxRate: rate, priorCredit, voluntary, stop };
  }

  // AcqTax.setHouseData(…, GIFT, …) — 조정대상지역 + 시가표준액 3억 이상이면 12% 중과, 예외는 1세대1주택자가 배우자·직계존비속에게 줄 때
  function giftAcqHouse(buyPrice, presenterQty, jojung, excessGungmin, totalHousePrice, standardPrice, spouseOrLineal) {
    const ratePrice = totalHousePrice > 0 ? totalHousePrice : buyPrice;
    const judgePrice = standardPrice > 0 ? standardPrice : ratePrice;
    let chi = 3.5, nong = 0.2, ji = 0.3;
    if (jojung && judgePrice >= 300000000) {
      const exempt = presenterQty <= 1 && spouseOrLineal;
      if (!exempt) { chi = 12.0; nong = 1; ji = 0.4; }
    }
    if (!excessGungmin) nong = 0;
    return pack(chi, ji, nong, buyPrice);
  }
  // AcqTax.setEtcData(…, GIFT)
  const giftAcqEtc = buyPrice => pack(3.5, 0.3, 0.2, buyPrice);
  // totalRate = chi + ji + nong (이 순서 — AcqTax 앱의 chi+nong+ji 와 다르다), totalPrice = totalRate × buyPrice / 100
  function pack(chi, ji, nong, buyPrice) {
    const total = chi + ji + nong;
    return { chi, ji, nong, total, tax: total * buyPrice / 100.0 };
  }

  const GT = { giftTax, giftAcqHouse, giftAcqEtc };
  if (typeof module !== 'undefined' && module.exports) module.exports = GT;
  else (root.Calc = root.Calc || {}).gifttax = GT;
})(typeof window !== 'undefined' ? window : globalThis);
