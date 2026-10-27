// Java 출력을 읽어 junsewolse.js 로 같은 입력을 계산해 비트까지 비교한다
const JW = require('../junsewolse.js');
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const dv = new DataView(new ArrayBuffer(8));
const bits = x => { dv.setFloat64(0, x); return dv.getBigInt64(0).toString(); };
const num = b => { dv.setBigInt64(0, BigInt(b)); return dv.getFloat64(0); };
let bad = 0;
for (const l of lines) {
  const f = l.split('\t');
  let ok;
  if (f[0] === 'W') ok = bits(JW.wolse(num(f[1]), num(f[2]), num(f[3]))) === f[4];
  else if (f[0] === 'J') ok = bits(JW.junse(num(f[1]), num(f[2]), num(f[3]))) === f[4];
  else { const l2 = JW.deposits(num(f[2]), +f[1] * 10000); ok = l2.length === +f[3] && l2.map(bits).map(x => x + ',').join('') === (f[4] || ''); }
  if (!ok && bad++ < 10) console.log('불일치', l.slice(0, 120));
}
console.log(`${lines.length}건 중 불일치 ${bad}`);
process.exit(bad ? 1 : 0);
