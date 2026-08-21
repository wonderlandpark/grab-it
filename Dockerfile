FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn prisma:generate

FROM base AS development
ENV NODE_ENV=development
CMD ["yarn", "dev"]

FROM base AS builder
ENV NODE_ENV=production
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=base /app/node_modules/prisma ./node_modules/prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
CMD ["node", "server.js"]
