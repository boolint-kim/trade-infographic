#!/bin/bash
# =============================================================================
# 렌더 점검 — 페이지를 헤드리스 Chrome 으로 실제 렌더해 오류를 모은다 (창 안 뜸)
#
# 사용:
#   ./check.sh                              # 전 페이지 (*.html, 약 2분)
#   ./check.sh heatmap.html?type=apt-rent   # 지정 페이지만 (쿼리 문자열 가능, 여러 개 가능)
#
# 페이지마다 보는 것:
#   1) 콘솔 오류 — Uncaught·TypeError·ReferenceError·리소스 4xx/5xx (favicon 제외)
#   2) DOM 에 "로딩 실패" — heatmap.html 은 fetch 실패를 콘솔이 아니라 화면에만 쓴다
#   3) 페이지가 참조하는 data/*.json 이 실제로 있는지 (정적 검사, 쿼리로 바뀌는 경로도 포함)
# heatmap.html 은 범례 기간·단지 통계를 한 줄 보여준다(데이터가 실제로 들어갔는지 눈으로 확인용).
#   통계가 비어 있으면(=draw() 가 그리지 못함) FAIL
#
# 종료 코드: 전부 OK 면 0, 하나라도 FAIL 이면 1
# 네이버 지도 SDK 는 등록 도메인에서만 인증된다 — 로컬에서 나는 지도 인증 오류는 무시한다
# =============================================================================

set -uo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="${TMPDIR:-/tmp}/ti-check-chrome-profile"   # 재사용(지우지 않음)
BUDGET_MS=8000      # 가상 시간 예산 — fetch·차트 렌더를 기다리는 시간
TIMEOUT_S=30        # 페이지당 실제 시간 상한
IGNORE='favicon|oapi\.map\.naver\.com|navermaps|NAVER Maps|Authentication Failed'

[ -x "$CHROME" ] || { echo "Chrome 없음: $CHROME"; exit 2; }
mkdir -p "$PROFILE"

# --- 로컬 서버 (file:// 는 fetch 가 막힌다) — 빈 포트를 잡아 띄우고 끝나면 내린다 ---
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])')
# no-store — 재사용하는 Chrome 프로필이 휴리스틱 캐시로 고치기 전 파일을 보여주는 것을 막는다(2026-10-16 실제로 겪음)
python3 -c '
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
' "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT
for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
  sleep 0.1
done

# --- 대상 페이지 ---
if [ $# -gt 0 ]; then PAGES=("$@"); else PAGES=(*.html); fi

FAIL=0
for page in "${PAGES[@]}"; do
  file="${page%%\?*}"
  if [ ! -f "$file" ]; then
    echo "FAIL $page: 파일 없음"; FAIL=1; continue
  fi

  problems=""

  # 3) 참조 JSON 존재 여부
  for j in $(grep -oE "data/[A-Za-z0-9_.-]+\.json" "$file" | sort -u); do
    [ -f "$j" ] || problems+=" [JSON 없음 $j]"
  done
  # heatmap 은 ?type= 에 따라 읽는 파일만 실제로 필요하다 → 없는 파일은 렌더 결과로 판정
  if [ "$file" = "heatmap.html" ]; then problems=""; fi

  # 1)·2) 렌더 — stdout 은 DOM, stderr 는 콘솔 로그
  errfile="$PROFILE/stderr.log"
  dom=$(perl -e 'alarm shift; exec @ARGV' "$TIMEOUT_S" "$CHROME" --headless=new --disable-gpu --no-first-run \
    --user-data-dir="$PROFILE" --enable-logging=stderr --v=0 --virtual-time-budget="$BUDGET_MS" \
    --dump-dom "http://127.0.0.1:$PORT/$page" 2>"$errfile")
  rc=$?
  [ $rc -ne 0 ] && problems+=" [Chrome 종료코드 $rc — 시간초과?]"

  errs=$(grep CONSOLE "$errfile" | grep -vE "$IGNORE" \
    | grep -E ':ERROR:CONSOLE|Uncaught|TypeError|ReferenceError|status of [45][0-9][0-9]' \
    | sed -E 's/.*CONSOLE\([0-9]+\)\] *//' | cut -c1-160)
  [ -n "$errs" ] && problems+=" [콘솔] $(echo "$errs" | tr '\n' ' ')"
  # <script> 소스에도 같은 문구가 있으므로 스크립트를 걷어낸 DOM 에서 찾는다
  echo "$dom" | perl -0pe 's/<script\b.*?<\/script>//gs' | grep -q "로딩 실패" && problems+=" [화면: 데이터 로딩 실패]"

  # heatmap 요약 — 범례 기간 + 단지 통계
  info=""
  if [ "$file" = "heatmap.html" ]; then
    period=$(echo "$dom" | perl -ne 'print $1 if /id="legendPeriod"[^>]*>([^<]*)</')
    # #stats 는 draw() 가 끝까지 돌아야 채워진다 → 비어 있으면 지도에 점이 하나도 안 그려진 것
    stats=$(echo "$dom" | perl -0ne 'if (/id="stats"[^>]*>((?:<div class="(?:big|sub)"[^>]*>.*?<\/div>)*)<\/div>/s) { $_=$1; s/<[^>]+>/ /g; s/\s+/ /g; print }')
    [ -z "$stats" ] && problems+=" [지도에 아무것도 안 그려짐 — #stats 비어 있음]"
    info=" — ${period:-기간 없음} /${stats}"
  fi

  if [ -n "$problems" ]; then
    echo "FAIL $page:$problems"; FAIL=1
  else
    echo "OK   $page$info"
  fi
done

exit $FAIL
