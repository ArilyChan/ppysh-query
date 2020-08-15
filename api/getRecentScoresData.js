"use strict";

const ScoreObject = require("./objects/ScoreObject");
const OsuApi = require("./ApiRequest");
const utils = require("./utils");

class getRecentScoresData {
    constructor(host, apikey, apiObjects, isPassed) {
        this.host = host;
        this.apikey = apikey;
        this.apiObject = (Array.isArray(apiObjects)) ? apiObjects[0] : apiObjects; // 只允许查一个人
        this.isPassed = isPassed;
    }

    async getRecentScoresObject() {
        const result = await OsuApi.getUserRecent(this.apiObject, this.host, this.apikey);
        if (result.code === 404) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject);
        if (result.code === "error") throw "获取成绩出错 " + utils.apiObjectToString(this.apiObject);
        if ((!Array.isArray(result)) || (result.length <= 0)) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject) + "\n";
        let scoreObjects = result.map(item => { return new ScoreObject(item); });
        return scoreObjects;
    }

    async output() {
        try {
            (this.isPassed) ? this.apiObject.limit = 100 : this.apiObject.limit = 1;
            let scoreObjects = await this.getRecentScoresObject();
            if (this.isPassed) {
                let output = "";
                // 寻找rank不等于F的
                for (var i = 0; i < scoreObjects.length; i++) {
                    if (scoreObjects[i].rank != "F") {
                        // output = output + scoreObjects[i].beatmap.toScoreTitle(scoreObjects[i].mode);
                        output = output + scoreObjects[i].toCompleteString(parseInt(this.apiObject.m));
                        return output;
                    }
                }
                return "找不到最近的pass成绩";
            }
            else {
                let scoreObject = scoreObjects.pop();
                let output = "";
                // output = output + scoreObject.beatmap.toScoreTitle(scoreObject.mode);
                output = output + scoreObject.toCompleteString(parseInt(this.apiObject.m));
                return output;
            }
        }
        catch (ex) {
            return ex;
        }
    }
}


module.exports = getRecentScoresData;