# 프로젝트 구조

라우트, 컴포넌트, 카피, 원본이 실제로 있는 위치.

## 트리

저장소는 작은 모노레포입니다. 구현된 표면 하나와 예약된 표면 둘이 있습니다. 클라이언트보다 최상위를 먼저 읽으세요. 이 프로젝트의 혼란은 대개 잘못된 트리에서 찾은 결과입니다.

```text
circa/
├── client/           the Next.js interface
├── backend/          reserved for .NET services
├── admin/            reserved for administration
├── docs/             planning and the open-source checklist
├── scripts/          repository checks
├── tests/            root tooling tests
├── ARCHITECTURE.md   draft platform design
└── .agents/brain/    product context and design specification
```

예약된 폴더는 새 클론에 없을 수 있습니다. Git은 파일을 추적하고 디렉터리는 추적하지 않습니다.

## client/ 안

클라이언트에는 세 표면이 있고, 각각 컴포넌트 폴더, 스타일시트, README가 있습니다.

- components/archive-site/ — 열람판: 서버 렌더링 페이지, 검색, 기록, 다운로드.
- components/ — 워크스테이션 셸과 다섯 개의 애플리케이션 창.
- components/meta/ — 프로젝트 랜딩 페이지, 프로젝트 기록, 이 문서.
- components/ui/ — 클라이언트 표면이 공유하는 shadcn 스타일 프리미티브.
- lib/markdown/ — 기록 렌더러. React도 DOM도 없습니다.

app/[lang] 아래의 라우트는 조합합니다. 언어를 해석하고, 요청 로케일을 설정하고, 메타데이터를 만들고, 컴포넌트를 렌더링합니다. 카피와 레이아웃은 라우트 파일에 있지 않습니다.

## 두 종류의 콘텐츠

무엇을 번역하고 무엇을 번역하지 않는지는 사고가 아니라 제품 결정입니다.

| 종류 | 위치 | 번역 여부 |
| --- | --- | --- |
| 인터페이스 크롬 | `messages/<locale>/*.json` | 예 |
| 접수된 기록 | `*-index.ts, *-sources.ts` | 아니요 |
| 프로젝트 페이지 | `messages/<locale>/meta.json` | 예 |
| 문서 본문 | `docs/documentation/<locale>/*.md` | 예 |
| 식별자 | 코드와 데이터 모듈 | 아니요 |

아카이브는 영어로 접수된 문서를 번역하지 않습니다. 카탈로그 테스트가 두 언어를 맞추고, 아카이브 자체의 안내가 독자에게 그 간극을 설명합니다.

## README 규칙

모든 작성 폴더에는 소유 범위, 구조, 경계, 검증 방법을 적은 README가 있습니다. README 없이 폴더를 추가하면 bun run check가 실패합니다.

README를 코드와 함께 스테이징하세요. 커밋 전 훅은 스테이징된 경로를 검사하므로 스테이징하지 않은 README는 집계되지 않습니다.
