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

const cleanup = async (page) => {
    try {
        page.removeAllListeners('error');
        page.removeAllListeners('pageerror');
        page.removeAllListeners('dialog');
        page.removeAllListeners('requestfailed');
        page.removeAllListeners('request');
        page.removeAllListeners('console');
        
        try {
            await page.tracing.stop();
        } catch (error) {
        }
        
        try {
            await page.evaluate(() => {
                if (window.localStorage) window.localStorage.clear();
                if (window.sessionStorage) window.sessionStorage.clear();
                if (window.indexedDB) {
                    window.indexedDB.databases().then(databases => {
                        databases.forEach(db => {
                            window.indexedDB.deleteDatabase(db.name);
                        });
                    });
                }
            });
        } catch (error) {
        }
        
        console.log("[*] Page cleanup completed successfully.");
    } catch (error) {
        console.error(`[!] Error during page cleanup: ${error}`);
    }
}

const closeAllPages = async (browser, mainPage, ip, _num) => {
    try {
        const pages = await browser.pages();
        console.log(`[${ip}][${_num}] [+] Found ${pages.length} total pages to close.`);
        
        const otherPages = pages.filter(p => p !== mainPage);
        
        for (let i = 0; i < otherPages.length; i++) {
            try {
                const otherPage = otherPages[i];
                console.log(`[${ip}][${_num}] [+] Closing additional page ${i + 1}/${otherPages.length}`);
                
                await cleanup(otherPage);
                await otherPage.close();
                console.log(`[${ip}][${_num}] [+] Additional page ${i + 1} closed successfully.`);
            } catch (error) {
                console.error(`[${ip}][${_num}] [#] Error closing additional page ${i + 1}: ${error}`);
                try {
                    await otherPages[i].close();
                } catch (forceError) {
                    console.error(`[${ip}][${_num}] [#] Force close of additional page ${i + 1} also failed: ${forceError}`);
                }
            }
        }
        
        console.log(`[${ip}][${_num}] [+] All additional pages closed.`);
    } catch (error) {
        console.error(`[${ip}][${_num}] [#] Error during closeAllPages: ${error}`);
    }
}

const createBrowser = async (ip, _num) => {
    const uniqueDataDir = `/tmp/browser_${ip}_${_num}_${Date.now()}`;
    
    return await puppeteer.launch({
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
            '--disable-xss-auditor',
            '--disable-popup-blocking',
            '--allow-popups-during-page-unload',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
            '--no-zygote'
        ],
        ipDataDir: uniqueDataDir,
        ignoreHTTPSErrors: true
    });
}

const visit = async (ip, url) => {
    let _num = ++visit_num;
    let page = null;
    let browser = null;
    let tracingStarted = false;

    console.log(`[${ip}][${_num}] [+] Starting Bot with new browser instance.`);
    
            try {
            browser = await createBrowser(ip, _num);
            console.log(`[${ip}][${_num}] [+] New browser instance created.`);
            
            page = await browser.newPage();
            let botData = new BotData(_num, ip, url, page);

            try {
                await page.tracing.start({ path: `/tmp/${ip}_${new Date()}-trace.json` });
                tracingStarted = true;
            } catch (error) {
                console.log(`[!] Tracing failed to start: ${error}`);
            }

            page.on('error', err => {
                error = `[${ip}][${_num}] [#] Error: ${err}`;
                console.error(error);
            });

            page.on('pageerror', msg => {
                error = `[${ip}][${_num}] [-] Page Error: ${msg}`;
                console.error(error);
            });

            page.on('dialog', async dialog => {
                console.debug(`[#] Dialog: [${dialog.type()}] "${dialog.message()}" ${dialog.defaultValue() || ""}`);
                await dialog.dismiss();
            });

            page.on('requestfailed', req => {
                error = `[-] Request failed: ${req.url()} ${JSON.stringify(req.failure())}`;
                console.error(error);
            });

            page.on('popup', async newPage => {
                console.log(`[${ip}][${_num}] [!] New popup/tab detected: ${newPage.url()}`);
            });

        // ===== Running Pre-visit scenario, see scenario.js =========

        if (useScenario && botScenario !== null) {
            console.log(`[!] Custom Scenario is being used. Preparing Pre-visit Scenario.`);
            try {
                await botScenario.beforeVisit(botData);                
            } catch (error) {
                error = `[-] Scenario beforeVisit failed: ${error}`;
                console.error(error);
                throw new Error(error);
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
                throw new Error(error);
            }
        }
        // ============================================================
        
        console.log(`[${ip}][${_num}] [+] Scenario Ended`)
        success = `[${ip}][${_num}] [+] URL ${url} has been visited.`;
        
        return new VisitResult(true, success);
    } catch (e) {
        error = `[-] Error on Page Visit: ${e.stack}`;
        console.error(error);
        return new VisitResult(false, error);
    } finally {
        if (browser) {
            try {
                if (page) {
                    if (tracingStarted) {
                        try {
                            await page.tracing.stop();
                        } catch (error) {
                            console.log(`[!] Error stopping tracing: ${error}`);
                        }
                    }
                    
                    await closeAllPages(browser, page, ip, _num);
                    
                    await cleanup(page);
                    
                    await page.close();
                    console.log(`[${ip}][${_num}] [+] Main page closed successfully.`);
                }
                
                await browser.close();
                console.log(`[${ip}][${_num}] [+] Browser instance closed successfully.`);
            } catch (cleanupError) {
                console.error(`[${ip}][${_num}] [#] Error during final cleanup: ${cleanupError}`);
                
                if (page) {
                    try {
                        await page.close();
                    } catch (forceCloseError) {
                        console.error(`[${ip}][${_num}] [#] Force close of page also failed: ${forceCloseError}`);
                    }
                }
                
                try {
                    await browser.close();
                } catch (forceBrowserCloseError) {
                    console.error(`[${ip}][${_num}] [#] Force close of browser also failed: ${forceBrowserCloseError}`);
                }
            }
        }
    }
}

console.log("[+] Bot initialized - each visit will spawn a new browser instance.");

app.listen(BOT_PORT, () => {
    console.log(`[+] Bot is listening at http://localhost:${BOT_PORT}`);
    console.log(`[+] Send POST to http://localhost:${BOT_PORT}/visit to trigger the Bot`);
})
