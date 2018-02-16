const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const DBref = require('./Variables').DBref;
// API key: ***REMOVED***
// https://alerts.ncdr.nat.gov.tw/***REMOVED***/

// $.get("https://alerts.ncdr.nat.gov.tw/RssAtomFeed.ashx?AlertType=6", function (data) {
//     parseString(data, function (err, result) {
//         console.log(result);
//         var data_total = result.feed.entry.length;
//         //console.dir(JSON.stringify(result));
//     });
// });
module.exports = {
    start: function () {
        setInterval(function () {
            $.get("http://opendata.cwb.gov.tw/govdownload?dataid=E-A0015-001R&authorizationkey=rdec-key-123-45678-011121314", function (data) {
                parseString(data, function (err, result) {
                    console.log(result);
                    var originTime = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].originTime[0].replace('-', '/').replace('-', '/').replace('T', ' ').replace('+08:00', '');
                    if (originTime != earthquake_lastime_know_time) {
                        var msg = result.cwbopendata.dataset[0].earthquake[0].reportContent[0];

                        var depth = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].depth[0]._;
                        var latitude = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].epicenterLat[0]._ + "°N";
                        var longitude = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].epicenterLon[0]._ + "°E";
                        var location = result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].epicenter[0].location[0];
                        var magnitude = Number(result.cwbopendata.dataset[0].earthquake[0].earthquakeInfo[0].magnitude[0].magnitudeValue[0]);

                        var reportimg = 'https://' + result.cwbopendata.dataset[0].earthquake[0].reportImageURI[0].split('://')[1];
                        var weburl = result.cwbopendata.dataset[0].earthquake[0].web[0];

                        var shakingArea = [], shakingAreaMax = [], shakingAreaCount = 0;
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

                        writeDB('earthquake_lastime_know_time', 3, 3, originTime);
                        earthquake_lastime_know_time = originTime;

                        var allmsg = '【地震報告】\n' + msg + '\n\n時間：' + originTime + '\n規模：芮氏規模 ' + magnitude + '\n深度：' + depth + ' 公里\n經緯度：' + latitude + ', ' + longitude + '\n相對位置：' + location + '\n查看網頁：' + weburl;
                        console.log(allmsg);

                        readDB(DBref.indexOf('earthquake_notification') + 1).then(function (earthquake_notification_list) {
                            for (i = 0; i < earthquake_notification_list.length; i++) {
                                bot.push(earthquake_notification_list[i], allmsg);
                            }
                            OtherFunctions.uploadPicToImgurByURL(reportimg, allmsg).then(function (pic_link) {
                                for (i = 0; i < earthquake_notification_list.length; i++) {
                                    bot.push(earthquake_notification_list[i], {
                                        "type": "image",
                                        "originalContentUrl": pic_link,
                                        "previewImageUrl": pic_link
                                    });
                                }
                            });
                        });
                    }
                });
            });
        }, 60000);
    }
}