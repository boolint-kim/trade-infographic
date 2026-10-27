#!/bin/bash
# 중개보수 패리티 — RealEstateCal Android 정본 CalHelper.java ↔ calc/brokerage.js, 결과 double 비트 비교
# 사용: calc/parity/run.sh   (JDK·node 필요, 창 안 뜸. 출력물은 $TMPDIR)
set -euo pipefail
cd "$(dirname "$0")"
SRC=~/AndroidStudioProjects/RealEstateCal/app/src/main/java/com/boolint/realestatecal
OUT="${TMPDIR:-/tmp}/brokerage-parity"
mkdir -p "$OUT"
javac -encoding UTF-8 -d "$OUT" stub/com/boolint/realestatecal/Utils.java \
  "$SRC/helper/CalHelper.java" "$SRC/vo/FeeRateitemVo.java" "$SRC/vo/MessageVo.java" BrokerageParity.java
java -Djava.awt.headless=true -cp "$OUT" BrokerageParity > "$OUT/java.tsv"
node parity.js < "$OUT/java.tsv"
