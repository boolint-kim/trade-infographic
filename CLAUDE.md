# trade-infographic — 부동산 실거래가 인포그래픽 (정적 사이트)

> 2026-10-16 정합성 조사에서 초안 작성 → 같은 날 검토·보완(파일 수·생성기·할 일 상태를 실물로 대조).
> 변경 이력은 `HISTORY.md`(2026-03-23 시점, 13종·12 JSON 기준 — 보관용, 현황 판단에 쓰지 말 것).

## ★ 다음 세션 시작점 (2026-10-28 갱신) — 이 폴더에서 연다
10-27 에 플랫폼 5번(단지 상세 `complex` + 계산 모듈 4종)을 끝냈고 10-28 아침 라이브 확인 완료.
10-28 에 **R2 쓰기 절감 v0.5**(단지 파일 15만 개 → 읍면동 묶음, 계약 `~/server/trade-serve/docs/contract.md` §9)를 만들었다 — **10-28 20:00 파이프라인이 처음으로 전환한다.**
1. ✅ **v0.5 전환 확인 완료(10-29)** — PUT 8,694 · DELETE 151,580 · 실패 0(13분), 옛 c/ 404, 묶음·시군구 요약·PNU umd 맵 라이브, 은마·화성(단서 없이)·PNU 후보 렌더 OK
   - `grep -E "PUT|DELETE|완료 —" ~/server/trade-collector/logs/pipeline_20261028_*.log | tail -5` → 이 날만 PUT 약 8,500 · DELETE 약 15만(옛 `c/`, 무료). 상한 가드(3만)에 안 걸려야 한다
   - 라이브: https://chart.boolint.com/complex?key=apt:11680-218 이 읍면동 묶음으로 열리는가(개발자 도구 네트워크에 `umd/1168010600/rows`) · `curl -s -o /dev/null -w '%{http_code}' https://trade-kr.boolint.com/v1/c/apt:11680-218` → 404
   - 랭킹·신고가 행 클릭, 히트맵 팝업 링크(둘 다 `&sgg=` 단서를 단다)
2. **10-30 아침 PUT 수** — 전환 다음 날부터가 평소 값. 예상 약 4,000(읍면동 통계 1,800 + 행 묶음 1,800 + 시군구·색인). 월초(11-01)는 asOf 가 바뀌어 전 파일(약 8,700)
   - 혼합안(10-28 사용자 결정): `sgg/{5}.json` 에도 전 단지 `summaries` — 구·여러 구 비교용. 확인: `curl -s --compressed https://trade-kr.boolint.com/v1/sgg/11680 | python3 -c "import json,sys;print(len(json.load(sys.stdin)['summaries']))"` → 약 1,037
3. **사용자 폰 확인 의견 반영** — 특히 큰 동(대치동 등) 단지가 무겁지 않은지, 단지 고르기 화면(시군구 파일이 49KB → 253KB 로 커졌다)이 느리지 않은지. 고르기는 받은 요약으로 목록에 최근 시세를 보여 주는 안(추천)과 요약 파일 분리(PUT +255/일) 중 고른다. 무거우면 **행 묶음 36개월 분할**(Fable 제안, 보류 중 — 최대 1.46MB → 546KB, PUT +7%)
4. **계산 모듈 5호 양도세 시나리오 — 제안만 하고 사용자 검토 중(10-29)**. 사용자가 정하면 시작
   - 방식: **시나리오 표**(추천, 사용자 동의) — 이 면적 최근 거래 = "지금 판다면", 같은 면적 1·3·5·10년 전 거래 중앙값 = "그때 샀다면" → 연도별 차익·양도세. 거래 행 클릭형은 TransTax 앱 연결로 대신
   - 가정 제안(한 묶음): **1세대 1주택 · 산 날부터 계속 거주 · 단독명의 · 다주택은 표시 안 함**(양도세 계산기로 연결) · **필요경비 = 취득세 + 사고팔 때 중개보수**(calc 모듈로) · **현행 확정 세법만**(정본의 "2026 세제개편안 미리보기" 모드는 끔)
   - ⚠️ **다주택 중과 유예는 2026-05-09 양도분까지로 끝났다**(정본 `CalHouse.java` 246~267행). 10-28 대화에서 "유예 중"이라고 잘못 말했다 — 다주택을 넣으려면 조정대상지역 목록이 필요하다
   - 정본 TransTax `taxutil/CalHouse.java`(869줄, 입력: 양도일·양도가·양도경비·취득일·취득가·취득경비·부담부채무·명의자 수·기본공제 제외·주택 수·조정지역·거주조건·거주연수, 분양권은 `CalSoldNote`). 패리티는 `calc/parity/` 의 다른 넷과 같은 방식(`android.util.Log` 는 `stub/` 대역)
