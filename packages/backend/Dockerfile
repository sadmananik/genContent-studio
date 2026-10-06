FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json yarn.lock lerna.json ./
RUN mkdir -p packages/backend packages/frontend
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN yarn install --frozen-lockfile --production=true

COPY packages/backend packages/backend

WORKDIR /app/packages/backend

EXPOSE 4000

CMD ["yarn", "start"]
