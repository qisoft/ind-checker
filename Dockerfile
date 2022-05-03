FROM node:16-alpine

WORKDIR /app
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ADD . .
ARG BOT_TOKEN
ENV BOT_TOKEN $BOT_TOKEN
RUN npm i
RUN npm i typescript -g
RUN tsc

ENTRYPOINT node index.js