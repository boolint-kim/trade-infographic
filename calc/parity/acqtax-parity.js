// Java 출력(입력 + 세율·합계 비트)을 읽어 acqtax.js 로 같은 입력을 계산해 비트까지 비교한다
const A = require('../acqtax.js');
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const dv = new DataView(new ArrayBuffer(8));
const bits = x => { dv.setFloat64(0, x); return dv.getBigInt64(0).toString(); };
const num = b => { dv.setBigInt64(0, BigInt(b)); return dv.getFloat64(0); };
let bad = 0;
for (const l of lines) {
  const [key, ...want] = l.split('\t');
  const k = key.split('|');
  let r, price = 0;
  if (k[0] === 'etc') r = A.etcRate(k[1]);
  else { price = num(k[7]); r = A.houseRate(k[1], +k[2], +k[3], k[4] === 'true', k[5] === 'true', k[6] === 'true', price, k[8] === 'true'); }
  const got = [bits(r.chi), bits(r.ji), bits(r.nong), bits(A.amount(r, price))];
  if (got.join() !== want.join()) { if (bad++ < 10) console.log('불일치', key, 'java', want.map(num), 'js', got.map(num)); }
}
console.log(`${lines.length}건 중 불일치 ${bad}`);
process.exit(bad ? 1 : 0);
