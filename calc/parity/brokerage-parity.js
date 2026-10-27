// Java 출력(입력 + 결과 비트)을 읽어 같은 입력을 brokerage.js 로 계산하고 비트까지 비교한다
const B = require('../brokerage.js');
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const buf = new DataView(new ArrayBuffer(8));
let bad = 0;
for (const l of lines) {
  const [o, t, p1, p2, bits] = l.split('\t');
  buf.setFloat64(0, B.fee(o, t, +p1, +p2));
  const js = buf.getBigInt64(0).toString();
  if (js !== bits) { if (bad++ < 10) { buf.setBigInt64(0, BigInt(bits)); console.log('불일치', o, t, p1, p2, 'java', buf.getFloat64(0), 'js', B.fee(o, t, +p1, +p2)); } }
}
console.log(`${lines.length}건 중 불일치 ${bad}`);
process.exit(bad ? 1 : 0);
