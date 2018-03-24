const najax = $ = require('najax');
const sqlite = require('sqlite');
const UTC8Time = require('./UTC8Time');

var db_setting;
OpenDB();
async function OpenDB() {
    db_setting = await sqlite.open('../database/settings.sqlite', { Promise });
}

const unique = ['EarthquakeNotification', 'Variables'];

module.exports = {
    writeDB: function () {
        return new Promise((resolve, reject) => {
            let does = false;
            start();
            function start(time) {
                setTimeout(() => {
                    if (db_settings) {
                        does = true;
                        if (sheetName) db_settings.all('SELECT * FROM ' + sheetName).then(data => {
                            if (unique.indexOf(sheetName) == -1) {
                                let result = [];
                                data.forEach(element => {
                                    result[result.length] = element.id;
                                });
                                resolve(result);
                            }
                        });
                        else reject('沒有提供 sheetNumber');
                    } else start(500);
                }, time);
            }
        });
    },
    readDB: function (sheetName) {
        return new Promise((resolve, reject) => {
            let does = false;
            start();
            function start(time) {
                setTimeout(() => {
                    if (db_settings) {
                        does = true;
                        if (sheetName) db_settings.all('SELECT * FROM ' + sheetName).then(data => {
                            if (unique.indexOf(sheetName) == -1) {
                                let result = [];
                                data.forEach(element => {
                                    result[result.length] = element.id;
                                });
                                resolve(result);
                            }
                        });
                        else reject('沒有提供 sheetNumber');
                    } else start(500);
                }, time);
            }
        });
    }
};