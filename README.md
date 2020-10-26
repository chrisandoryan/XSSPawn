# XSSPawn
XSSPawn is a ***flexible*** and ***customizable*** Visit Bot for CTF (mostly XSS) challenges setup.

Forked from awesomely crafted https://github.com/CTFTraining/base_image_xssbot

## Built Upon
- Alpine
- Chromium
- puppeteer-core
- Express.js

## How It Works
***XSSPawn*** is a trigger-based, Express-powered service that relies on HTTP request communication. To make XSSPawn visit certain URL, someone needs to send an HTTP POST request with JSON-encoded data like below, to `/visit` endpoint.

```
"{"url":"http://<domain-to-be-visited>/<some-page>"}"
```

Upon receiving the data, XSSPawn will spawn Chromium headless browser and visit the designated URL.

## Getting Started

Generally, the Bot itself wi
**app.js**

```javascript
// ===== Custom Action =====

Code for you!

// =========================
```

Add Service in your docker-compose.yml

```yaml
  xssbot:
    # build: .
    image: ctftraining/base_image_xssbot
    # shm_size: '1gb'
    volumes:
      - ./app.js:/home/bot/app.js
    environment:
      - FLAG=ctftraining{xss_bot_666}
    restart: always
```

## Custom Build

### Using Dockerfile
### Using Docker-Compose

