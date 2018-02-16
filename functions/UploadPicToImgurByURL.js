const najax = $ = require('najax');
module.exports = {
    start: function (imgurl, description) {
        return new Promise(function (resolvem, reject) {
            $({
                type: "POST",
                url: "https://api.imgur.com/oauth2/token",
                contentType: "application/x-www-form-urlencoded;",
                data: 'refresh_token=***REMOVED***&' +
                    'clientime_id=***REMOVED***&' +
                    'clientime_secret=***REMOVED***&' +
                    'grantime_type=refresh_token',
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
                            console.log(getNowTime(), 'Responsed jqXHR: ', jqXHR);
                            console.log(getNowTime(), 'Responsed textStatus: ', textStatus);
                            console.log(getNowTime(), 'Responsed errorThrown: ', errorThrown);
                            reject(jqXHR);
                        }
                    });
                }
            });
        });
    }
};