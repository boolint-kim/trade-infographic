// Java 출력을 읽어 gifttax.js 로 같은 입력을 계산해 비트까지 비교한다
const GT = require('../gifttax.js');
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const dv = new DataView(new ArrayBuffer(8));
const bits = x => { dv.setFloat64(0, x); return dv.getBigInt64(0).toString(); };
const num = b => { dv.setBigInt64(0, BigInt(b)); return dv.getFloat64(0); };
const T = s => s === 'true';
let bad = 0;
for (const l of lines) {
  const f = l.split('\t');
  let got, want;
  if (f[0] === 'G') {
    const r = GT.giftTax({ presenter: f[1], giftAmount: num(f[2]), marriageBirth: num(f[3]), noTax: num(f[4]), burden: num(f[5]), alreadyGift: num(f[6]),
      alreadyPaid: num(f[7]), appraisal: num(f[8]), grandSon: T(f[9]), minor: T(f[10]), jagyung: T(f[11]), priorTaxBase: num(f[12]) });
    got = [r.finalTax, r.calc34, r.priorCredit].map(bits); want = f.slice(13, 16);
  } else if (f[0] === 'H') {
    const r = GT.giftAcqHouse(num(f[1]), +f[2], T(f[3]), T(f[4]), num(f[5]), num(f[6]), T(f[7]));
    got = [r.chi, r.tax].map(bits); want = f.slice(8, 10);
  } else { got = [bits(GT.giftAcqEtc(num(f[1])).tax)]; want = [f[2]]; }
  if (got.join() !== want.join() && bad++ < 10) console.log('불일치', l.slice(0, 160), '\n  java', want.map(num), 'js', got.map(num));
}
console.log(`${lines.length}건 중 불일치 ${bad}`);
process.exit(bad ? 1 : 0);
