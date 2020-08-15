"use strict";

const utils = require('../utils');

class ScoreObject {
    constructor(score) {
        this.beatmap_id = score.beatmap_id;
        this.user_id = score.user_id;

        this.time = score.date; // 字符串格式，YYYY-MM-DDTHH:MM:SSZ

        this.score = score.score;
        this.maxcombo = score.maxcombo;
        this.count50 = score.count50;
        this.count100 = score.count100;
        this.count300 = score.count300;
        this.countmiss = score.countmiss;
        this.countkatu = score.countkatu;
        this.countgeki = score.countgeki;
        this.perfect = score.perfect; //0,1

        this.mods = score.enabled_mods;
        this.rank = score.rank;
        this.pp = score.pp || 0; // recent没有提供pp
    }

    getPlayedDate() {
        return new Date(this.time);
    }

    toString() {
        const comboString = "combo: " + this.maxcombo + " \t ";
        const modsString = utils.getScoreModsString(this.mods);
        const ppString = (this.pp === 0) ? "" : parseFloat(this.pp).toFixed(2) + "pp";
        return comboString + utils.format_number(this.score) + " \t " + this.rank + " \t | " + modsString + " \t " + ppString;
    }

    toCompleteString(mode) {
        const beatmapId = (this.beatmap_id) ? "beatmapId: " + this.beatmap_id + "\n" : "";
        const userId = (this.user_id) ? "userId: " + this.user_id + "\n" : "";
        const comboString = "combo: " + this.maxcombo + "\n";
        const modsString = "mod：" + utils.getScoreModsString(this.mods) + "\n";
        const rankString = "rank：" + this.rank + "\n";
        const ppString = (this.pp === 0 || this.completed === 0) ? "" : "pp：" + parseFloat(this.pp).toFixed(2) + "pp\n";
        const scoreString = "分数：" + utils.format_number(this.score) + "\n";
        let counts = [];
        if (mode === 0) {// std
            if (this.count300 > 0) counts.push(" " + this.count300 + "x 300 ");
            if (this.count100 > 0) counts.push(" " + this.count100 + "x 100 ");
            if (this.count50 > 0) counts.push(" " + this.count50 + "x 50 ");
            if (this.countmiss > 0) counts.push(" " + this.countmiss + "x miss ");
        }
        else if (mode === 1) {// taiko
            if (this.count300 > 0) counts.push(" " + this.count300 + "x 300 ");
            if (this.count100 > 0) counts.push(" " + this.count100 + "x 100 ");
            if (this.countmiss > 0) counts.push(" " + this.countmiss + "x miss ");
        }
        else if (mode === 2) {// catch
            // 官方把drop翻译成水滴，把droplet翻译成小水滴，个人感觉怪怪的
            if (this.count300 > 0) counts.push(" " + this.count300 + "x 水果 ");
            if (this.count100 > 0) counts.push(" " + this.count100 + "x 中果 ");
            if (this.count50 > 0) counts.push(" " + this.count50 + "x 果粒 ");
            if (this.countmiss > 0) counts.push(" " + this.countmiss + "x miss水果 ");
            if (this.countkatu > 0) counts.push(" " + this.countkatu + "x miss果粒 ");
        }
        else if (mode === 3) {// mania
            if (this.countgeki > 0) counts.push(" " + this.countgeki + "x 彩300 ");
            if (this.count300 > 0) counts.push(" " + this.count300 + "x 300 ");
            if (this.countkatu > 0) counts.push(" " + this.countkatu + "x 200 ");
            if (this.count100 > 0) counts.push(" " + this.count100 + "x 100 ");
            if (this.count50 > 0) counts.push(" " + this.count50 + "x 50 ");
            if (this.countmiss > 0) counts.push(" " + this.countmiss + "x miss ");
        }
        const playDate = "日期：" + this.getPlayedDate().toLocaleDateString();

        return beatmapId + userId + comboString + modsString + rankString + ppString + scoreString + counts.join("|") + "\n" + playDate;
    }

}

module.exports = ScoreObject;