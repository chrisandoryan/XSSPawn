# XSSPawn
XSSPawn is a **flexible** and **customizable** visitor bot for CTF (mostly XSS) challenges setup.

Forked from the awesomely crafted https://github.com/CTFTraining/base_image_xssbot

## Built Upon
- Alpine
- Chromium
- puppeteer-core
- Express.js

## How It Works
**XSSPawn** is a trigger-based, Express-powered service that relies on HTTP request communication. To make XSSPawn visit certain URL, you need to send an HTTP POST request (JSON-encoded or form-data) into `http://BOT_IP:BOT_PORT/visit` endpoint, with the following data:

```json
{
  "url": "http://<domain-to-be-visited>/<some-page>"
}
```

Upon receiving the data, XSSPawn will spawn Chromium headless browser and visit the designated URL.

> [!NOTE]  
> By default, XSSPawn runs on port 4500.

### XSSPawn now have a UI page!

If you don't want to trigger the bot programatically from your challenge, we have added a UI page for users to input the URL they wish for the bot to visit. 

![XSSPawn UI](./assets/xsspawn-ui.png)

The UI can be accessed from the bot's base URL, e.g., `http://BOT_IP:BOT_PORT/`

## Getting Started

Generally, the visit feature of the bot will run out-of-the-box without any prior configuration. But if you want to compose your own **scenario** (e.g. setting up customized cookie, performing redirection, setting up HTTP request headers), you can do so by supplying your own `scenario.js` file like below (template can be found [here](src/scenario.js)).

### 1. Building **scenario.js**

There are two sections in `scenario.js` template file; the **utility** section and the **scenario** section. 

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
- `setCookie(botData)` to set some arbitrary cookies.
- `execJavascript(botData, jsFunc)` to execute JS 
- `monitorBrowserRequest(botData)` to log and display every HTTP requests invoked by the browser.
- `monitorConsoleOutput(botData)` to print ou.tputs from the browser's dev console.

#### Scenario Section
```javascript
// ============ Scenario Section ==================
// ================================================

<<Scenario definition here.>>
<<You may need to write code here.>>

// ============ End of Scenario Section ===========
// ================================================
```

This section, located below the **utility** section, is a place where you construct and compose whatever action (or set of actions) you want to be done by the bot. It consists of two placeholder functions that you need to modify:

**beforeVisit(botData)**
```javascript
const beforeVisit = async (botData) => {
    console.log(`[+] Executing Pre-visit Bot Scenario`);
    // ======= Compose Bot scenario here to be ran before the URL is visited =======

    //////////////////////////////////////////////////////////////////////////////////
};
```
This function receives `BotData` object (from [here](src/helper.js)) as the only parameter. The class consists of these attributes:
```javascript
{
  url, // the url that will be visited
  reqIp, // client IP Address that triggered the bot
  reqNum, // number of requests processed so far (globally)
  page // Pupetteer's page object (from newPage() method)
}
```

**What is beforeVisit?**

Every code or instructions that you write in this placeholder function will be run right **before** the bot visits the designated URL. This allows you to do some things (e.g cleaning up cookie, running JavaScript, etc.) in the Bot's browser context before it actually visits the URL.

For example:
```javascript

const beforeVisit = async (botData) => {
    console.log(`[${botData.reqIp}][${botData.reqNum}] [+] Running Pre-visit Scenario`);

    // 1. Set the FLAG into Bot's cookie
    setCookie(botData);

    // 2. Display requests performed by Bot's browser
    monitorBrowserRequest(botData);

};
```

By composing the `beforeVisit()` function like above, before the BOT visits the page, the headless browser will inject arbitrary cookie (usually containing the flag) to the destined page. Then it will display every requests made on the page (similar to if you inspect the browser's network tab).

**afterVisit(botData)**
```javascript
const afterVisit = async (botData) => {
    console.log(`[+] Executing Post-visit Bot Scenario`);
    // ======= Compose Bot scenario here to be ran after the URL has been visited =======

};
```
This function also receives `BotData` object as the only parameter.

**What is afterVisit?**

Every code or instructions that you write in this placeholder function will be run **after** the bot visits the designated URL. This allows you to do things (e.g performing follow-up requests, logging, etc.) in the Bot's browser context after the URL has been visited.

#### 2. Integrate with Docker Image

To apply `scenario.js` you have composed before, you need to send it to your Docker Image. Here's an example using `docker-compose.yml` with Docker Volume:

```
version: '3.9'

services:
  xssbot:
    image: siahaan/xsspawn
    # shm_size: '1gb' # Uncomment if shared memory size needs to be set
    environment:
      COOKIE_DOMAIN: localhost
      COOKIE_KEY: flag
      COOKIE_VALUE: ctf{w0w_its_work1ng}
      BOT_PORT: 5000
    volumes:
      - ./scenario.js:/home/bot/scenario.js
    ports:
      - 8081:5000
    restart: always
```
