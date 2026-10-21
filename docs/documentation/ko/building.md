# 빌드

프로젝트 웹사이트는 독립적인 정적 Astro 앱입니다. 공개 보관소와 CIRCA/OS 작업대는 Next.js에 남으며, 계정과 세션은 .NET 백엔드를 사용합니다.

## 프로젝트 웹사이트 실행

Node.js 24와 Bun 1.3.14를 사용하세요. 저장소 루트에서 실행합니다.

```sh
bun install --cwd meta --frozen-lockfile
bun run --cwd meta dev
```

웹사이트는 4321 포트에서 실행됩니다. 문서는 체크아웃한 공개 Markdown에서 읽습니다. 문서를 수정한 뒤 개발 서버를 다시 시작하면 콘텐츠가 새로 반영됩니다. 독자에게 변경 사항을 공개하려면 정적 빌드를 다시 배포하세요.

## 변경 사항 검증

```sh
bun run check
bun run check:meta
bun run --cwd meta build
bun run --cwd meta test:e2e
```

보관소나 작업대를 변경했다면 `bun run check:client`도 실행하세요. [테스트](testing.md)는 클라이언트 검증을 설명합니다. 브라우저 및 실제 Nginx 검증은 meta와 인프라 README에서 설명합니다.

## 구현 살펴보기

[시작하기](getting-started.md), [렌더링](rendering.md), [경로](routes.md), [디자인](design.md)을 읽어 주세요. 프로젝트 문서는 안전한 문서 렌더러를 사용하며, 허구의 기록 렌더링은 Next.js의 별도 책임입니다.

## 두 사이트 함께 실행

Docker Compose의 Nginx는 `project.localhost:3001`을 정적 프로젝트 서비스로, `localhost:3001`을 보관소로 연결합니다. 보관소의 API 요청은 백엔드로 전달합니다. 도메인이나 포트를 변경할 때 `PROJECT_SITE_ORIGIN`과 `ARCHIVE_SITE_ORIGIN`을 함께 설정하세요.
