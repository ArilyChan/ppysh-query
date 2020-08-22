"use strict";

const querystring = require('querystring');
const https = require('https');

class OsuApi {
    static apiRequest(options) {
        return new Promise((resolve, reject) => {
            const contents = querystring.stringify(options.data);
            const requestOptions = {
                host: options.host,
                port: 443,
                type: 'https',
                method: 'GET',
                path: '/api' + options.path + '?' + contents,
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

    static async apiCall(_path, _data, _host) {
        return await this.apiRequest({
            path: _path,
            data: _data,
            host: _host
        }).then(data => {
            try {
                if (!data || data === "null") return { code: 404 };
                return JSON.parse(data);
            }
            catch (ex) {
                console.log(ex);
                return { code: "error" };
            }
        });
    }

    static async getBeatmaps(options, host, apiKey) {
        options.k = apiKey;
        const resp = await this.apiCall('/get_beatmaps', options, host);
        return resp;
    }

    static async getUser(options, host, apiKey) {
        options.k = apiKey;
        const resp = await this.apiCall('/get_user', options, host);
        return resp;
    }

    static async getScores(options, host, apiKey) {
        options.k = apiKey;
        const resp = await this.apiCall('/get_scores', options, host);
        return resp;
    }

    static async getUserBest(options, host, apiKey) {
        options.k = apiKey;
        const resp = await this.apiCall('/get_user_best', options, host);
        return resp;
    }

    static async getUserRecent(options, host, apiKey) {
        options.k = apiKey;
        const resp = await this.apiCall('/get_user_recent', options, host);
        return resp;
    }
}

module.exports = OsuApi;
