"use strict";

// const CommandsInfo = require("./CommandsInfo");
const Arg = require("./Arg");
const UserInfo = require("../user/UserInfo");

const getBeatmapData = require("../api/getBeatmapData");
const getBestScoresData = require("../api/getBestScoresData");
const getRecentScoresData = require("../api/getRecentScoresData");
const getScoreData = require("../api/getScoreData");
const getUserData = require("../api/getUserData");


class Command {
    /**
     * @param {Number} userId 发送者Id
     * @param {String} message 消息
     */
    constructor(userId, message, admin = [], apikey) {
        this.userId = userId;
        this.host = "osu.ppy.sh";
        this.apikey = apikey;
        /** @type {String} */
        this.msg = (message) ? message.trim().replace(/&#(x)?(\w+);/g, function ($, $1, $2) {
            return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
        }) : "";
        this.commandString = "";
        this.argString = "";
        this.userInfo = { qqId: userId, osuId: -1, osuName: "", defaultMode: "" };
        this.admin = admin;
    }

    /**
     * 检查消息前缀，暂只支持单个字母作为前缀
     * @param {String} prefix1
     * @param {String} prefix2
     * @returns {Boolean} 消息是否符合前缀
     */
    cutPrefix(prefix1, prefix2) {
        const msgPrefix = this.msg.substring(0, 1);
        if ((msgPrefix !== prefix1) && (msgPrefix !== prefix2)) return false;
        else {
            this.msg = this.msg.substring(1).trim();
            return true;
        }
    }

    /**
     * 拆出指令和参数，使用前需要先cutPrefix
     * @param {RegExp} commandReg 
     * @returns {Boolean} 消息是否符合指令形式
     */
    cutCommand(commandReg) {
        const mr = commandReg.exec(this.msg);
        if (mr === null) return false;
        else {
            this.commandString = mr[1].toLowerCase();
            this.argString = this.msg.substring(this.commandString.length).trim();
            return true;
        }
    }

    async getUserInfo(nedb) {
        this.userInfo = await new UserInfo(this.host).getUserOsuInfo(this.userId, nedb);
    }

    getNoArgErrorMessage(argName, argNecessity) {
        let errorMessage = "参数错误：";
        argName = argName.toLowerCase();
        if (argName.indexOf("userstringwithbeatmap") >= 0 || argName.indexOf("userstringwithoutbeatmap") >= 0) errorMessage = errorMessage + "缺少必要参数：玩家名";
        else if (argName.indexOf("beatmapstringwithuser") >= 0 || argName.indexOf("beatmapstringwithoutuser") >= 0) errorMessage = errorMessage + "缺少必要参数：谱面";
        else if (argName.indexOf("mode") >= 0) errorMessage = errorMessage + "缺少必要参数：模式";
        else if (argName.indexOf("limit") >= 0) errorMessage = errorMessage + "缺少必要参数：索引";
        else if (argName.indexOf("mods") >= 0) errorMessage = errorMessage + "缺少必要参数：mod";
        if (argNecessity === 1) errorMessage = errorMessage + "，您也可以用setid绑定您的osu账号";
        return errorMessage;
    }

    /**
     * 分析argString
     * @param {Object} commandInfo 
     * @param {Object} regs 
     * @param {nedb} nedb 
     * @returns {Promise<Arg>}
     */
    async getArgObject(commandInfo, regs, nedb) {
        let args = {};
        /**@type {Array<String>} */
        let argsName = commandInfo.args;
        /**@type {Array<-1|0|1>}  2：必须直接提供 1：user，必须提供，省略时从存储中寻找 0：mods，可省略，省略时从存储中寻找，如果找不到则省略 -1：可省略 */
        let argNecessity = commandInfo.argNecessity;
        // 先去获取数据库
        await this.getUserInfo(nedb);
        // me指令没有userId参数，默认是绑定账号，只为了兼容白菜指令，不要它代码会更简洁一点
        if (commandInfo.type === "api_score_me" ||
            // commandInfo.type === "api_score_me_rx" ||
            commandInfo.type === "api_score_vstop" ||
            commandInfo.type === "bot_setmode" ||
            commandInfo.type === "api_nbp" ||
            commandInfo.type === "api_nbp_rx"
        ) args.userStringWithoutBeatmap = this.userInfo.osuId;
        argsName.map((argName, index) => {
            let ar = regs[argName].exec(this.argString);
            if (ar === null) {
                // 没匹配到该参数
                if (argNecessity[index] === 2) throw this.getNoArgErrorMessage(argsName[index], 2);
                else if (argNecessity[index] === 1) {
                    if (argsName[index] === "userStringWithoutBeatmap" && this.userInfo.osuId > 0) args.userStringWithoutBeatmap = this.userInfo.osuId;
                    else if (argsName[index] === "userStringWithBeatmap" && this.userInfo.osuId > 0) args.userStringWithBeatmap = this.userInfo.osuId;
                    else if (argsName[index] === "modeString" && (this.userInfo.defaultMode || this.userInfo.defaultMode === 0)) args.modeString = this.userInfo.defaultMode;
                    else if (argsName[index] === "onlyModeString" && (this.userInfo.defaultMode || this.userInfo.defaultMode === 0)) args.onlyModeString = this.userInfo.defaultMode;
                    else throw this.getNoArgErrorMessage(argsName[index], 1);
                }
                else if (argNecessity[index] === 0) {
                    if (argsName[index] === "userStringWithoutBeatmap" && this.userInfo.osuId > 0) args.userStringWithoutBeatmap = this.userInfo.osuId;
                    else if (argsName[index] === "userStringWithBeatmap" && this.userInfo.osuId > 0) args.userStringWithBeatmap = this.userInfo.osuId;
                    else if (argsName[index] === "modeString" && (this.userInfo.defaultMode || this.userInfo.defaultMode === 0)) args.modeString = this.userInfo.defaultMode;
                    else if (argsName[index] === "onlyModeString" && (this.userInfo.defaultMode || this.userInfo.defaultMode === 0)) args.onlyModeString = this.userInfo.defaultMode;
                }
            }
            else {
                args[argName] = ar[1];
            }
        });
        return new Arg(args);
    }


    getHelp(prefix, commands) {
        let output = ""
        if (!this.argString) {
            output = output + "osu.ppy.sh 简略查询\n";
            output = output + prefix + "setid 绑定账号\n";
            output = output + prefix + "mode 设置默认模式\n";
            output = output + prefix + "stat 查状态\n";
            output = output + prefix + "bp 查bp\n";
            output = output + prefix + "rn 查bp统计\n";
            output = output + prefix + "todaybp 查今日bp\n";
            output = output + prefix + "me 查自己成绩\n";
            output = output + prefix + "pr 查最近pass成绩\n";
            output = output + prefix + "recent 查最近成绩（包括未完成）\n";
            output = output + prefix + "score 查成绩\n";
            output = output + prefix + "top 查单曲#1成绩\n";
            output = output + "\n";
            output = output + prefix + "help + 指令 可以查询该指令详细信息\n";
            // output = output + "基本指令有：" + commands.reduce((acc, cur) => { return acc + cur.command[0] + "/" }, "");
            return output;
        }
        // 查找指令
        for (let com of commands) {
            if (com.command.includes(this.argString)) {
                output = output + com.info + "\n";
                output = output + "指令：" + com.command.join("/") + "\n";
                output = output + "参数：" + com.argsInfo;
                return output;
            }
        }
        return "没有 " + this.argString + " 这个指令呢";
    }

    /**
     * 运行指令
     * @param {CommandsInfo} commandsInfo 
     * @param {nedb} nedb 
     */
    async execute(commandsInfo, nedb) {
        try {
            if (!this.cutPrefix(commandsInfo.prefix, commandsInfo.prefix2)) return ""; // 非指定前缀
            if (!this.cutCommand(commandsInfo.commandReg)) return ""; // 指令格式不正确
            // 帮助
            if (this.commandString === "help") {
                return this.getHelp(commandsInfo.prefix, commandsInfo.commands);
            }
            // 查找指令
            // score api暂不能获取rx模式成绩！！
            const commands = commandsInfo.commands;
            for (let com of commands) {
                if (com.command.includes(this.commandString)) {
                    let arg = await this.getArgObject(com, commandsInfo.regs, nedb);
                    let type = com.type;
                    switch (type) {
                        case 'api_beatmap': return await this.getApiBeatmapInfo(arg);
                        case 'api_user': return await this.getApiUserInfo(arg, nedb);
                        case 'api_score':
                        case 'api_score_me': return await this.getApiScoreInfo(arg, false);
                        case 'api_score_top': return await this.getApiScoreInfo(arg, true);
                        case 'api_bp': return this.getApiBpInfo(arg);
                        // case 'api_nbp': return this.getApiBpNumberInfo(arg);
                        case 'api_ranknumber': return this.getApiRankNumber(arg);
                        case 'api_todaybp': return this.getApiTodayBpInfo(arg);
                        case 'api_recent': return this.getApiRecentInfo(arg, false);
                        case 'api_recent_passed': return this.getApiRecentInfo(arg, true);
                        case 'bot_bind': return this.getBotBindInfo(arg, nedb);
                        case 'bot_unbind': return this.getBotUnbindInfo(arg, nedb);
                        case 'bot_setmode': return this.getBotSetmodeInfo(arg, nedb);
                        default: return "当你看到这条信息说明指令处理代码有bug惹";
                    }
                }
            }
            return ""; // 找不到该指令
        }
        catch (ex) {
            return ex;
        }
    }

    async getApiBeatmapInfo(arg) {
        try {
            let arg2 = await arg.getBeatmapId();
            let apiObjects = arg2.getOsuApiObject();
            return await new getBeatmapData(this.host, this.apikey, apiObjects).output();
        }
        catch (ex) {
            return ex;
        }
    }

    async getApiUserInfo(arg, nedb) {
        let apiObjects = arg.getOsuApiObject();
        return await new getUserData(this.host, this.apikey, apiObjects).output(nedb);
    }

    async getApiScoreInfo(arg, isTop) {
        try {
            let arg2 = await arg.getBeatmapId();
            let apiObjects = arg2.getOsuApiObject();
            return await new getScoreData(this.host, this.apikey, apiObjects, isTop).output();
        }
        catch (ex) {
            return ex;
        }
    }

    async getApiBpInfo(arg) {
        let apiObjects = arg.getOsuApiObject();
        return await new getBestScoresData(this.host, this.apikey, apiObjects).output();
    }

    async getApiRankNumber(arg) {
        let apiObjects = arg.getOsuApiObject();
        return await new getBestScoresData(this.host, this.apikey, apiObjects).outputRankNumber();
    }

    async getApiTodayBpInfo(arg) {
        let apiObjects = arg.getOsuApiObject();
        return await new getBestScoresData(this.host, this.apikey, apiObjects).outputToday();
    }

    /*
    async getApiBpNumberInfo(arg) {
        try {
            let arg2 = await arg.getBeatmapId();
            let apiObjects = arg2.getOsuApiObject();
            return await new getBestScoresData(this.host, this.apikey, apiObjects, arg.beatmapSearchString).outputBpNumber();
        }
        catch (ex) {
            return ex;
        }
    }
    */

    async getApiRecentInfo(arg, isPassed) {
        let apiObjects = arg.getOsuApiObject();
        return await new getRecentScoresData(this.host, this.apikey, apiObjects, isPassed).output();
    }

    async getBotBindInfo(arg, nedb) {
        let apiObjects = arg.getOsuApiObject();
        return await new UserInfo(this.host, this.apikey).bindUser(nedb, this.userId, apiObjects[0]);
    }

    async getBotUnbindInfo(arg, nedb) {
        // 只允许管理员unbind
        if (this.admin.indexOf(this.userId) < 0) {
            return "只有管理员才能进行解绑操作";
        }
        let user = arg.getOsuApiObject()[0].u;
        let qqId = parseInt(user);
        if (!qqId) return "请输入需要解绑的QQ号";
        return await new UserInfo(this.host, this.apikey).unbindUser(nedb, qqId);
    }

    async getBotSetmodeInfo(arg, nedb) {
        let apiObjects = arg.getOsuApiObject();
        return await new UserInfo(this.host, this.apikey).setMode(nedb, this.userId, apiObjects[0].m);
    }
}

module.exports = Command;