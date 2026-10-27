#!/bin/bash
# 계산 모듈 패리티 — 각 계산기 앱의 Android 정본 Java 파일을 그대로 컴파일해 calc/*.js 와 결과 double 비트를 비교한다
# 사용: calc/parity/run.sh   (JDK·node 필요, 창 안 뜸. 출력물은 $TMPDIR). 하나라도 어긋나면 종료코드 1
#   중개보수 ← RealEstateCal helper/CalHelper.java
#   취득세   ← AcqTax Utils.java (+ vo/AcqTaxVo.java). 금액 합계식은 HouseActivity.updateValue() 를 하네스가 같은 순서로 따라 한다
#   전월세   ← JunseWolse Utils.java (calWolse·calJunse·calDeposits_*). RateConfig 는 Android 의존이라 대조 밖(식: 기준금리 + 가산)
set -euo pipefail
cd "$(dirname "$0")"
OUT="${TMPDIR:-/tmp}/calc-parity"
mkdir -p "$OUT"
RC=0

echo "[중개보수]"
SRC=~/AndroidStudioProjects/RealEstateCal/app/src/main/java/com/boolint/realestatecal
javac -encoding UTF-8 -d "$OUT/brokerage" stub/com/boolint/realestatecal/Utils.java \
  "$SRC/helper/CalHelper.java" "$SRC/vo/FeeRateitemVo.java" "$SRC/vo/MessageVo.java" BrokerageParity.java
java -Djava.awt.headless=true -cp "$OUT/brokerage" BrokerageParity > "$OUT/brokerage.tsv"
node brokerage-parity.js < "$OUT/brokerage.tsv" || RC=1

echo "[취득세]"
SRC=~/AndroidStudioProjects/AcqTax/app/src/main/java/com/boolint/acqtax
javac -encoding UTF-8 -d "$OUT/acqtax" "$SRC/Utils.java" "$SRC/vo/AcqTaxVo.java" AcqTaxParity.java
java -Djava.awt.headless=true -cp "$OUT/acqtax" AcqTaxParity > "$OUT/acqtax.tsv"
node acqtax-parity.js < "$OUT/acqtax.tsv" || RC=1

echo "[전월세 전환]"
SRC=~/AndroidStudioProjects/JunseWolse/app/src/main/java/com/boolint/junsewolse
javac -encoding UTF-8 -d "$OUT/junsewolse" "$SRC/Utils.java" JunseWolseParity.java
java -Djava.awt.headless=true -cp "$OUT/junsewolse" JunseWolseParity > "$OUT/junsewolse.tsv"
node junsewolse-parity.js < "$OUT/junsewolse.tsv" || RC=1

exit $RC