5. 그다음 플랫폼 4번 **PropertyTax 네이티브 카드** — `~/AndroidStudioProjects/PropertyTax` 에서 시작. v0.5 기준: PNU → `idx/pnu/{sgg}`(키 + `umd` 맵) → `umd/{10}` 의 `summaries[key]` 한 파일
- 계산 모듈 규칙은 아래 "계산 모듈 `calc/`" 절. 웹 API 는 `trade-api.js` 한 곳(키 → 읍면동 찾기 포함), 로컬 시험은 `?api=local` + 목 서버(Worker 와 같은 경로 규칙으로 collector `data/serve` 를 준다)

## ★ 현황 (2026-10-18) — 재설계(B안) 컷오버 완료: 대시보드 7 + 특화 5 + 지도
- **옛 지표 43페이지(`infographic-*.html`)는 2026-10-18 삭제**했다. 옛 주소는 `_redirects`(86줄 = 43개 × `.html`·확장자 없는 형태)가 새 섹션으로 301 한다.
  출시 앱(AptTradeChart·OfficeTradeChart·TransTax A+i)의 허브가 옛 `.html` 주소를 하드코딩하지만 앱 출시 없이 이어진다(같은 호스트 리다이렉트는 앱 허용 목록 통과)
  - ⚠️ Cloudflare Pages 는 `/x.html` 을 **308 → `/x`** 로 넘긴다(쿼리 유지). 그래서 `_redirects` 는 옛 주소를 두 형태 다 받고, 목적지는 확장자 없는 주소로 쓴다
  - 남은 일(선택): 앱 허브를 새 주소로 바꾸고 `?sgg=` 를 넘기기(단계 6) — 05-checklist
  - ★ **앱 노출(어느 앱에 메뉴를 보일지 · 앱별 카드 · 베타 철수 스위치)은 `~/server/app-data/infographic/` 이 주관한다**(2026-10-19 결정, 설계 진행 중).
    이 레포는 페이지와 주소 계약(섹션 id·`?sido=&sgg=`·IS_APP·브리지)만 맡는다. 철수할 때도 이 사이트는 **종료 안내 페이지**로 남긴다(게이트 없는 출시 앱 3개가 옛 주소로 들어온다)
- **작업 문서(정본)**: `~/server/trade-collector/docs/infographic-redesign/` — `00-README.md`(결론·대응표) · `01-common.md`(파라미터 계약·JSON 스키마) · `02~04`(섹션 스펙) · **`05-checklist.md`(진행 기록)**
- 배경(2026-10-17 평가): 옛 43페이지 중 유지 9 · 재설계 25 · 폐기 9. 원인은 시도×연도 단순평균·지표 하나=페이지 하나·노이즈 평균·신고 지연
- 원칙: **시군구가 단위**(`?sido=&sgg=`) · 평균 대신 **중앙값** + p25~p75 · 총액 대신 **평당가** · 전세가율·수익률은 **같은 단지·같은 면적 짝** · 신고 중인 최근 달(아파트 2개월·연립 3개월)은 회색, 올해는 "1~N월"
- 02:00 파이프라인이 `git add -A` + push 하므로 **문법 오류 상태로 하루를 끝내지 말 것**(`./check.sh`)

