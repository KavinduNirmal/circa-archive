FROM oven/bun:1.3.14 AS bun
FROM node:24-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /repo/meta
COPY meta/package.json meta/bun.lock ./
RUN --mount=type=cache,id=circa-meta-bun,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --cache-dir=/root/.bun/install/cache
COPY meta/ ./
COPY docs/documentation/ /repo/docs/documentation/
COPY docs/AUTHOR_GUIDE.md /repo/docs/AUTHOR_GUIDE.md
COPY docs/lore/*.md docs/lore/*.png /repo/docs/lore/
ARG PROJECT_SITE_ORIGIN=http://project.localhost:3001
ARG ARCHIVE_SITE_ORIGIN=http://localhost:3001
ARG PROJECT_REPOSITORY_URL=https://github.com/KavinduNirmal/circa-archive
ARG PROJECT_DOCUMENTATION_REF=develop
ARG PROJECT_SPONSOR_URL=https://github.com/sponsors/KavinduNirmal
ARG PROJECT_CONTACT_URL=https://github.com/KavinduNirmal/circa-archive/issues/new
ENV PROJECT_SITE_ORIGIN=$PROJECT_SITE_ORIGIN ARCHIVE_SITE_ORIGIN=$ARCHIVE_SITE_ORIGIN \
    PROJECT_REPOSITORY_URL=$PROJECT_REPOSITORY_URL PROJECT_DOCUMENTATION_REF=$PROJECT_DOCUMENTATION_REF \
    PROJECT_SPONSOR_URL=$PROJECT_SPONSOR_URL PROJECT_CONTACT_URL=$PROJECT_CONTACT_URL
RUN bun run build

FROM nginx:stable-alpine
COPY --from=build /repo/meta/dist/ /usr/share/nginx/html/
COPY meta/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
