FROM node:20-alpine AS deps
WORKDIR /todolist
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /todolist
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /todolist
ENV NODE_ENV=production
COPY --from=builder /todolist/.next ./.next
COPY --from=builder /todolist/public ./public
COPY --from=builder /todolist/package.json ./package.json
COPY --from=builder /todolist/package-lock.json ./package-lock.json
COPY --from=builder /todolist/node_modules ./node_modules
COPY --from=builder /todolist/prisma ./prisma
COPY --from=builder /todolist/next.config.ts ./next.config.ts
COPY --from=builder /todolist/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /todolist/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
