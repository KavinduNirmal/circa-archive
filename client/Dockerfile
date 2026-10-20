FROM oven/bun:1.3.14 AS bun

FROM node:24-bookworm-slim AS dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,id=circa-client-bun,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --cache-dir=/root/.bun/install/cache

FROM dependencies AS development
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3001
CMD ["bun", "run", "dev"]
