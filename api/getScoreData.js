"use strict";

const ScoreObject = require("./objects/ScoreObject");
const OsuApi = require("./ApiRequest");
const utils = require("./utils");

class getScoreData {
    constructor(host, apikey, apiObjects, isTop) {
        this.host = host;
        this.apikey = apikey;
        this.apiObjects = apiObjects;
        this.isTop = isTop;
    }

    async getScoreObjects(argObject) {
        const result = await OsuApi.getScores(argObject, this.host, this.apikey);
        if (result.code === 404) throw "找不到成绩 " + utils.apiObjectToString(argObject);
        if (result.code === "error") throw "获取成绩出错 " + utils.apiObjectToString(argObject);
        if ((!Array.isArray(result)) || (result.length <= 0)) throw "找不到成绩 " + utils.apiObjectToString(argObject);
        let scoreObjects = result.map(item => { return new ScoreObject(item); });
        return scoreObjects;
    }

    async output() {
        try {
            let argObject = this.apiObjects[0];
            if (this.isTop) argObject.limit = 1; // limit = 1 即为最高pp
            let scoreObjects = await this.getScoreObjects(argObject);
            let output = "";
            // output = output + beatmapObject.toScoreTitle(scoreObjects[0].mode);
            output = output + scoreObjects[0].toCompleteString(parseInt(argObject.m));
            return output;
        }
        catch (ex) {
            return ex;
        }
    }

}


module.exports = getScoreData;