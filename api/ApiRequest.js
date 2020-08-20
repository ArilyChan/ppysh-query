"use strict";

const querystring = require('querystring');
const https = require('https');

class OsuApi {
    static apiRequest(options) {

        let request_timer = null, req = null;
        // 请求5秒超时
        request_timer = setTimeout(function () {
            req.abort();
            throw 'Request Timeout.';
        }, 5000);

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

            req = https.request(requestOptions, function (res) {
                clearTimeout(request_timer);

                // 等待响应20秒超时
                var response_timer = setTimeout(function () {
                    res.destroy();
                    throw 'Response Timeout.';
                }, 20000);

                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    _data += chunk;
                });
                res.on('end', function () {
                    clearTimeout(response_timer);
                    resolve(_data);
                });
                res.on('error', function (e) {
                    clearTimeout(response_timer);
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

    static async getBeatmaps(options, host, apikey) {
        options.k = apikey;
        const resp = await this.apiCall('/get_beatmaps', options, host);
        return resp;
    }

    static async getUser(options, host, apikey) {
        options.k = apikey;
        const resp = await this.apiCall('/get_user', options, host);
        return resp;
    }

    static async getScores(options, host, apikey) {
        options.k = apikey;
        const resp = await this.apiCall('/get_scores', options, host);
        return resp;
    }

    static async getUserBest(options, host, apikey) {
        options.k = apikey;
        const resp = await this.apiCall('/get_user_best', options, host);
        return resp;
    }

    static async getUserRecent(options, host, apikey) {
        options.k = apikey;
        const resp = await this.apiCall('/get_user_recent', options, host);
        return resp;
    }
}

module.exports = OsuApi;
