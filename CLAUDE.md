# trade-infographic — 부동산 실거래가 인포그래픽 (정적 사이트)

> 2026-10-16 정합성 조사에서 초안 작성 → 같은 날 검토·보완(파일 수·생성기·할 일 상태를 실물로 대조).
> 변경 이력은 `HISTORY.md`(2026-03-23 시점, 13종·12 JSON 기준 — 보관용, 현황 판단에 쓰지 말 것).

## 이 레포가 무엇인가
- 정적 HTML 46개 + `data/` JSON 47개(전월세 히트맵 3종이 첫 배포되면 50개). 빌드 단계 없음. GitHub push → Cloudflare Pages 자동 배포
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
| heatmap.html | heatmap.json<br>heatmap-office.json · heatmap-multi.json<br>heatmap-rent.json · heatmap-office-rent.json · heatmap-multi-rent.json | generate-heatmap-json.js<br>generate-heatmap-layers-json.js<br>generate-heatmap-rent-json.js (2026-10-16 추가) |
| index.html | (없음) | - |
| infographic-age-premium.html | age-premium.json | generate-periodic-data.js |
| infographic-building-price-trend.html | building-price-trend.json | generate-building-data.js (파일명을 동적으로 조립) |
| infographic-building-trade-volume.html | building-trade-volume.json | generate-building-data.js (파일명을 동적으로 조립) |
| infographic-buyer-seller.html | buyer-seller.json | generate-periodic-data.js |
| infographic-cancel-rate.html | cancel-rate.json | generate-periodic-data.js |
| infographic-daily-jeonse.html | daily-jeonse.json | generate-infographic-data.js |
| infographic-daily-trades.html | daily-trades.json | generate-infographic-data.js |
| infographic-daily-wolse.html | daily-wolse.json | generate-infographic-data.js |
| infographic-event-cgt.html | event-cgt.json | generate-event-cgt.js |
| infographic-factory-price-trend.html | factory-price-trend.json | generate-building-data.js (파일명을 동적으로 조립) |
| infographic-factory-trade-volume.html | factory-trade-volume.json | generate-building-data.js (파일명을 동적으로 조립) |
| infographic-floor-premium.html | floor-premium.json | generate-periodic-data.js |
| infographic-hotspot.html | hotspot.json | generate-periodic-data.js |
| infographic-jeonse-ratio.html | jeonse-ratio.json | generate-infographic-data.js |
| infographic-land-price-trend.html | land-price-trend.json | generate-land-data.js |
| infographic-land-pyeong-price.html | land-pyeong-price.json | generate-land-data.js |
| infographic-land-trade-volume.html | land-trade-volume.json | generate-land-data.js |
| infographic-multi-price-trend.html | multi-price-trend.json | generate-multi-data.js |
| infographic-multi-trade-volume.html | multi-trade-volume.json | generate-multi-data.js |
| infographic-multi-wolse-ratio.html | multi-wolse-ratio.json | generate-multi-data.js |
| infographic-multi-yield-rate.html | multi-yield-rate.json | generate-multi-data.js |
| infographic-new-high.html | new-high.json | generate-infographic-data.js |
| infographic-office-jeonse-ratio.html | office-jeonse-ratio.json | generate-office-data.js |
| infographic-office-price-per-pyeong.html | office-pyeong-ranking.json | generate-office-data.js |
| infographic-office-price-trend.html | office-price-trend.json | generate-office-data.js |
| infographic-office-trade-volume.html | office-trade-volume.json | generate-office-data.js |
| infographic-office-wolse-ratio.html | office-wolse-ratio.json | generate-office-data.js |
| infographic-office-yield-rate.html | office-yield-rate.json | generate-office-data.js |
| infographic-price-gap.html | price-gap.json | generate-periodic-data.js |
| infographic-price-per-pyeong.html | pyeong-ranking.json | generate-pyeong-json.js |
| infographic-price-trend.html | price-trend.json | generate-infographic-data.js |
| infographic-renewal-rate.html | renewal-rate.json | generate-periodic-data.js |
| infographic-right-price-per-pyeong.html | right-pyeong-ranking.json | generate-right-data.js |
| infographic-right-price-trend.html | right-price-trend.json | generate-right-data.js |
| infographic-right-trade-volume.html | right-trade-volume.json | generate-right-data.js |
| infographic-single-price-trend.html | single-price-trend.json | generate-single-data.js |
| infographic-single-pyeong-price.html | single-pyeong-price.json | generate-single-data.js |
| infographic-single-trade-volume.html | single-trade-volume.json | generate-single-data.js |
| infographic-single-wolse-ratio.html | single-wolse-ratio.json | generate-single-data.js |
| infographic-single-yield-rate.html | single-yield-rate.json | generate-single-data.js |
| infographic-size-compare.html | size-compare.json | generate-periodic-data.js |
| infographic-trade-volume.html | trade-volume.json | generate-infographic-data.js |
| infographic-wolse-ratio.html | wolse-ratio.json | generate-periodic-data.js |
| infographic-yield-rate.html | yield-rate.json | generate-periodic-data.js |

