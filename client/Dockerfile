FROM oven/bun:1.3.14 AS bun

FROM node:24-bookworm-slim AS development
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3001
CMD ["bun", "run", "dev"]
