# 정다운교회 홈페이지 (church2)

## 한 줄

대한예수교장로회(통합) **정다운교회** (담임 이종운 목사) 의 공식 홈페이지. Apple-grade 디자인 시스템을 기반으로 한 정적 멀티페이지 사이트.

## 사이트 구조

| 경로 | 페이지 |
|------|-------|
| `/index.html` | 홈 |
| `/about.html` | 교회소개 (담임목사, 연혁, 핵심가치) |
| `/worship.html` | 예배안내 (주일/주중/교육부서) |
| `/sermons.html` | 설교·소식 (피처드 설교, 이전 설교, 교회소식) |
| `/ministry.html` | 지역사역 (4층 건물 시설 스토리) |
| `/visit.html` | 찾아오기 (새가족, 위치, 지도, 연락처) |

## 기술 스택

- **HTML / CSS / JS** — 빌드 도구 없음. 정적 파일 그대로 배포
- **Pretendard Variable** — 한글 본문·헤딩 (Apple SF 톤)
- **Noto Serif KR** — 인용구·연혁·로고·강조 일부
- **Cloudflare Pages** — 정적 호스팅 (저장소 푸시 시 자동 배포)

## 디자인 시스템

`css/style.css` 단일 파일에 모든 디자인 토큰·컴포넌트가 정의되어 있다.

핵심 원칙:
- **카드 그리드 대신 헤어라인 행 리스트** — `.row-list`, `.timeline`, `.steps`, `.vision-list`
- **그라데이션·그림자·라운드 큰 카드 금지**
- 액센트 컬러 `#5a3e34` (deep umber) 는 한 페이지에 **5번 미만**으로만
- 디스플레이 타이포는 `letter-spacing: -0.025em` 이상, line-height 1.06~1.1
- 본문은 line-height 1.7 (한글 가독성)
- 모션은 `cubic-bezier(0.2, 0.6, 0.2, 1)` 단일 이징, 700ms duration, 90ms 스태거

## ⚠️ 편집 시 주의사항

### nav · footer 는 6개 HTML 파일에 중복되어 있다

빌드 도구가 없으므로 nav/footer 마크업은 6개 HTML 파일 (`index.html`, `about.html`, `worship.html`, `sermons.html`, `ministry.html`, `visit.html`) 에 **모두 복제**되어 있다.

**메뉴 추가/수정 시 6개 파일을 모두 수정해야 한다.** 한 곳만 고치면 해당 페이지에서만 반영되어 사이트가 일관성을 잃는다.

해당 파일들에서 다음 블록을 같이 수정:
- `<header class="nav" id="nav"> ... </header>` (열고 닫는 전체)
- `<footer class="footer"> ... </footer>` (열고 닫는 전체)

현재 페이지 표시는 각 파일의 nav 메뉴 항목에 `aria-current="page"` 로 표기되어 있다 (페이지마다 다름).

### 콘텐츠 (설교·소식·예배 시간) 도 HTML 하드코딩이다

별도의 CMS가 없다. 콘텐츠 변경은 직접 HTML 파일을 편집:

| 변경 사항 | 편집할 파일 |
|---|---|
| 이번 주 설교 | `sermons.html` 의 `.sermon-hero` 섹션 |
| 이전 설교 목록 | `sermons.html` 의 `.row-list` 내부 |
| 교회 소식 | `sermons.html` 의 `.featured-news` + 그 아래 리스트 |
| 예배 시간 | `worship.html` 의 각 `.row-list` |
| 연혁 | `about.html` 의 `.timeline` |
| 사역 시설 | `ministry.html` 의 `.floor` 블록들 |
| 연락처·주소 | 6개 파일 모두의 `<footer>` + `visit.html` |

향후 콘텐츠 관리가 잦아지면 JSON 분리 또는 Decap CMS 등 git-based CMS 도입 검토.

## 자산

- `img/pastor.jpg` — 이종운 담임목사 (`about.html`)
- `img/church-hero.jpg` — 교회 외관 (`index.html` 히어로)
- `img/church-building.jpg` — 교회 건물 (`sermons.html` 피처드 소식)

이미지를 교체할 때는 동일한 파일명을 유지하면 다른 파일을 수정할 필요가 없다.

## 로컬 미리보기

```powershell
# 가장 간단: index.html 더블클릭으로 브라우저에서 열기

# 또는 로컬 서버 (권장 — 폰트·iframe 등 정상 동작 확인)
python -m http.server 8000
# → http://localhost:8000 접속
```

## 배포

새 GitHub 저장소 + 새 Cloudflare Pages 프로젝트를 사용한다.

1. 새 GitHub 저장소 생성 후 이 폴더의 모든 파일 push
2. Cloudflare Pages → 새 프로젝트 → 저장소 연결
3. 빌드 설정:
   - 빌드 명령: (비움)
   - 빌드 출력 디렉터리: `/`
4. 배포 후 URL 확인

저장소 정보는 셋업 후 이 문서에 기록하기를 권장:

```
GitHub: (셋업 후 채워주세요)
Cloudflare Pages: (셋업 후 채워주세요)
공개 URL: (셋업 후 채워주세요)
```
