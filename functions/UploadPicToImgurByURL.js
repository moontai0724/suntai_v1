const najax = $ = require('najax');
const UTC8Time = require('./UTC8Time');

module.exports = {
    start: function (imgurl, description) {
        return new Promise(function (resolve, reject) {
            $({
                type: "POST",
                url: "https://api.imgur.com/oauth2/token",
                contentType: "application/x-www-form-urlencoded;",
                data: 'refresh_token=***REMOVED***&' +
                    'client_id=***REMOVED***&' +
                    'client_secret=***REMOVED***&' +
                    'grant_type=refresh_token',
                success: function (data) {
                    data = JSON.parse(data);
                    $({
                        type: "POST",
                        url: 'https://api.imgur.com/3/image',
                        headers: {
                            Authorization: 'Bearer ' + data.access_token,
                        },
                        data: {
                            "image": imgurl,
                            "album": "HUUim",
                            "type": "URL",
                            "description": description
                        },
                        success: function (data, status, xhr) {
                            data = JSON.parse(data);
                            console.log('Image Upload Success', data);
                            resolve(data.data.link);
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
                            console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
                            console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
                            reject(jqXHR);
                        }
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
                    console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
                    console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
                    reject(jqXHR);
                }
            });
        });
    }
};