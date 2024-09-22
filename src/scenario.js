// ============ Utility Section ===================
// ================================================

// setCookie: set a cookie (mostly the Flag) at the bot's browser
const setCookie = async (botData) => {
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "localhost";
    const COOKIE_KEY = process.env.COOKIE_KEY || "flag";
    const COOKIE_VALUE = process.env.COOKIE_VALUE || "null";

    console.log(`[${botData.ip}][${botData._num}] [+] Setting Up Customized Cookie`);
    await botData.page.setCookie({
        name: COOKIE_KEY,
        value: COOKIE_VALUE,
        domain: COOKIE_DOMAIN,
        expire: 0,
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax"
    });
};

// execJavascript: evaluate JavaScript in the bot's browser context (run JS in bot's browser console)
const execJavascript = async (botData, jsFunc) => {
    console.log(`[${botData.ip}][${botData._num}] [+] Executing JavaScript`);
    await botData.page.evaluate(jsFunc);
};

// monitorBrowserRequest: print out every HTTP request performed by bot's browser when visiting a URL
const monitorBrowserRequest = async (botData) => {
    await botData.page.on('request', req => {
        console.log(`[+] Browser is requesting to ${req.url()}`);
    });
}

// monitorConsoleOutput: print out bot's browser console output
const monitorConsoleOutput = async (botData) => {
    await botData.page.on('console', async msg => {
        msg.args().forEach(arg => {
            arg.jsonValue().then(_arg => {
                console.log(`[$] Console Output: `, _arg);
            });
        });
    });
}

// ============ End of Utility Section ============
// ================================================

// ----------------------------------------------------------------- //

// ============ Scenario Section ==================
// ================================================

const beforeVisit = async (botData) => {
    console.log(`[+] Executing Pre-visit Bot Scenario`);
    // ======= Compose Bot scenario here to be ran before the URL is visited =======

    //////////////////////////////////////////////////////////////////////////////////
};

const afterVisit = async (botData) => {
    console.log(`[+] Executing Post-visit Bot Scenario`);
    // ======= Compose Bot scenario here to be ran after the URL has been visited =======

    //////////////////////////////////////////////////////////////////////////////////
};

// ============ End of Scenario Section ===========
// ================================================

module.exports = {
    beforeVisit,
    afterVisit
};