## 이 레포가 무엇인가
- 정적 HTML 14개(+ `404.html`) + `_redirects` + `data/` JSON 약 210개(대부분 시도별 분할). 빌드 단계 없음. GitHub push → Cloudflare Pages 자동 배포
  - `404.html` 은 2026-10-17 추가. **없으면 Pages 가 없는 경로에 index.html 을 200 으로 내준다**(SPA 폴백) — 삭제한 페이지 주소가 허브로 열려 깨진 링크를 못 알아챈다. 지우지 말 것
  (2026-10-16 저녁: 전월세 히트맵 JSON 3종 추가, 양도세 이벤트 페이지 `infographic-event-cgt.html` 삭제 — 만료 5개월 경과, 앱 허브 4곳 어디도 링크 안 함)
  - https://trade-infographic.pages.dev/ · 같은 배포가 https://chart.boolint.com/ 로도 나간다(히트맵 앱 임베드용)
- **데이터는 이 레포가 만들지 않는다.** `~/server/trade-collector` 의 파이프라인(`run-pipeline.sh`)이
  매일 `data/*.json` 을 복사해 넣고 `git add -A` → 커밋 → push 까지 한다(launchd 데일리 02:00, 덮개가 닫혀 있으면 아침에 열 때).
  ⚠️ **`git add -A` 와 push 라서, 이 레포에 커밋 안 한 작업·push 안 한 커밋이 있으면 그 실행에 같이 올라간다.**
  HTML 작업은 그날 안에 커밋까지 끝내거나 브랜치에서 할 것(파이프라인은 현재 브랜치에서 커밋한다)
  → `data/` 는 기계가 쓰는 폴더다. **손으로 고치지 말 것**(다음 배포 때 덮인다)
