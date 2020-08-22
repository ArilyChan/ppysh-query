"use strict";

const ScoreObject = require("./objects/ScoreObject");
const OsuApi = require("./ApiRequest");
const utils = require("./utils");

class getBestScoresData {
    constructor(host, apiKey, apiObjects, searchText = "") {
        this.host = host;
        this.apiKey = apiKey;
        this.apiObject = (Array.isArray(apiObjects)) ? apiObjects[0] : apiObjects; // 只允许查一个人
        this.searchText = searchText;
    }

    async getBestScoresObject() {
        const result = await OsuApi.getUserBest(this.apiObject, this.host, this.apiKey);
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
            if (over15Count > 0) output = output + "为防止文字过长，已省略剩余的 " + over15Count + " 个bp";
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
        const result = await OsuApi.getUserBest(this.apiObject, this.host, this.apiKey);
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
            let rank_list = ["XH", "X", "SH", "S", "A", "B", "C", "D"];
            let rank_count = [0, 0, 0, 0, 0, 0, 0, 0];
            let length = scoreObjects.length;
            let maxpp = 0;
            let minpp = 0;
            let perfectcount = 0;
            let enabled_mods_list = [];
            let enabled_mods_count = [];
            for (let i = 0; i < length; i++) {
                // 记录rank
                let rank = scoreObjects[i].rank;
                let rankIndex = rank_list.indexOf(rank);
                if (rankIndex < 0) { // 应该没有除rank_list之外的rank吧，这个只是以防万一
                    rank_list.push(rank);
                    rank_count.push(1);
                }
                else {
                    rank_count[rankIndex] = rank_count[rankIndex] + 1;
                }
                // 记录mods
                let mods = scoreObjects[i].mods;
                let modIndex = enabled_mods_list.indexOf(mods);
                if (modIndex < 0) {
                    enabled_mods_list.push(mods);
                    enabled_mods_count.push(1);
                }
                else {
                    enabled_mods_count[modIndex] = enabled_mods_count[modIndex] + 1;
                }
                // 记录pp最大值和最小值，一般是按pp降序排列的，这个只是以防万一
                let pp = scoreObjects[i].pp;
                if (pp > maxpp) maxpp = pp;
                if (minpp === 0) minpp = pp;
                else if (pp < minpp) minpp = pp;
                if (scoreObjects[i].perfect === 1) perfectcount += 1;
            }
            for (let i = 0; i < rank_list.length; i++) {
                if (rank_count[i] > 0) output = output + rank_count[i] + " 个 " + rank_list[i] + "\n";
            }
            output = output + "mod统计：\n";
            for (let i = 0; i < enabled_mods_list.length; i++) {
                if (enabled_mods_count[i] > 0) output = output + enabled_mods_count[i] + " 个 " + utils.getScoreModsString(enabled_mods_list[i]) + "\n";
            }
            output = output + "最高pp：" + maxpp + "\n";
            output = output + "最低pp：" + minpp + "\n";
            const aboveSCount = rank_count[0] + rank_count[1] + rank_count[2] + rank_count[3];
            const sbCount = aboveSCount - perfectcount;
            if (sbCount > 0) output = output + "其中有 " + sbCount + " 个S评级的成绩不是满combo QAQ";
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
}


module.exports = getBestScoresData;