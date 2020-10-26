const puppeteer = require('puppeteer-core');
const express = require('express')
const bodyParser = require('body-parser');
const isModuleAvailable = require('./helper');
 
const app = express()
app.use(bodyParser.json());

const BOT_PORT = process.env.BOT_PORT || 5000;

var visit_num = 0;
var useScenario = isModuleAvailable("./scenario");

if (useScenario) {
    const botDoThings = require("./scenario");
    console.log(`[+] scenario.js found, Bot will continue with customized actions.`);
}
else {
    console.log(`[!] No scenario.js found, Bot will continue WITHOUT customized actions.`);
}

app.post('/visit', async (req, res) => {
    let data = req.body;
    let url = data.url;
    let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await visit(ip, url);
    
    res.send("Finished. ");
});

const visit = async (ip, url) => {
    let _num = ++visit_num;
    let page;

    let botData = {_num, page, ip, url};
    
    try {
        page = await browser.newPage();
        console.log(`[${ip}][${_num}] [+] Bot Started.`);

        await page.tracing.start({ path: `/tmp/${ip}_${new Date()}-trace.json` });

        await page.on('error', err => {
            console.error(`[${ip}][${_num}] [#] Error!`, err);
        });

        await page.on('pageerror', msg => {
            console.error(`[${ip}][${_num}] [-] Page error: `, msg);
        });

        await page.on('dialog', async dialog => {
            console.debug(`[#] Dialog: [${dialog.type()}] "${dialog.message()}" ${dialog.defaultValue() || ""}`);
            dialog.dismiss();
        });

        await page.on('requestfailed', req => {
            console.error(`[-] Request failed: ${req.url()} ${JSON.stringify(req.failure())}`);
        });

        // ===== Custom Action, see scenario.js =====

        if(useScenario) {
            botDoThings(botData);
        }

        // ==============================================

        console.log(`[${ip}][${_num}] [+] Opening page ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        await page.tracing.stop();
        await page.close();

        console.log(`[${ip}][${_num}] [+] Bot Closed.`)

    } catch (e) {

        console.error("[-] Page visit\n", e.stack)
        
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
    console.log(`[+] Bot app listening at http://localhost:${BOT_PORT}`);
    console.log(`[+] Send POST to http://localhost:${BOT_PORT}/visit to execute Bot`);
})