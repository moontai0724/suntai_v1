// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');

// Require config
const Config = require('../config/config');
// ================================================== My Functions Start ==================================================

const DBref = require('./Variables').DBref; //ok
const Country = require('./Variables').Country;
const AllCity = require('./Variables').AllCity;
const AllCityList = require('./Variables').AllCityList;

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const QuizDB = require('./QuizDB'); //ok.include: value(function), get(function), searchIndex(function), searchData(function)
const EarthquakeCheck = require('./EarthquakeCheck'); //ok
const GetRandomNumber = require('./GetRandomNumber'); //ok.include: start(function)
const UploadPicToImgurByURL = require('./UploadPicToImgurByURL'); //ok.include: start(function)
const ConnectDB = require('./ConnectDB'); //ok
const CallTimer = require('./CallTimer'); //ok

// ================================================== My Functions Over ==================================================

// ID 參考：https://opendata.cwb.gov.tw/datalist
// 檔案下載： http://opendata.cwb.gov.tw/opendataapi?dataid=ID&authorizationkey=***REMOVED***
// 檔案下載： http://opendata.cwb.gov.tw/opendataapi?dataid=F-D0047-001&authorizationkey=***REMOVED***

// RESTful
// URL Format: https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?locationName={locationName}&elementName={elementName}&sort={sort}&startTime={startTime}&timeFrom={timeFrom}&timeTo={timeTo}
// https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?Authorization=***REMOVED***

// 各鄉鎮預報：
const WeatherArea = [{ areaName: '宜蘭縣', id: 'F-D0047-001' }, { areaName: '桃園市', id: 'F-D0047-005' }, { areaName: '新竹縣', id: 'F-D0047-009' }, { areaName: '苗栗縣', id: 'F-D0047-013' }, { areaName: '彰化縣', id: 'F-D0047-017' }, { areaName: '南投縣', id: 'F-D0047-021' }, { areaName: '雲林縣', id: 'F-D0047-025' }, { areaName: '嘉義縣', id: 'F-D0047-029' }, { areaName: '屏東縣', id: 'F-D0047-033' }, { areaName: '臺東縣', id: 'F-D0047-037' }, { areaName: '花蓮縣', id: 'F-D0047-041' }, { areaName: '澎湖縣', id: 'F-D0047-045' }, { areaName: '基隆市', id: 'F-D0047-049' }, { areaName: '新竹市', id: 'F-D0047-053' }, { areaName: '嘉義市', id: 'F-D0047-057' }, { areaName: '臺北市', id: 'F-D0047-061' }, { areaName: '高雄市', id: 'F-D0047-065' }, { areaName: '新北市', id: 'F-D0047-069' }, { areaName: '台中市', id: 'F-D0047-073' }, { areaName: '台南市', id: 'F-D0047-077' }, { areaName: '連江縣', id: 'F-D0047-081' }, { areaName: '金門縣', id: 'F-D0047-085' }];

// 各地區小助手：
const helper = [{ areaName: '台北市', id: 'F-C0032-009' }, { areaName: '新北市', id: 'F-C0032-010' }, { areaName: '基隆市', id: 'F-C0032-011' }, { areaName: '花蓮縣', id: 'F-C0032-012' }, { areaName: '宜蘭縣', id: 'F-C0032-013' }, { areaName: '金門縣', id: 'F-C0032-014' }, { areaName: '澎湖縣', id: 'F-C0032-015' }, { areaName: '台南市', id: 'F-C0032-016' }, { areaName: '高雄市', id: 'F-C0032-017' }, { areaName: '嘉義縣', id: 'F-C0032-018' }, { areaName: '嘉義市', id: 'F-C0032-019' }, { areaName: '苗栗縣', id: 'F-C0032-020' }, { areaName: '台中市', id: 'F-C0032-021' }, { areaName: '桃園市', id: 'F-C0032-022' }, { areaName: '新竹縣', id: 'F-C0032-023' }, { areaName: '新竹市', id: 'F-C0032-024' }, { areaName: '屏東縣', id: 'F-C0032-025' }, { areaName: '南投縣', id: 'F-C0032-026' }, { areaName: '台東縣', id: 'F-C0032-027' }, { areaName: '彰化縣', id: 'F-C0032-028' }, { areaName: '雲林縣', id: 'F-C0032-029' }, { areaName: '連江縣', id: 'F-C0032-030' }];

