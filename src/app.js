const puppeteer = require('puppeteer-core');
const express = require('express')
const bodyParser = require('body-parser');
const { isModuleAvailable, BotData } = require('./helper');

const app = express()
app.use(bodyParser.json());

const BOT_PORT = process.env.BOT_PORT || 5000;

var visit_num = 0;
var botScenario = null;
var useScenario = isModuleAvailable("./scenario");

if (useScenario) {
    botScenario = require('./scenario');
    console.log(`[+] scenario.js found, Bot will continue with customized actions.`);
}
else {
    console.log(`[!] No scenario.js found, Bot will continue WITHOUT customized actions.`);
}

app.post('/visit', async (req, res) => {
    let url = req.body.url;
    let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await visit(ip, url);
    
    res.sendStatus(200);
});

const visit = async (ip, url) => {
    let _num = ++visit_num;
    let page;

    console.log(`[${ip}][${_num}] [+] Starting Bot.`);
    
    try {
        page = await browser.newPage();
        let botData = new BotData(_num, ip, url, page);

        try {
            await page.tracing.start({ path: `/tmp/${ip}_${new Date()}-trace.json` });            
        } catch (error) {
            
        }

        page.on('error', err => {
            console.error(`[${ip}][${_num}] [#] Error: `, err);
        });

        page.on('pageerror', msg => {
            console.error(`[${ip}][${_num}] [-] Page Error: `, msg);
        });

        page.on('dialog', async dialog => {
            console.debug(`[#] Dialog: [${dialog.type()}] "${dialog.message()}" ${dialog.defaultValue() || ""}`);
            dialog.dismiss();
        });

        page.on('requestfailed', req => {
            console.error(`[-] Request failed: ${req.url()} ${JSON.stringify(req.failure())}`);
        });

        // ===== Running Pre-visit scenario, see scenario.js =========
        if (useScenario && botScenario !== null) {
            console.log(`[!] Custom Scenario is being used. Preparing Pre-visit Scenario.`);
            await botScenario.beforeVisit(botData);
        }
        // ===========================================================

        console.log(`[${ip}][${_num}] [+] Opening Page ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // ===== Running Post-visit scenario, see scenario.js =========
        if (useScenario && botScenario !== null) {
            console.log(`[!] Custom Scenario is being used. Preparing Post-visit Scenario.`);
            await botScenario.afterVisit(botData);
        }
        // ============================================================
        
        try {
            await page.tracing.stop();            
        } catch (error) {
            
        }
        
        await page.close();

        console.log(`[${ip}][${_num}] [+] Bot Closed.`)

    } catch (e) {
        console.error("[-] Error on Page Visit\n", e.stack)
    }

}

var browser;

(async () => {
    browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--headless',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--no-gpu',
            '--disable-default-apps',
            '--disable-translate',
            '--disable-device-discovery-notifications',
            '--disable-software-rasterizer',
            '--disable-xss-auditor'
        ],
        ipDataDir: '/home/bot/data/',
        ignoreHTTPSErrors: true
    });

    console.log("[+] Browser", "Launch success!");

    // console.log("[+] Browser", "Close success!");
    // await browser.close();
})();

app.listen(BOT_PORT, () => {
    console.log(`[+] Bot is listening at http://localhost:${BOT_PORT}`);
    console.log(`[+] Send POST to http://localhost:${BOT_PORT}/visit to trigger the Bot`);
})