"use strict";

const ScoreObject = require("./objects/ScoreObject");
const OsuApi = require("./ApiRequest");
const utils = require("./utils");

class getBestScoresData {
    constructor(host, apikey, apiObjects, searchText = "") {
        this.host = host;
        this.apikey = apikey;
        this.apiObject = (Array.isArray(apiObjects)) ? apiObjects[0] : apiObjects; // 只允许查一个人
        this.searchText = searchText;
    }

    async getBestScoresObject() {
        const result = await OsuApi.getUserBest(this.apiObject, this.host, this.apikey);
        if (result.code === 404) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject);
        if (result.code === "error") throw "获取成绩出错 " + utils.apiObjectToString(this.apiObject);
        if ((!Array.isArray(result)) || (result.length <= 0)) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject);
        let scoreObjects = result.map(item => { return new ScoreObject(item); });
        return scoreObjects;
    }

    async outputToday() {
        try {
            let today = new Date().getTime();
            // bp列表
            let output = "";
            this.apiObject.limit = "100";
            let scoreObjects = await this.getBestScoresObject();
            let todayScoreObjects = scoreObjects.filter((scoreObject) => {
                return (today - scoreObject.getPlayedDate().getTime() < 24 * 3600 * 1000)
            });
            if (todayScoreObjects.length <= 0) return "您今天还没刷新bp呢";
            let over15Count = 0;
            if (todayScoreObjects.length > 15) {
                over15Count = todayScoreObjects.length - 15;
                todayScoreObjects = todayScoreObjects.slice(0, 15);
            }
            todayScoreObjects.map((scoreObject) => {
                // output = output + scoreObject.beatmap.toScoreTitle(scoreObject.mode);
                output = output + scoreObject.toString() + "\n";
            });
            if (over15Count > 0) output = output + "为防止文字过长，已省略剩余的 "+ over15Count + " 个bp";
            return output;
        }
        catch (ex) {
            return ex;
        }
    }

    async output() {
        try {
            if (this.apiObject.limit) {
                // 指定bp
                let scoreObjects = await this.getBestScoresObject();
                let scoreObject = scoreObjects.pop();
                let output = "";
                // output = output + scoreObject.toCompleteString(parseInt(this.apiObject.m));
                output = output + await scoreObject.toCompleteString(parseInt(this.apiObject.m), true);
                return output;
            }
            else {
                // bp列表
                this.apiObject.limit = "5"; // 设置为bp5，以减轻获取工作
                let scoreObjects = await this.getBestScoresObject();
                let output = "";
                scoreObjects.map((scoreObject) => {
                    // output = output + scoreObject.beatmap.toScoreTitle(scoreObject.mode);
                    output = output + scoreObject.toString() + "\n";
                });
                return output;
            }
        }
        catch (ex) {
            return ex;
        }
    }

    async getAllBestScoresObject() {
        this.apiObject.limit = "100";
        const result = await OsuApi.getUserBest(this.apiObject, this.host, this.apikey);
        if (result.code === 404) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject);
        if (result.code === "error") throw "获取成绩出错 " + utils.apiObjectToString(this.apiObject);
        if ((!Array.isArray(result)) || (result.length <= 0)) throw "找不到成绩 " + utils.apiObjectToString(this.apiObject);
        let scoreObjects = result.map(item => { return new ScoreObject(item); });
        return scoreObjects;
    }

    async outputRankNumber() {
        try {
            // bp列表
            let output = "bp成绩统计：\n";
            let scoreObjects = await this.getAllBestScoresObject();
            let ranks = [];
            let counts = [];
            let length = scoreObjects.length;
            for (let i = 0; i < length; i++) {
                let rank = scoreObjects[i].rank;
                let rankIndex = ranks.indexOf(rank);
                if (rankIndex<0) {
                    ranks.push(rank);
                    counts.push(1);
                }
                else {
                    counts[rankIndex] = counts[rankIndex]+1;
                }
            }
            for (let i = 0; i < ranks.length; i++) {
                output = output + counts[i] + " 个 "+ ranks[i] + "\n";
            }
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
}


module.exports = getBestScoresData;