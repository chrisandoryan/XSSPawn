// setCookie: set a cookie (mostly the Flag) at the Bot's browser
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

// execJavascript: evaluate JavaScript in the Bot's browser context (run JS in Bot's browser console)
const execJavascript = async (botData, jsFunc) => {
    console.log(`[${botData.ip}][${botData._num}] [+] Executing JavaScript`);
    await botData.page.evaluate(() => {
        eval(jsFunc);
    });
};

// monitorBrowserRequest: print out every HTTP request performed by Bot's browser when visiting a URL
const monitorBrowserRequest = async (botData) => {
    await botData.page.on('request', req => {
        console.log(`[+] Browser is requesting to ${req.url()}`);
    });
}

// monitorConsoleOutput: print out Bot's browser console output
const monitorConsoleOutput = async (botData) => {
    await botData.page.on('console', async msg => {
        msg.args().forEach(arg => {
            arg.jsonValue().then(_arg => {
                console.log(`[$] Console Output: `, _arg);
            });
        });
    });
}

const botDoThings = async (botData) => {
    // 1. Set the FLAG into Bot's cookie
    setCookie(botData);

    // 2. Execute JavaScript on Bot's browser console
    execJavascript(botData, () => {
        console.log(document.cookie);
    });

    // 3. Display requests performed by Bot's browser
    monitorBrowserRequest(botData);

    // 4. Display Bot's browser console output
    monitorConsoleOutput(botData);

    // 5. etc., etc. Feel free to add whatever other scenario you have in mind :)

    /////////////////////////////////////////////////////////////////////////////
};

module.exports = botDoThings;