- index.html 은 45개 페이지를 전부 링크한다(2026-10-16 확인). 페이지를 추가하면 index 에도 넣을 것
- 2026-10-16 기준 `data/` 의 JSON 은 전부 어느 페이지가 쓰고, 페이지가 찾는 JSON 은 전월세 히트맵 3종(첫 배포 전) 말고 다 있다
- `region.cache.json`(collector 의 지역목록 캐시)은 2026-10-16 에 복사 대상에서 빼고 `git rm` 했다. 다시 생기면 collector 복사 단계를 볼 것

## 공통 인프라 (새 페이지도 이걸 쓴다)
- **다크모드**: `common.css` 의 CSS 토큰 + `chart-defaults.js` 의 `chartTheme` 헬퍼. 2026-05-20 에 43페이지 일괄 적용
- **SelfBanner**: `selfbanner-web.js` — 웹 접속에만 하단 배너, 앱 WebView(`window.IS_APP`)는 제외. 2026-05-22
- **차트**: Chart.js 4.4.0 + datalabels 2.2.0 (jsdelivr CDN, 버전 고정)
- **시도 코드**: 2026-07 개편 반영(전남광주 = 12, 옛 29·46 없음). 페이지마다 시도 맵이 인라인이라 개편 때 46개를 같이 고친다
- **heatmap.html** 은 TradeHeatmap Android 라이브러리가 WebView 로 임베드한다 — `?type=apt-deal` 등 URL 파라미터,
  `window.AndroidBridge`, 외부 호출 함수가 계약이다. 설계 정본: `~/server/trade-collector/docs/android-heatmap/`
  - JSON 스키마(매매·전월세 공통): `{generated, period, months[], total, data:[{n,r,u,x,y,a,c,l?,m?,s?, mo:{yyyymm:{a,c,l?,m?,s?}}}]}`.
    여러 달을 고르면 페이지가 `Σ(mo.a·mo.c)/Σc` 로 합친다(면적대 l/m/s 는 단순평균)
  - **전월세 3종의 값은 전세(월세 0) 보증금 평당가의 중앙값**(매매는 평균). 계약구분(신규·갱신)은 가리지 않는다
  - ⚠️ 색 구간(2천·3천·4천·5천만원/평)과 범례 '평당가'는 **매매 기준**이다. 전세는 중앙값이 약 1,100만원이라
    대부분 파랑으로 칠해진다 — HTML 을 고치지 않는 범위에서 데이터만 붙인 상태(2026-10-16). 고치려면 type 별 구간이 필요
  - 네이버 지도 SDK(`ncpKeyId`)는 등록 도메인에서만 인증된다. 로컬(127.0.0.1)에서 지도 타일이 안 나와도 데이터 경로 점검은 된다

## 로컬 테스트·정합성 점검
```bash
./check.sh                              # 전 페이지 헤드리스 렌더 (약 1분, 창 안 뜸, 실패 시 종료코드 1)
./check.sh 'heatmap.html?type=apt-rent' # 지정 페이지만 — 쿼리 문자열 가능, 여러 개 가능

# 눈으로 볼 때 (file:// 로는 fetch 가 안 된다)
python3 -m http.server 8765 --bind 127.0.0.1
```
- check.sh 가 보는 것: 콘솔 오류 / 화면의 "로딩 실패"(heatmap 은 fetch 실패를 화면에만 쓴다) /
  참조 JSON 존재 / heatmap 의 `#stats`(비어 있으면 점이 하나도 안 그려진 것). 로컬 서버는 빈 포트로 스스로 띄우고 내린다
- 2026-10-16 결과: 46/46 OK, 시도 코드가 JSON 과 일치, index 링크 45/45 존재

### ⚠️ 알려진 결함 — `heatmap.html?type=office-*|multi-*` 는 빈 지도다 (2026-10-16 발견, 미수정)
`CanvasHeatLayer.draw()` 와 `onMapClick()` 첫 줄이 `if (!layerReady.apt) return;` 인데, primary 가 office·multi 이면
그 레이어만 로드하고 아파트는 로드하지 않는다 → **점이 하나도 안 그려지고 탭도 무시된다.** 데이터(매매·전월세 모두)는 정상 로드된다.
check.sh 로 재현: `./check.sh 'heatmap.html?type=office-deal'` → FAIL `#stats 비어 있음`.
고칠 때는 두 가드를 "켜진 레이어 중 하나라도 ready" 로 바꾸면 된다. 앱(TradeHeatmap)이 이 type 을 쓰는지 먼저 확인할 것

## 2026-10-16 조사 후속 (완료)
1. 전월세 히트맵 JSON 생성기 — collector `src/generate-heatmap-rent-json.js`, run-pipeline.sh 3단계 등록. HTML 무수정
2. collector 복사에서 `region.cache.json` 제외 + 이 레포에서 `git rm`
3. 이 문서 검토·보완
4. 렌더 점검 루프 → `check.sh`

## 하지 말 것
- 사이트를 새로 만들지 않는다. 46페이지가 오늘 데이터로 오류 없이 렌더된다(2026-10-16)
- `data/` 를 손으로 고치지 않는다. heatmap.html 의 URL 파라미터·AndroidBridge 계약을 깨지 않는다
