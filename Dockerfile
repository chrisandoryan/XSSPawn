FROM node:16-alpine3.16

ENV LANG="C.UTF-8" PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apk update && \
    apk add --no-cache zlib-dev udev nss ca-certificates chromium && \
    adduser -h /home/bot -D -u 10086 bot && \
    yarn cache clean && \
    rm -rf /tmp/* /etc/apk/* /var/cache/apk/* /usr/share/man

COPY --chown=bot:bot ./src/app.js /home/bot/app.js
COPY --chown=bot:bot ./src/helper.js /home/bot/helper.js
COPY --chown=bot:bot ./src/*.json /home/bot/

USER bot
WORKDIR /home/bot

RUN npm install

CMD ["node", "/home/bot/app.js"]