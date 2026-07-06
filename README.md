# 정다운교회 홈페이지

대한예수교장로회(통합) 정다운교회 (담임 이종운 목사) 공식 홈페이지.
정적 HTML/CSS/JS 멀티페이지 사이트, Apple-grade 디자인 시스템 기반.

## 페이지 구성

- `index.html` — 홈
- `about.html` — 교회소개
- `worship.html` — 예배안내
- `sermons.html` — 설교·소식
- `ministry.html` — 지역사역
- `visit.html` — 찾아오기

## 로컬 미리보기

가장 간단한 방법은 `index.html` 을 더블클릭해서 브라우저로 여는 것이다.
지도 임베드와 폰트 등이 정상 동작하는지 확인하려면 로컬 서버를 띄우는 편이 더 정확하다.

```bash
# Python 3
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 콘텐츠 수정

전체 콘텐츠는 HTML 에 하드코딩되어 있다. 자주 바뀌는 항목:

| 항목 | 파일 |
|---|---|
| 이번 주 설교·이전 설교·교회 소식 | `sermons.html` |
| 예배 시간 | `worship.html` |
| 연혁 | `about.html` |
| 사역 시설 설명 | `ministry.html` |
| 주소·전화번호 | 모든 페이지의 footer + `visit.html` |

자세한 편집 가이드는 [CLAUDE.md](./CLAUDE.md) 참고. **메뉴(nav)와 푸터(footer)는 6개 페이지에 중복되어 있으므로 함께 수정해야 한다.**

## 배포

GitHub repository → Cloudflare Pages 자동 배포.

Cloudflare Pages 빌드 설정:
- 빌드 명령: (비움)
- 빌드 출력 디렉터리: `/`

## 라이선스 및 자료 출처

교회 소개 문구는 정다운교회의 공식 안내문이다.
배경 기사: <https://pckworld.com/article.php?aid=10180924314>
