# XSSPawn
XSSPawn is a ***flexible*** and ***customizable*** Visit Bot for CTF (mostly XSS) challenges setup.

Forked from awesomely crafted https://github.com/CTFTraining/base_image_xssbot

## Built Upon
- Alpine
- Chromium
- puppeteer-core
- Express.js

## Getting Started

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