var weather = [], timedescription = ['0 ~ 6 時 ', '6 ~ 18 時 ', '18 時至隔日 6 時 '], today;

getCityWeather('新北市');
function getCityWeather(city) {
    getAllWeather().then(function (data) {
        data = data.find(function (element) { return element.areaName == city; });
        let weatherMsg = '地區 ' + data.areaName + ' 於 ' + today + ' 的天氣概況如下：';
        for (let i = 0; i < 3; i++) {
            weatherMsg += '\n' + timedescription[i] +
                ': \n　降雨機率：' + data.rainfall[i] +
                '\n　氣溫：' + data.minTamperature[i] + ' 至 ' + data.maxTamperature[i] +
                '\n　天氣 ' + data.weatherDescription[i] + '\n　氣溫 ' + data.tamperatureDestription[i];
        }
        console.log(weatherMsg)
    });
}

function getAllWeather() {
    return new Promise(function (resolve) {
        if (today == UTC8Time.getNowTime().split(' ')[0].replace('/', '-').split('-')[1]) { resolve(weather); } else {
            $({
                type: 'GET',
                url: 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=***REMOVED***',
                success: function (data) {
                    data = JSON.parse(data);

                    today = data.records.location[0].weatherElement[0].time[2].startTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/');

                    for (let i = 0; i < data.records.location.length; i++) {
                        weather[weather.length] = {
                            areaName: data.records.location[i].locationName,
                            weatherDescription: [
                                data.records.location[i].weatherElement[0].time[0].parameter.parameterName,
                                data.records.location[i].weatherElement[0].time[1].parameter.parameterName,
                                data.records.location[i].weatherElement[0].time[2].parameter.parameterName
                            ],
                            rainfall: [
                                data.records.location[i].weatherElement[1].time[0].parameter.parameterName + '%',
                                data.records.location[i].weatherElement[1].time[1].parameter.parameterName + '%',
                                data.records.location[i].weatherElement[1].time[2].parameter.parameterName + '%'
                            ],
                            minTamperature: [
                                data.records.location[i].weatherElement[2].time[0].parameter.parameterName + '°C',
                                data.records.location[i].weatherElement[2].time[1].parameter.parameterName + '°C',
                                data.records.location[i].weatherElement[2].time[2].parameter.parameterName + '°C'
                            ],
                            tamperatureDestription: [
                                data.records.location[i].weatherElement[3].time[0].parameter.parameterName,
                                data.records.location[i].weatherElement[3].time[1].parameter.parameterName,
                                data.records.location[i].weatherElement[3].time[2].parameter.parameterName
                            ],
                            maxTamperature: [
                                data.records.location[i].weatherElement[4].time[0].parameter.parameterName + '°C',
                                data.records.location[i].weatherElement[4].time[1].parameter.parameterName + '°C',
                                data.records.location[i].weatherElement[4].time[2].parameter.parameterName + '°C'
                            ],
                        }
                    }
                    resolve(weather);
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
}

// function getCityHelper() {
//     $({
//         type: 'GET',
//         url: 'http://opendata.cwb.gov.tw/opendataapi?dataid=' + helper[].id + '&authorizationkey=***REMOVED***',
//         success: function (data) {
//             parseString(data, function (err, result) {
//                 console.log(result.cwbopendata.dataset[0].parameterSet[0].parameter);
//             });
//         },
//         error: function (jqXHR, textStatus, errorThrown) {
//             console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
//             console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
//             console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
//         }
//     });
// }