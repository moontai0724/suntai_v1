// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

// Require config
const Config = require('../config/config');
const LineBotClient = new LineBotSDK.Client(Config);

const DBref = require('./Variables').DBref;

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const MsgFormat = require('./MsgFormat');
const ConnectDB = require('./ConnectDB');
const UploadPicToImgurByURL = require('./UploadPicToImgurByURL');

// API key: ***REMOVED***
// https://alerts.ncdr.nat.gov.tw/***REMOVED***/

module.exports = {
    opendata: function () {
        setInterval(function () {
            $.get("http://opendata.cwb.gov.tw/govdownload?dataid=E-A0015-001R&authorizationkey=rdec-key-123-45678-011121314", function (data) {
                parseString(data, function (err, result) {
                    console.log(result);
                    ConnectDB.readDB(DBref.indexOf('earthquake_last_know_time') + 1).then(function (earthquake_last_know_time) {
                        let originTime = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].originTime[0].replace('-', '/').replace('-', '/').replace('T', ' ').replace('+08:00', '');
                        if (originTime != earthquake_last_know_time) {
                            let msg = result.cwbopendata.dataset[0].earthquake[0].reportContent[0];

                            let depth = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].depth[0]._;
                            let latitude = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].epicenterLat[0]._ + "°N";
                            let longitude = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].epicenterLon[0]._ + "°E";
                            let location = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].location[0];
                            let magnitude = Number(result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].magnitude[0].magnitudeValue[0]);

                            let reportimg = 'https://' + result.cwbopendata.dataset[0].earthquake[0].reportImageURI[0].split('://')[1];
                            let weburl = result.cwbopendata.dataset[0].earthquake[0].web[0];

                            let shakingArea = [], shakingAreaMax = [], shakingAreaCount = 0;
                            for (x = 0; x < result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea.length; x++) {
                                if (result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[x].areaDesc[0].indexOf('最大震度') == -1) {
                                    shakingArea[shakingAreaCount++] = {
                                        "areaName": result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[x].areaName[0],
                                        "areaIntensity": Number(result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[x].areaIntensity[0]._),
                                        "sub": []
                                    };
                                    for (y = 0; y < result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[0].eqStation.length; y++) {
                                        shakingArea[shakingAreaCount - 1].sub[y] = {
                                            "stationName": result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[0].eqStation[y].stationName[0],
                                            "stationIntensity": Number(result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[0].eqStation[y].stationIntensity[0]._)
                                        }
                                    }
                                } else {
                                    shakingAreaMax[x - shakingAreaCount] = {
                                        "areaName": result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[x].areaName[0],
                                        "areaIntensity": Number(result.cwbopendata.dataset[0].earthquake[0].intensity[0].shakingArea[x].areaIntensity[0]._)
                                    };
                                }
                            }

                            ConnectDB.writeDB('earthquake_last_know_time', 3, 3, originTime);
                            earthquake_last_know_time = originTime;

                            let allmsg = '【地震報告】\n' + msg +
                                '\n\n時間：' + originTime +
                                '\n規模：芮氏規模 ' + magnitude +
                                '\n深度：' + depth + ' 公里' +
                                '\n經緯度：' + latitude + ', ' + longitude +
                                '\n相對位置：' + location +
                                '\n查看網頁：' + weburl;
                            console.log(allmsg);

                            ConnectDB.readDB(DBref.indexOf('earthquake_notification') + 1).then(function (earthquake_notification_list) {
                                for (i = 0; i < earthquake_notification_list.length; i++) {
                                    LineBotClient.pushMessage(earthquake_notification_list[i], MsgFormat.Text(allmsg));
                                }
                                UploadPicToImgurByURL.start(reportimg, allmsg).then(function (pic_link) {
                                    for (i = 0; i < earthquake_notification_list.length; i++) {
                                        LineBotClient.pushMessage(earthquake_notification_list[i], MsgFormat.Image(pic_link, pic_link));
                                    }
                                });
                            });
                        }
                    });
                });
            });
        }, 60000);
    },
    alert: function () {
        $.get("https://alerts.ncdr.nat.gov.tw/RssAtomFeed.ashx?AlertType=6", function (data) {
            parseString(data, function (err, result) {
                console.log(result);
                var data_total = result.feed.entry.length;
                //console.dir(JSON.stringify(result));
            });
        });
    }
}