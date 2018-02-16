const DBref = require('./Variables').DBref; //ok

const najax = $ = require('najax');
const UTC8Time = require('./UTC8Time');

module.exports = {
    writeDB: function (sheet, range, range2, value, column) {
        return new Promise(function (resolve, reject) {
            let totalrange, value2 = [];

            if (typeof (value) === 'string') {
                value2[0] = [];
                value2[0][0] = value;
            } else if (typeof (value) === 'object') {
                for (i = 0; i <= value.length; i++) {
                    value2[i] = [];
                    if (i == value.length) {
                        value2[i][0] = '';
                    } else {
                        value2[i][0] = value[i];
                    }

                }
            }

            if (!column) {
                totalrange = 'A' + range + ':A' + range2;
            } else {
                totalrange = column + range + ':' + column + range2;
            }

            $({
                type: "POST",
                url: "https://www.googleapis.com/oauth2/v4/token",
                contentType: "application/x-www-form-urlencoded;",
                data: 'refresh_token=***REMOVED***&' +
                    'clientime_id=***REMOVED***&' +
                    'clientime_secret=***REMOVED***&' +
                    'redirectime_uri=urn:ietf:wg:oauth:2.0:oob&' +
                    'grantime_type=refresh_token',
                success: function (data) {
                    data = JSON.parse(data);
                    $({
                        type: "PUT",
                        contentType: "application/json;",
                        url: 'https://sheets.googleapis.com/v4/spreadsheets/1jWoK5UEXlmZn7UEfj8VVcyYyha16xjvrm46YEWuPtHM/values/' + sheet + '!' + totalrange + '?valueInputOption=RAW&' +
                            'access_token=' + data.access_token,
                        data: JSON.stringify({
                            "range": sheet + "!" + totalrange,
                            "majorDimension": "ROWS",
                            "values": value2,
                        }),
                        success: function (data, status, xhr) {
                            console.log(UTC8Time.getNowTime(), 'Write Success.');
                            resolve();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
                            console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
                            console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
                            reject(jqXHR);
                        }
                    });
                }
            });
        });
    },

    readDB: function (sheetNumber) {
        return new Promise(function (resolve) {
            $.get('https://spreadsheets.google.com/feeds/list/1jWoK5UEXlmZn7UEfj8VVcyYyha16xjvrm46YEWuPtHM/' + sheetNumber + '/public/values?alt=json', function (data) {
                data = JSON.parse(data);
                switch (sheetNumber) {
                    case DBref.indexOf('owners') + 1:
                        let owners = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            owners[i] = data.feed.entry[i].gsx$owners.$t;
                            if (i == data.feed.entry.length - 1) {
                                owners.splice(owners.indexOf('base'), 1);
                                console.log('owners', owners);
                                resolve(owners);
                            }
                        }
                        break;
                    case DBref.indexOf('ontime_timer') + 1:
                        let ontime_timer_list = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            ontime_timer_list[i] = data.feed.entry[i].gsx$needtimerid.$t;
                            if (i == data.feed.entry.length - 1) {
                                ontime_timer_list.splice(ontime_timer_list.indexOf('base'), 1);
                                console.log('ontime_timer_list', ontime_timer_list);
                                resolve(ontime_timer_list);
                            }
                        }
                        break;
                    case DBref.indexOf('earthquake_notification') + 1:
                        let earthquake_notification_list = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            earthquake_notification_list[i] = data.feed.entry[i].gsx$earthquakenotification.$t;
                            if (i == data.feed.entry.length - 1) {
                                earthquake_notification_list.splice(earthquake_notification_list.indexOf('base'), 1);
                                console.log('earthquake_notification_list', earthquake_notification_list);
                                resolve(earthquake_notification_list);
                            }
                        }
                        break;
                    case DBref.indexOf('earthquake_last_know_time') + 1:
                        let earthquake_last_know_time = data.feed.entry[1].gsx$earthquakelastknowtime.$t;
                        console.log('earthquake_last_know_time', earthquake_last_know_time);
                        resolve(earthquake_last_know_time);
                        break;
                    case DBref.indexOf('owners_notice') + 1:
                        let owners_notice = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            owners_notice[i] = data.feed.entry[i].gsx$ownersnotice.$t;
                            if (i == data.feed.entry.length - 1) {
                                owners_notice.splice(owners_notice.indexOf('base'), 1);
                                console.log('owners_notice', owners_notice);
                                resolve(owners_notice);
                            }
                        }
                        break;
                    case DBref.indexOf('groups') + 1:
                        let groups = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            groups[i] = data.feed.entry[i].gsx$groups.$t;
                            if (i == data.feed.entry.length - 1) {
                                groups.splice(groups.indexOf('base'), 1);
                                console.log('groups', groups);
                                resolve(groups);
                            }
                        }
                        break;
                }
            });
        });
    }
};