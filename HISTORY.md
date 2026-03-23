# trade-infographic 운영 히스토리

## 프로젝트 개요
- **목적**: trade-collector DB(3,000만건) 기반 부동산 실거래가 인포그래픽 웹 배포
- **구조**: 정적 HTML + JSON → GitHub → Cloudflare Pages 자동 배포
- **URL**: https://trade-infographic.pages.dev/
- **GitHub**: https://github.com/boolint-kim/trade-infographic
- **데이터 원본**: /Users/cgkim/server/trade-collector/data/trade.db (SQLite)

## 데이터 갱신 절차
```bash
# 1. trade-collector에서 JSON 생성
cd /Users/cgkim/server/trade-collector
node src/generate-pyeong-json.js          # E3 평당가 랭킹
node src/generate-infographic-data.js     # E1,E2,E4,E5,E6
node src/generate-periodic-data.js        # P2~P7

# 2. JSON 복사
cp data/*.json ../trade-infographic/data/

# 3. push (CF Pages 자동 재배포)
cd ../trade-infographic
git add -A && git commit -m "데이터 갱신 $(date +%Y-%m-%d)" && git push
```

## 인포그래픽 목록 (13종)

### 상시 지표 (Evergreen) — 일 1회 갱신 권장
| ID | 파일 | 내용 | JSON |
|---|---|---|---|
| E1 | infographic-daily-trades.html | 일간 거래 현황 | daily-trades.json |
| E2 | infographic-price-trend.html | 매매 평균가 10년 추이 | price-trend.json |
| E3 | infographic-price-per-pyeong.html | 평당가 랭킹 TOP 20 | pyeong-ranking.json |
| E4 | infographic-jeonse-ratio.html | 전세가율 10년 추이 | jeonse-ratio.json |
| E5 | infographic-trade-volume.html | 거래량 추이 | trade-volume.json |
| E6 | infographic-new-high.html | 신고가 경신 | new-high.json |

### 월간 분석 (Periodic) — 월 1회 갱신 권장
| ID | 파일 | 내용 | JSON |
|---|---|---|---|
| P1 | infographic-renewal-rate.html | 갱신계약 비율 | (인라인, 수동) |
| P2 | infographic-wolse-ratio.html | 전월세 전환율·월세 비중 | wolse-ratio.json |
| P3 | infographic-buyer-seller.html | 매수자·매도자 유형 | buyer-seller.json |
| P4 | infographic-cancel-rate.html | 계약 해제율 | cancel-rate.json |
| P5 | infographic-size-compare.html | 면적대별 가격 비교 | size-compare.json |
| P6 | infographic-price-gap.html | 지역 간 가격 격차 | price-gap.json |
| P7 | infographic-floor-premium.html | 층별 프리미엄 | floor-premium.json |

## 생성 스크립트 (trade-collector 프로젝트 내)
| 스크립트 | 대상 | 비고 |
|---|---|---|
| src/generate-pyeong-json.js | pyeong-ranking.json | E3 전용 |
| src/generate-infographic-data.js | E1,E2,E4,E5,E6 JSON 5개 | |
| src/generate-periodic-data.js | P2~P7 JSON 6개 | |

## 기술 스택
- HTML5 + CSS + Chart.js 4.4.0 (CDN)
- 전국 17개 시도 선택형 UI (버튼 클릭 → 차트 동적 갱신)
- JSON fetch → 클라이언트 렌더링 (서버 연산 없음)

## 알려진 이슈
- 서울과 지방 가격 차이가 커서 동일 스케일 시 지방 그래프 찌그러짐 (x축 동적 조정 필요)
- P1 갱신비율만 아직 지역 선택형 아님 (서울/부산 하드코딩)
- file:// 프로토콜에서 fetch 안 됨 (로컬 테스트 시 `npx http-server` 사용)

---

## 변경 이력

### 2026-03-23 — 초기 배포
- 인포그래픽 13종 작성 (E1~E6, P1~P7)
- 전국 17개 시도 선택형 UI 적용 (P1 제외)
- JSON 데이터 12개 생성 (총 553KB)
- GitHub 레포 생성 (boolint-kim/trade-infographic, public)
- Cloudflare Pages 연동 배포 완료
- 차트 폰트 크기 조정 (기본 14, y축 레이블 15 bold, 2줄 표시)
