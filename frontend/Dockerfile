FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5223/api
ARG NEXT_PUBLIC_YANDEX_MAP_API_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_MAILRU_CLIENT_ID
ARG DOCKER_BUILD=true

ENV NEXT_TELEMETRY_DISABLED 1
ENV DOCKER_BUILD=${DOCKER_BUILD}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_YANDEX_MAP_API_KEY=${NEXT_PUBLIC_YANDEX_MAP_API_KEY}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_MAILRU_CLIENT_ID=${NEXT_PUBLIC_MAILRU_CLIENT_ID}
ENV DOCKER_BUILD=${DOCKER_BUILD}

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]