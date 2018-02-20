const DBref = require('./Variables').DBref; //ok

const najax = $ = require('najax');
const UTC8Time = require('./UTC8Time');

module.exports = {
    writeDB: function (sheet, range1, range2, value, column1, column2, formattedname) {
        return new Promise(function (resolve, reject) {
            var range, value2 = [];

            if (sheet == 'earthquakenotification') {
                for (let x = 0; x < value.length; x++) {
                    let temp = value[x].area[0];
                    for (let y = 1; y < value[x].area.length; y++) {
                        temp += ', ' + value[x].area[y];
                    }
                    value[x].area = temp;
                }
            }

            if (!column1 && !column2) {
                range = 'A' + range1 + ':A' + range2;
                if (typeof (value) === 'string') {
                    value2[0] = [];
                    value2[0][0] = value;
                } else if (typeof (value) === 'object') {
                    for (let i = 0; i <= value.length; i++) {
                        value2[i] = [];
                        if (i == value.length) {
                            value2[i][0] = '';
                        } else {
                            value2[i][0] = value[i];
                        }

                    }
                }
            } else if (column1 && column2) {
                range = column1 + range1 + ':' + column2 + range2;
                if (formattedname) {
                    for (let x = 0; x <= value.length; x++) {
                        value2[x] = [];
                        for (let y = 0; y < formattedname.length; y++) {
                            if (x == value.length) {
                                value2[x][y] = '';
                            } else {
                                value2[x][y] = value[x][formattedname[y]];
                            }
                        }
                    }
                } else {
                    value2 = value;
                }
            }

            console.log(value2);

            $({
                type: "POST",
                url: "https://www.googleapis.com/oauth2/v4/token",
                contentType: "application/x-www-form-urlencoded;",
                data: 'refresh_token=***REMOVED***&' +
                    'client_id=***REMOVED***&' +
                    'client_secret=***REMOVED***&' +
                    'redirect_uri=urn:ietf:wg:oauth:2.0:oob&' +
                    'grant_type=refresh_token',
                success: function (data) {
                    data = JSON.parse(data);
                    $({
                        type: "PUT",
                        contentType: "application/json;",
                        url: 'https://sheets.googleapis.com/v4/spreadsheets/1jWoK5UEXlmZn7UEfj8VVcyYyha16xjvrm46YEWuPtHM/values/' + sheet + '!' + range + '?valueInputOption=RAW&' +
                            'access_token=' + data.access_token,
                        data: JSON.stringify({
                            "range": sheet + "!" + range,
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
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
                    console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
                    console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
                    reject(jqXHR);
                }
            });
        });
    },

    readDB: function (sheetNumber) {
        return new Promise(function (resolve) {
            $.get('https://spreadsheets.google.com/feeds/list/1jWoK5UEXlmZn7UEfj8VVcyYyha16xjvrm46YEWuPtHM/' + sheetNumber + '/public/values?alt=json', function (data) {
                data = JSON.parse(data);
                switch (sheetNumber) {
                    case DBref.indexOf('earthquakenotification') + 1:
                        let earthquake_notification_list = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            earthquake_notification_list[i] = {
                                'id': data.feed.entry[i].gsx$earthquakenotification.$t,
                                'area': data.feed.entry[i].gsx$area.$t.split(', ')
                            }
                            if (i == data.feed.entry.length - 1) {
                                earthquake_notification_list.splice(0, 1);
                                resolve(earthquake_notification_list);
                            }
                        }
                        break;
                    case DBref.indexOf('earthquakelastknowtime') + 1:
                        console.log('earthquake_last_know_time: ', data.feed.entry[1].gsx$earthquakelastknowtime.$t);
                        resolve(data.feed.entry[1].gsx$earthquakelastknowtime.$t);
                        break;
                    default:
                        let datalist = [];
                        for (let i = 0; i < data.feed.entry.length; i++) {
                            datalist[i] = data.feed.entry[i]['gsx$' + DBref[sheetNumber - 1]].$t;
                            if (i == data.feed.entry.length - 1) {
                                datalist.splice(datalist.indexOf('base'), 1);
                                console.log(DBref[sheetNumber - 1], datalist);
                                resolve(datalist);
                            }
                        }
                        break;
                }
            });
        });
    }
};