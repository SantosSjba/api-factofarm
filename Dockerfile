FROM node:24-alpine AS base
WORKDIR /app
ENV NODE_OPTIONS="--experimental-require-module --max-old-space-size=1536"
# Placeholder solo para `prisma generate` durante el build
ENV DATABASE_URL=postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY prisma prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--experimental-require-module
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/.npmrc /app/pnpm-workspace.yaml ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
