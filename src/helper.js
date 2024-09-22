class BotData {
    constructor(reqNum, reqIp, url, page) {
        this.reqNum = reqNum;
        this.reqIp = reqIp;
        this.url = url;
        this.page = page;
    }
}

class VisitResult {
    constructor(success, response) {
        this.success = success;
        this.response = response;
    }
}

const isModuleAvailable = (path) => {
    try {
        require.resolve(path);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports.isModuleAvailable = isModuleAvailable;
module.exports.BotData = BotData;
module.exports.VisitResult = VisitResult;