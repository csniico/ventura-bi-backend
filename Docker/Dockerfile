FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./

RUN npm install

COPY . .
RUN npm run build


FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

# ... remaining commands ...
EXPOSE 3000
CMD ["node", "dist/main.js"]