- 이 레포에서 하는 일은 HTML·JS·CSS 뿐. JSON 의 모양(키·기간)을 바꾸려면 trade-collector 의 `src/generate-*.js` 를 고친다
- 연결은 한 방향 한 지점(collector → data/*.json + push). 그 밖에 공유하는 코드는 없다

## 페이지 ↔ JSON ↔ 생성 스크립트
| 페이지 | JSON | 생성 스크립트 (trade-collector/src) |
|---|---|---|
| apt · office · multi · right · single · land · building.html (물건별 대시보드) | dash-<물건>-all.json · dash-<물건>-<시도>.json ×16 | generate-dash-<물건>.js → src/lib/dash-builder.js (+ stats·dash-common·match) |
| ranking.html?type=apt\|office\|right | dash-ranking-<type>-all.json · -<시도>.json | generate-dash-ranking.js |
| new-high.html · cancel.html · hotspot.html | dash-events-all.json · dash-events-<시도>.json | generate-dash-events.js |
| today.html?type=deal\|jeonse\|wolse | dash-today-all.json · dash-today-<시도>.json | generate-dash-today.js (어제 스냅샷 collector/data/snapshots/) |
| heatmap.html | heatmap.json<br>heatmap-office.json · heatmap-multi.json<br>heatmap-rent.json · heatmap-office-rent.json · heatmap-multi-rent.json | generate-heatmap-json.js<br>generate-heatmap-layers-json.js<br>generate-heatmap-rent-json.js |
| complex.html?key=…\|pnu=… (단지 상세, 2026-10-27 시범) | **이 레포 data/ 가 아니다** — `https://trade-kr.boolint.com/v1/` 의 `c/{key}`·`c/{key}/summary`·`idx/pnu/{sgg}`·`sgg/{sgg}`(고르기) | trade-collector `generate-serve.js` → R2 → Worker `trade-kr`(계약 `~/server/trade-serve/docs/contract.md`) |
| index.html · 404.html | (없음) | - |

- 페이지는 `<시도>-all.json`(시도·시군구 목록 + 시도 요약)을 먼저 받고, 시도를 고를 때 그 시도 파일 하나를 받는다. 시군구 전환은 fetch 없이 `regions[sgg]`
- 섹션 id 가 곧 해시다(`apt#yield`). `_redirects` 의 목적지가 이 해시를 쓰므로 **섹션 id 를 바꾸지 말 것**
- 페이지를 추가하면 index 에도 넣을 것(지금 카드 15장: 물건 7 · 거래 목록·사건 6(단지 실거래가 포함) · 지도 2)
- **complex.html**(플랫폼 5번, 2026-10-27): `?key=apt:11680-218` · `?pnu=<19자리>`(여럿이면 후보 목록) · 없으면 시군구 → 이름 고르기. `&area=84`(전용 반올림 ㎡ = 요약 `areaKey`) `&tab=deal|jeonse|wolse`.
  API 호출은 `trade-api.js` 한 곳(compare·search 도 이걸 쓴다). **숫자 카드는 요약 조각 그대로**(계산 정본은 collector) — 페이지는 행을 거르기만 한다. 행은 반드시 `cols` 로 읽는다(`TradeApi.rows`).
  **기존 페이지의 단지 행 클릭 → complex**(2026-10-27): `dash.js complexClick` 이 행의 `k`(collector 가 넣는 단지 키) + `area` 로 이동한다. 웹·앱 공통(앱도 브리지 대신 페이지 이동 — 사용자 결정). `k` 가 없는 행만 옛 `AndroidBridge.onComplexClick`. heatmap 팝업도 같은 날 연결 — 점의 `k` 가 있으면 "실거래 전체 보기 →"(전월세 지도는 `&tab=jeonse`), 브리지 payload 에 `key` 추가. 연립다세대 점은 키 없음
  금액은 `33억 4,000` 형식(`Dash.eok` 은 억 반올림이라 거래끼리 구분이 안 된다 — 차트 축만 eok 류). 시군구 이름은 서빙 파일에 없어 `data/dash-apt-all.json` 을 빌린다

## 계산 모듈 `calc/` (2026-10-27~ — 계산기 앱의 결과를 단지 상세에, 플랫폼 계획 §12)
- **정본은 각 계산기 앱의 Android 코드**다. 여기는 그대로 옮긴 JS 순수 함수 + 패리티 테스트(정본 Java 파일을 그대로 컴파일해 결과 double 비트 비교)
- `calc/brokerage.js` ← RealEstateCal `helper/CalHelper.java`(중개보수 상한). `calc/parity/run.sh` — 12,624건 불일치 0(2026-10-27). complex 거래 목록의 "중개보수" 열(아파트=주택, 오피스텔=주거용, 분양권 제외)
- `calc/acqtax.js` ← AcqTax `Utils.java`(getAcqTaxRateHouse·Etc 전체) + `HouseActivity.updateValue()` 합계식. 패리티 38,005건 불일치 0(모든 사유·주택 수·조정·법인·85㎡·가격 경계). complex 매매 목록의 "취득세" 열 = **아파트 1주택 매매**(2026-10-27 사용자 결정, 조정 여부 무관이라 목록 불필요)·오피스텔 4.6%, 분양권 제외
- `calc/junsewolse.js` ← JunseWolse `Utils.java`(calWolse·calJunse·calDeposits_*, 12,027건 불일치 0) + `RateConfig`(기준금리+2%p — Android 의존이라 식·검증 규칙만 옮김, 대조 밖). 법정 기준금리는 app-data `junsewolse/rates.json`(CORS 열림), 실패면 번들값 — **기준금리가 바뀌면 rates.json·앱 번들값·이 파일 BUNDLE 세 곳**. complex 의 "전월세 전환" 섹션(#convert): 시장 전환율(요약 convRate) vs 법정 상한, 전세 중앙값의 보증금 단계별 월세
- `calc/gifttax.js` ← GiftTax `taxutil/GiftTax.java`(숫자 계산 전체) + `taxutil/AcqTax.java`(증여 분기만 — 매매·상속은 acqtax.js). 패리티는 GiftTax iOS 도구처럼 taxutil 패키지를 통째로 컴파일, 16,000건 불일치 0.
  complex 의 "자녀에게 증여하면" 섹션(#gift): 시가 = 유사매매사례(같은 단지·같은 면적, 오늘 전 6개월 가장 최근 유효 거래 — 실제 요건 일부만), 성인·미성년 자녀 두 줄. 가정(2026-10-27 사용자 결정): 부모→자녀·채무 없음·10년 내 증여 없음·부모 1주택(취득세 중과 예외)
- 앱 쪽 요율·식을 고치면 → 여기를 맞추고 `run.sh`(네 계산 모두 돈다). 순서: 중개보수 ✓ → 취득세 ✓ → 전월세 전환 ✓ → 증여세 ✓ → 양도세

## 공통 인프라 (새 페이지도 이걸 쓴다)
- **대시보드 JS**: `region-select.js`(시도 버튼 + 시군구 select, URL `?sido=&sgg=` 계약) · `dash.js`(로드·섹션 네비·칩·카드·표·차트 헬퍼, 단지 행 → `AndroidBridge.onComplexClick`) ·
  `dash-sections.js`(물건 페이지 공용 섹션 렌더러 price·volume·jeonse·yield·wolse·age·size·renewal·pyeong·jimok·factory) · `dash.css`
  - 시도·시군구 이름은 JSON(`-all.json`)이 싣는다 — 페이지에 시도 맵을 박지 않는다(옛 페이지는 46개에 인라인이라 개편 때마다 다 고쳐야 했다)
- **다크모드**: `common.css` 의 CSS 토큰 + `chart-defaults.js` 의 `chartTheme` 헬퍼
- **SelfBanner**: `selfbanner-web.js` — 웹 접속에만 하단 배너, 앱 WebView(`window.IS_APP`)는 제외. 2026-05-22
  - 배너를 그리면 `<html>` 에 CSS 변수 `--sb-h`(실제 배너 높이)를 넣고 닫으면 지운다(2026-10-16). body 패딩은 absolute 요소에 안 먹으므로,
    바닥에 붙는 요소는 `bottom: calc(Npx + var(--sb-h, 0px))` 로 피한다 — heatmap.html 의 범례·힌트·위치 버튼이 이렇게 돼 있다(미디어쿼리 오버라이드 포함)
- **차트**: Chart.js 4.4.0 (jsdelivr CDN, 버전 고정). 막대는 `borderDash` 를 지원하지 않는다 — 미완 월은 회색 + 테두리로
- ⚠️ **문구에 시도 수·연도 범위를 박지 않는다**("전국 17개 시도"·"2016~2026" 이 옛 페이지에 수십 곳 남아 있었다) — 데이터에서 채운다
- **heatmap.html** 은 TradeHeatmap Android 라이브러리가 WebView 로 임베드한다 — `?type=apt-deal` 등 URL 파라미터,
  `window.AndroidBridge`, 외부 호출 함수가 계약이다. 설계 정본: `~/server/trade-collector/docs/android-heatmap/`
  - **매매 ↔ 전월세 전환**(2026-10-20): `?type=` 은 **첫 화면**이다. 페이지 상단 `매매 | 전월세` 버튼 = `window.setTrade('deal'|'rent')`
    (지도·유형 칩·면적·기간 유지, JSON 캐시, `?type=` 을 replaceState 로 갱신). 바뀌면 `AndroidBridge.onTradeChange(trade)` —
    TradeHeatmap 라이브러리가 이걸로 툴바 제목·네이티브 칩을 맞춘다. 두 지도는 색 기준이 달라 **겹쳐 그리지 않는다**
  - **📍 현재 위치 계약**(2026-10-20): 웹은 항상 보인다. 앱 WebView(`IS_APP`)는 **`window.APP_LOCATION===true` 일 때만** 보인다.
    `APP_LOCATION` 은 라이브러리(InfographicHub A+i·TradeHeatmap)가 **주인 앱이 위치 권한을 선언했을 때만** 문서 시작에 넣고, 실행 중 권한 팝업도 라이브러리가 띄운다.
    → 앱에서 위치를 쓰려면 매니페스트(iOS 는 Info.plist `NSLocationWhenInUseUsageDescription`)에 한 줄만 넣으면 된다. 지금 붙인 앱은 전부 선언 안 함 = 숨김(출시 앱도 같다)
  - JSON 스키마(매매·전월세 공통): `{generated, period, months[], total, data:[{n,r,u,x,y,a,c,l?,m?,s?, mo:{yyyymm:{a,c,l?,m?,s?}}}]}`.
    여러 달을 고르면 페이지가 `Σ(mo.a·mo.c)/Σc` 로 합친다(면적대 l/m/s 는 단순평균)
  - **아파트 매매(`heatmap.json`)는 매매 + 분양권·입주권**(2026-10-17~, 호갱노노 매매 목록과 같은 구성).
    해제 제외 → 분양권은 같은 단지 좌표로 모은다. 완전히 같은 행은 **합치지 않는다**(2026-10-17 철회 — 원천이 다른 호실 거래를 같은 행으로 준다). 정본은 `~/server/trade-collector/CLAUDE.md`
  - **전월세 3종의 값은 전월세 환산 보증금 평당가의 중앙값**(2026-10-17~, 매매는 평균). 계약구분(신규·갱신)은 가리지 않는다.
    월세는 `보증금 + 월세×12 ÷ 전환율` 로 바꿔 전세와 한 바구니에 넣는다. 전환율은 **시도 × 유형 시장 전환율**
    (최근 6개월, 같은 단지·면적·월의 전세 중앙값과 월세 짝), 표본 100건 미만이면 **법정 전환율**(기준금리+2%p,
    `~/server/app-data/junsewolse/rates.json` — 전월세 계산기 앱과 같은 파일). JSON 최상위 `conv`(시도→%)·`legalRate`·`legalAsOf`,
    단지 `cr`(쓴 전환율)·`crL`(법정이면 1). 월세 원래 값은 단지·월 `wc`·`wd`·`wr`(건수·보증금·월세 중앙값) — 팝업 표시용.
    `c` 는 전세+월세 건수. 앱 브리지 `onComplexClick` 에 wolseCount·wolseDeposit·wolseRent·conversionRate.
    **색 구간은 절대값**(2026-10-17 사용자 결정): 매매 2,000/3,000/4,000/5,000, 전월세는 그 **절반** 1,000/1,500/2,000/2,500.
    분위수로 맞추지 않는다 — 서울 쏠림이 보여야 한다(매매 서울 밖 82% 파랑, 전월세 서울 밖 59% 파랑).
    범례 글자는 경계값 기준(`<2,000 | 2,000 …`, `<1,000 | 1,000 …`)
    색 구간·문구는 타입별로 다르다(아래 "heatmap 결함 2개")
  - 네이버 지도 SDK(`ncpKeyId`)는 등록 도메인에서만 인증된다. 로컬(127.0.0.1)에서 지도 타일이 안 나와도 데이터 경로 점검은 된다

## 로컬 테스트·정합성 점검
```bash
./check.sh                              # 전 페이지 헤드리스 렌더 (약 1분, 창 안 뜸, 실패 시 종료코드 1)
./check.sh 'heatmap.html?type=apt-rent' # 지정 페이지만 — 쿼리 문자열 가능, 여러 개 가능

# 눈으로 볼 때 (file:// 로는 fetch 가 안 된다)
python3 -m http.server 8765 --bind 127.0.0.1
```
- check.sh 가 보는 것: 콘솔 오류 / 화면의 "로딩 실패"(heatmap 은 fetch 실패를 화면에만 쓴다) /
  참조 JSON 존재 / heatmap 의 `#stats`(비어 있으면 점이 하나도 안 그려진 것). 로컬 서버는 빈 포트로 스스로 띄우고 내린다(no-store)
- 2026-10-18 컷오버 뒤: 15/15 OK (index·404·heatmap + 대시보드 7 + 특화 5)

### heatmap 결함 2개 — 2026-10-16 수정 완료
- **office·multi 타입 빈 지도** (`6a3539c`): `draw()`·`onMapClick()` 이 `layerReady.apt` 를 기다렸는데 이 타입들은 apt 를 로드하지 않았다
  → `anyLayerReady()` 로 교체. 첫 로드(primary) 실패 시 레이어를 끄지 않게도 고쳤다(끄면 '다시 시도' 후에도 빈 지도였다).
  ⚠️ 새 코드에서 "primary = apt" 를 가정하지 말 것 — `?type=` 에 따라 apt 가 아예 안 올 수 있다
- **타입별 색 구간·문구** (`3b5578d`): `TYPE_TO_FILES` 항목의 `bins`·`legend`(정의는 `SCALE_DEAL`·`SCALE_RENT`)를
  색·범례·힌트·로딩·팝업·통계가 읽는다. 매매 2,000/3,000/4,000/5,000(종전 그대로), 전세 700/1,000/1,400/2,000
  (전월세 JSON 3종 단지값 5분위 672/1,003/1,429/2,148 반올림, 2026-10). 분포가 크게 바뀌면 다시 재서 조정할 것
- `#hint` 는 `left:50%` + `nowrap` 이라 좁은 화면에서 상자가 절반 폭으로 잘린다 — 문구를 360px 에 들어가는 길이로 둔다
  (줌 10~12 의 "조금 더 확대하면…" 은 지금도 조금 넘친다, 미수정)

### heatmap 을 깊게 검증할 때 (클릭·이동까지)
- 127.0.0.1 로 열면 네이버 지도가 키 인증에 실패해 **약 1초 뒤 SDK 가 스스로 해체**된다(`naver.maps` → null).
  check.sh 는 그 전에 첫 draw 가 끝나 통과하지만, 이동·클릭을 거치는 검사는 실패한다
- 우회: 같은 로컬 파일을 등록 도메인 이름으로 연다(DNS 만 로컬, 배포 무관)
  `chrome --headless=new --host-resolver-rules="MAP chart.boolint.com 127.0.0.1:<port>" "http://chart.boolint.com/heatmap.html?type=office-rent"`
- 하네스로 iframe 에 넣어 검사하면 검사 코드는 `iframe.contentWindow.eval(...)` 로 iframe realm 안에서 돌린다
- 고정 Chrome 프로필은 캐시로 옛 파일을 보여줄 수 있다 → 테스트 서버는 `Cache-Control: no-store`(check.sh 는 적용됨)

## 2026-10-16 조사 후속 (완료)
1. 전월세 히트맵 JSON 생성기 — collector `src/generate-heatmap-rent-json.js`, run-pipeline.sh 3단계 등록. HTML 무수정
2. collector 복사에서 `region.cache.json` 제외 + 이 레포에서 `git rm`
3. 이 문서 검토·보완
4. 렌더 점검 루프 → `check.sh`

## 하지 말 것
- `data/` 를 손으로 고치지 않는다. heatmap.html 의 URL 파라미터·AndroidBridge 계약을 깨지 않는다
- `?sido=&sgg=`·`?type=` 이름과 섹션 id(해시)를 바꾸지 않는다 — 앱·`_redirects` 와의 약속이다
- 시도 평균끼리 나눈 비율, 총액 평균을 다시 들이지 않는다(재설계의 이유)
