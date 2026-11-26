# 라우트와 판본

모든 문서는 하나의 주소, 하나의 언어, 세 표면 중 하나에서 답합니다.

## 라우트 지도

아래 라우트는 현재 트리가 제공하는 공개 표면입니다. 모두 언어 세그먼트 아래에 있습니다.

| 라우트                                     | 렌더링                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `/[lang]`                                  | 위원회의 목소리로 된 공개 포털.                              |
| `/[lang]/site`                             | 열람판의 첫 페이지.                                          |
| `/[lang]/site/about`                       | 열람 안내, 등급 키, 판본 수.                                 |
| `/[lang]/site/records`                     | 기록 색인. 검색과 필터는 서버에서 읽습니다.                  |
| `/[lang]/site/records/incidents`           | 사건 등급 색인.                                              |
| `/[lang]/site/records/explorations`        | 탐사 등급 색인.                                              |
| `/[lang]/site/records/evidence`            | 증거 등급 색인.                                              |
| `/[lang]/site/records/rumours`             | 예약된 소문 색인. 실제 `class=rumour` 쿼리는 아직 없습니다.  |
| `/[lang]/site/records/playlists`           | 예약된 재생목록 색인. v1 재생목록 라우트를 기다립니다.       |
| `/[lang]/site/records/[code]`              | 기록 또는 사건 하나. 예시 데이터 색인 또는 API에서 읽습니다. |
| `/[lang]/site/records/[code]/download`     | 마크다운과 일반 텍스트 사본. 보류된 서류는 404.              |
| `/[lang]/site/records/[code]/explorations` | 한 기록에 제출된 탐사 목록.                                  |
| `/[lang]/site/organizations`               | 조직 디렉터리. 기본은 예시 데이터, 플래그를 켜면 API.        |
| `/[lang]/site/characters`                  | 예약된 캐릭터 디렉터리.                                      |
| `/[lang]/site/characters/[code]`           | API 기반 캐릭터 기록.                                        |
| `/[lang]/site/recoveries/[code]`           | API 기반 회수품 기록.                                        |
| `/[lang]/site/random`                      | 무작위로 선택된 기록으로의 리다이렉트.                       |
| `/[lang]/site/write`                       | 저자 랜딩과 브라우저 로컬 초안.                              |
| `/[lang]/site/write/editor`                | 브라우저 로컬 사건 편집기.                                   |
| `/[lang]/desktop`                          | CIRCA/OS 워크스테이션 프리뷰.                                |
| `/[lang]/desktop/[destination]`            | 포커스된 워크스테이션 목적지.                                |
| `/[lang]/desktop/record/[code]`            | 워크스테이션 안에서 연 기록.                                 |
| `/[lang]/account`                          | 로그인한 계정과 세션 요약.                                   |
| `/[lang]/sign-in`, `/[lang]/sign-up`       | 개인 접근 양식.                                              |
| `/[lang]/meta`                             | 프로젝트 랜딩 페이지.                                        |
| `/[lang]/meta/about`                       | 픽션 바깥의 프로젝트 기록.                                   |
| `/[lang]/meta/documentation`               | 이 문서.                                                     |
| `/[lang]/meta/documentation/[slug]`        | 문서 한 페이지.                                              |

### 아직 제공되지 않는 v1 대상 라우트

[ADR 008](../../adr/008-v1-public-site-scope.md)이 공개 사이트 범위를 정합니다. 아래 라우트는 v1 계약에 포함되지만 아직 트리에 없습니다.

- `/[lang]/site/records/[code]/filings` — 한 사건에 제출된 기록의 페이지네이션 목록. 등급, 저자, 날짜, 평가 수, 댓글 수를 표시합니다.
- `/[lang]/site/records/[code]/playlists` — 사건의 공개 재생목록. 사건 저자의 재생목록이 맨 위에 고정됩니다.
- `/[lang]/site/playlists/[id]` — 한 재생목록의 정렬된 기록.
- `/[lang]/site/recoveries` — 회수품 디렉터리.
- 모든 조직, 캐릭터, 회수품의 표준 기록 라우트. 현재 조직 기록은 필터된 디렉터리 쿼리를 사용합니다.
- `/[lang]/site/write` 뒤의 초안, 발행, 편집, 개정 이력 라우트.

소문과 재생목록 등급 페이지는 색인이 API 기반이 될 때까지 예약된 셸입니다. 사이트는 아직 기본적으로 예시 데이터를 읽습니다. [ADR 004](../../adr/004-fixture-backed-client.md)는 `/site`에 대해 ADR 008로 대체되었지만, 읽기 동등성은 별도의 구현 단계입니다.

## 언어는 경로에 있습니다

routing.ts는 언어를 나열하는 유일한 파일입니다. 프록시는 명시적 접두사, NEXT_LOCALE 쿠키, Accept-Language, 영어 순으로 해석합니다.

언어 레이아웃은 세그먼트를 검증하고, 문서 언어를 설정하고, 글꼴을 불러오고, 클라이언트 컴포넌트가 읽는 네임스페이스만으로 메시지 공급자를 마운트합니다.

> [!NOTE]
> 언어 추가하기
>
> routing.ts에 추가하고, messages/ 아래에 카탈로그 디렉터리를 만들고, 모든 키를 번역하세요. 카탈로그 테스트가 로케일 간 키 집합, 플레이스홀더, 리치 텍스트 태그를 비교합니다.

## 두 개의 프런트엔드

열람판은 서버 우선입니다. 검색은 GET 폼, 다운로드는 라우트 핸들러이며, 클라이언트 아일랜드는 내비게이션 펼침, 주석 작성기, 저자 랜딩뿐입니다. 위 라우트 지도가 열람판의 전체 표면이며, 기록의 등급 페이지와 관련 목록은 같은 색인에 대한 필터입니다.

워크스테이션은 클라이언트 셸입니다. 로컬 아카이브 예시 데이터 위의 상태를 가진 창들로 작동합니다. 계정 라우트는 .NET 인증 서비스를 사용하며, `SEARCH_SOURCE=api`로 검색, 목적지 읽기, 조직 디렉터리를 API로 전환할 수 있습니다. 어느 판본도 콘텐츠를 소유하지 않으며, v1 대상에서는 열람판의 유일한 런타임 소스가 API가 됩니다.

## 라우트 추가하기

언어 세그먼트 아래의 라우트는 네 가지 일을 합니다. 언어 해석, 요청 로케일 설정, metadata 네임스페이스로 메타데이터 생성, 컴포넌트 렌더링.

```tsx
export default async function Page({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <SomeSurface />;
}
```

레이아웃은 표면에, 카피는 카탈로그에, 메타데이터는 페이지에 속합니다. 링크는 i18n 내비게이션 모듈의 로케일 인식 Link로 만들고, next/link는 쓰지 마세요.
