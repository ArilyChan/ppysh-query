"use strict";

module.exports = {
    enabled: false, // 暂时无法上传mp3，只能上传amr
    adminCommand: false,
    type: 'sayo_music',
    info: '试听谱面',
    command: ['music'],
    argsInfo: '[beatmap]',
    args: ['beatmapStringWithoutUser'],
    argNecessity: [2],
    addUserToArg: false,
    helpInfo: {
        defaultHelp: true,
        customHelp: "",
        defaultDetail: true,
        customDetail: ""
    },
    /**
     * @param {import("../command/Arg")} arg
     */
    call: async (arg) => {
        try {
            // 为了偷懒，这里的beatmapId其实是beatmapSetId，使用时一定要注意
            const arg2 = await arg.getBeatmapSetId();
            const beatmapSetId = arg2.beatmapId;
            return `[CQ:record,file=https://cdnx.sayobot.cn:25225/preview/${beatmapSetId}.mp3]`;
        }
        catch (ex) {
            return ex;
        }
    }
};
