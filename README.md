# XSSPawn
XSSPawn is a ***flexible*** and ***customizable*** Visit Bot for CTF (mostly XSS) challenges setup.

Forked from awesomely crafted https://github.com/CTFTraining/base_image_xssbot

## Built Upon
- Alpine
- Chromium
- puppeteer-core
- Express.js

## How It Works
***XSSPawn*** is a trigger-based, Express-powered service that relies on HTTP request communication. To make XSSPawn visit certain URL, someone needs to send an HTTP POST request with JSON-encoded data like below, into `/visit` endpoint.

```
"{"url":"http://<domain-to-be-visited>/<some-page>"}"
```

Upon receiving the data, XSSPawn will spawn Chromium headless browser and visit the designated URL.

## Getting Started

Generally, the visit feature of the bot will run out-of-the-box without any prior configuration. But if you want to compose your own ***scenario*** (e.g. setting up customized cookie, performing redirection, setting up HTTP request headers), you can do so by supplying your own `scenario.js` file like below (template can be found [here](src/scenario.js).

### 1. Building **scenario.js**

There are two sections in `scenario.js` file; the ***utility*** section and the ***scenario*** section. 

#### Utility Section

```javascript
// ============ Utility Section ===================
// ================================================

<<Functions definition here.>>
<<Most of the time you don't need to modify any of them.>>

// ============ End of Utility Section ============
// ================================================
```

This sections exists as the building blocks for the scenario. It consists of functions that can be called right away to make the bot perform specific actions:
- `setCookie(botData)`
- `execJavascript(botData, jsFunc)`
- `monitorBrowserRequest(botData)`
- `monitorConsoleOutput(botData)`

#### Scenario Section
```javascript
// ============ Scenario Section ==================
// ================================================

<<Scenario definition here.>>
<<You may need to write code here.>>

// ============ End of Scenario Section ===========
// ================================================
```

This section, located below the ***utility*** section, is a place where you construct and compose whatever action (or set of actions) you want to be done by the bot. It consists of two placeholder functions that you need to modify:
- `beforeVisit(botData)`
every code or instructions that you write in this placeholder function will be run right ***before*** the bot visit the designated URL.
- `afterVisit(botData)`
every code or instructions that you write in this placeholder function will be run ***after*** the bot visit the designated URL.

#### 2. Integrate with Docker Image

To apply `scenario.js` you have compose before, you need to send it to your Docker Image. Here's an example:

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

