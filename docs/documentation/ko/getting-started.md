# 시작하기

깨끗한 클론에서 로컬 빌드까지, 검사가 실행되는 순서대로.

## 요구 사항

Bun이 루트 도구와 프런트엔드를 실행합니다. 나머지는 Next.js가 맡고, 브라우저 테스트는 선택 사항입니다.

- Bun 1.3.14 — 패키지, 스크립트, 잠금 파일.
- Node.js 20.9 이상 — Next.js가 요구합니다.
- Chromium — Playwright 스위트에만 필요합니다.
- Git, 그리고 저장소 클론.

> [!NOTE]
> 두 번 설치, 하나의 툴체인
>
> 저장소 루트와 client/에는 각각 package.json과 잠금 파일이 있습니다. 둘 다 설치하세요. 커밋 전 훅이 둘 다 실행합니다.

## 설치

포크하고 클론한 뒤, 루트와 클라이언트에 설치합니다. 두 잠금 파일이 커밋되어 있으므로 고정된 잠금 파일을 사용하세요.

```sh
git clone <repository>
cd circa
bun install --frozen-lockfile
bun run prepare
cd client && bun install --frozen-lockfile
```

bun run prepare가 Husky 훅을 설치합니다. 이후 커밋 시 스테이징된 README, 저장소 도구, 린트, 타입, 단위 테스트가 검사됩니다.

## 로컬에서 실행

client/에서 개발 서버를 시작합니다. 3001 포트를 사용하며, 프록시가 언어 없는 경로를 독자의 언어로 리다이렉트합니다.

```sh
bun run --cwd=client dev
# http://localhost:3001 -> /en
```

| 라우트 | 표면 |
| --- | --- |
| `/en` | 위원회의 목소리로 된 공개 포털 |
| `/en/site` | 아카이브의 열람판 |
| `/en/meta` | 프로젝트 랜딩 페이지 |
| `/en/meta/documentation` | 이 문서 |
| `/en/desktop` | 워크스테이션 프리뷰 |

프로덕션 빌드는 bun run --cwd=client build, 그다음 bun run --cwd=client start입니다.

## 변경 검증

건드린 부분의 검사를 실행하세요. 풀 리퀘스트 전에는 precommit이 전체 통과입니다.

```sh
bun run check        # every authored folder has a README
bun run test         # root tooling tests
bun run check:client # lint, typecheck, unit tests
bun run precommit    # all of the above, staged first
```

> [!NOTE]
> 실제로 실행한 것을 보고하세요
>
> 풀 리퀘스트 템플릿은 검증을 요청합니다. 통과한 명령과 실행할 수 없었던 명령을 밝히세요. 실행하지 않은 스위트를 통과했다고 보고하지 마세요.

## 실행되지 않을 때

대부분의 로컬 설정 문제는 세 가지 실패에서 비롯됩니다.

- 샌드박스에서 읽기 전용인 Bun 캐시: BUN_TMPDIR을 쓰기 가능한 디렉터리로 지정하고 설치 시 --cache-dir을 전달하세요.
- 3001 포트가 이미 사용 중: 다른 서버를 중지하세요. Playwright는 설정된 경우 기존 서버를 재사용합니다.
- Chromium 누락: bunx playwright install chromium을 실행하고, 캐시에 쓸 수 없으면 PLAYWRIGHT_BROWSERS_PATH를 지정하세요.

페이지가 문장 대신 메시지 키를 출력하면 그 언어 카탈로그에 키가 빠진 것입니다. i18n-messages.test.ts가 그것을 잡는 테스트입니다.
