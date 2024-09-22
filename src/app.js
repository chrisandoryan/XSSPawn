const puppeteer = require('puppeteer-core');
const express = require('express')
const bodyParser = require('body-parser');
const { isModuleAvailable, BotData, VisitResult } = require('./helper');

const app = express()
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const BOT_PORT = process.env.BOT_PORT || 4500;

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

app.get('/', async (req, res) => {
    return res.render('index');
});

app.post('/visit', async (req, res) => {
    let url = req.body.url;
    let ip =  req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    try {
        let result = await visit(ip, url);
    
        res.send({
            success: result.success,
            message: result.response
        }).status(200);    
    } catch (error) {
        res.send({
            success: false,
            message: `Unknown error occured: ${error}`
        }).send(500);
    }
    
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
            error = `[${ip}][${_num}] [#] Error: ${err}`;
            console.error(error);
            
            return new VisitResult(false, error);
        });

        page.on('pageerror', msg => {
            error = `[${ip}][${_num}] [-] Page Error: ${msg}`;
            console.error(error);
            
            return new VisitResult(false, error);
        });

        page.on('dialog', async dialog => {
            console.debug(`[#] Dialog: [${dialog.type()}] "${dialog.message()}" ${dialog.defaultValue() || ""}`);
            dialog.dismiss();
        });

        page.on('requestfailed', req => {
            error = `[-] Request failed: ${req.url()} ${JSON.stringify(req.failure())}`;
            console.error(error);
            
            return new VisitResult(false, error);
        });

        // ===== Running Pre-visit scenario, see scenario.js =========
        if (useScenario && botScenario !== null) {
            console.log(`[!] Custom Scenario is being used. Preparing Pre-visit Scenario.`);
            try {
                await botScenario.beforeVisit(botData);                
            } catch (error) {
                error = `[-] Scenario beforeVisit failed: ${error}`;
                console.error(error);

                return new VisitResult(false, error);
            }
        }
        // ===========================================================

        console.log(`[${ip}][${_num}] [+] Opening Page ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // ===== Running Post-visit scenario, see scenario.js =========
        if (useScenario && botScenario !== null) {
            console.log(`[!] Custom Scenario is being used. Preparing Post-visit Scenario.`);

            try {
                await botScenario.afterVisit(botData);
            } catch (error) {
                error = `[-] Scenario afterVisit failed: ${error}`;
                console.error(error);

                return new VisitResult(false, error);
            }
        }
        // ============================================================
        
        try {
            await page.tracing.stop();            
        } catch (error) {
            
        }
        
        await page.close();

        console.log(`[${ip}][${_num}] [+] Scenario Ended`)
        success = `[${ip}][${_num}] [+] URL ${url} has been visited.`;
        
        return new VisitResult(true, success);

    } catch (e) {
        error = `[-] Error on Page Visit: ${e.stack}`;
        console.error(error);

        return new VisitResult(false, error);
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

})();

app.listen(BOT_PORT, () => {
    console.log(`[+] Bot is listening at http://localhost:${BOT_PORT}`);
    console.log(`[+] Send POST to http://localhost:${BOT_PORT}/visit to trigger the Bot`);
})