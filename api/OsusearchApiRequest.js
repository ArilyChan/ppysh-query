"use strict";

const querystring = require('querystring');
const https = require('https');

// 参考了白菜的源码：https://github.com/Mother-Ship/cabbageWeb/
// 考虑到访问速度，只用于通过搜索获取谱面id，按谱面id获取谱面信息时还是用osu api
class OsusearchApi {
    static apiRequest(options) {
        return new Promise((resolve, reject) => {
            const contents = (options) ? querystring.stringify(options) : "";
            const requestOptions = {
                host: 'osusearch.com',
                port: 443,
                type: 'https',
                method: 'GET',
                path: '/query/?' + contents,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': contents.length
                }
            }
            let _data = '';

            // console.log("发送请求：" + requestOptions.host + requestOptions.path);

            const req = https.request(requestOptions, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    _data += chunk;
                });
                res.on('end', function () {
                    resolve(_data);
                });
                res.on('error', function (e) {
                    console.dir('problem with request: ' + e.message);
                    reject(e)
                });
            });
            req.write(contents);
            req.end();
        })
    }

    static findtheMostSuitable(result, params) {
        // 为防止搜索Insane难度返回someone's Insane这种情况，优先选择完全匹配的
        if (params.diff_name) {
            let diff_result = result.filter((beatmap) => {
                return (beatmap.difficulty_name.toLowerCase() === params.diff_name.toLowerCase());
            });
            if (diff_result.length <= 0) return result[0];
            return diff_result[0];
        }
        else return result[0];
    }




    static async search(_data) {
        let params = {};
        if (_data.title) params.title = _data.title;
        if (_data.artist) params.artist = _data.artist;
        if (_data.mapper) params.mapper = _data.mapper;
        if (_data.diff_name) params.diff_name = _data.diff_name;
        // if (_data.modes) params.modes = _data.modes; //Standard/Taiko/CtB/Mania
        params.query_order = "play_count";
        return await this.apiRequest(params).then(data => {
            try {
                if (!data || data === "Server error.") return { code: 404 };
                let result = JSON.parse(data);
                if (result.result_count === 0) return { code: 404 };
                if (result.beatmaps.length > 1) return this.findtheMostSuitable(result.beatmaps, params).beatmap_id;
                return result.beatmaps[0].beatmap_id;
            }
            catch (ex) {
                console.log(ex);
                return { code: "error" };
            }
        });
    }



}

module.exports = OsusearchApi;
