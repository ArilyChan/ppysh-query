"use strict";

const CommandsInfo = require("./command/CommandsInfo");
const Command = require("./command/Command");

class ppysbQuery {
    /**
     * @param {Object} params 
     * @param {Array<Number>} params.admin 管理员列表，必要
     * @param {String} params.apiKey osu apikey，必要
     * @param {String} params.database 数据库路径，默认为根目录下的Opsbot-v1.db
     * @param {String} params.prefix 指令前缀，必须为单个字符，默认为?
     * @param {String} params.prefix2 备用指令前缀，必须为单个字符，默认为？
     */
    constructor(params) {
        this.admin = params.admin || [];
        this.apiKey = params.apiKey || "";
		this.database = params.database || './Opsbot-v1.db';
        this.prefix = params.prefix || "?";
		this.prefix2 = params.prefix2 || "？";
		this.nedb = require('./database/nedb')(this.database);
		this.commandsInfo = new CommandsInfo(this.prefix, this.prefix2);
	}
	
    /**
     * 获得返回消息
	 * @param {Number} userId
     * @param {String} message 输入的消息
     */
    async apply(userId, message) {
        try {
            if (!message.length || message.length < 2) return "";
            if (message.substring(0, 1) !== this.prefix && message.substring(0, 1) !== this.prefix2) return "";
			let commandObject = new Command(userId, message, this.admin, this.apiKey);
			let reply = await commandObject.execute(this.commandsInfo, this.nedb);
            return reply;
        } catch (ex) {
            console.log(ex);
            return "";
        }
    }
}


module.exports = ppysbQuery;
