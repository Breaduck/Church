# 정다운교회 홈페이지

대한예수교장로회(통합) 정다운교회 (담임 이종운 목사) 공식 홈페이지.
정적 HTML/CSS/JS 원페이지 사이트.

## 구성

- `index.html` — 전체 페이지 (교회소개 → 지역사역 → 예배안내·설교 → 인사말 → 새가족 → 오시는 길)
- `css/style.css` — 스타일
- `js/main.js` — 내비게이션, 예배 탭, YouTube 최신 설교 자동 로드

## 로컬 미리보기

가장 간단한 방법은 `index.html` 을 더블클릭해서 브라우저로 여는 것이다.
지도 임베드와 폰트 등이 정상 동작하는지 확인하려면 로컬 서버를 띄우는 편이 더 정확하다.

```bash
# Python 3
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 콘텐츠 수정

전체 콘텐츠는 `index.html` 에 하드코딩되어 있다. 자주 바뀌는 항목:

| 항목 | 위치 |
|---|---|
| 예배 시간 | `#week` 섹션 |
| 사역 시설 설명 | `#ministry` 섹션 |
| 연혁 | `#intro` 섹션 타임라인 |
| 주소·전화번호 | hero 하단 정보줄 + `#contact` 섹션 + footer |

이번 주 설교는 YouTube 채널 RSS 에서 자동으로 불러온다 (`js/main.js`).

## 배포

GitHub repository → Cloudflare Pages 자동 배포.

Cloudflare Pages 빌드 설정:
- 빌드 명령: (비움)
- 빌드 출력 디렉터리: `/`

## 라이선스 및 자료 출처

교회 소개 문구는 정다운교회의 공식 안내문이다.
배경 기사: <https://pckworld.com/article.php?aid=10180924314>
