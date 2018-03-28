const najax = $ = require('najax');
const parseString = require('xml2js').parseString;

// Require config
const Config = require('../config/config.json');
// ================================================== My Functions Start ==================================================

const Country = require('./Variables').Country;
const AllCity = require('./Variables').AllCity;
const AllCityList = require('./Variables').AllCityList;

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value

// ================================================== My Functions Over ==================================================

// ID 參考：https://opendata.cwb.gov.tw/datalist
// 檔案下載： http://opendata.cwb.gov.tw/opendataapi?dataid=ID&authorizationkey=KEY
// 檔案下載： http://opendata.cwb.gov.tw/opendataapi?dataid=F-D0047-001&authorizationkey=KEY

// RESTful
// URL Format: https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?locationName={locationName}&elementName={elementName}&sort={sort}&startTime={startTime}&timeFrom={timeFrom}&timeTo={timeTo}
// https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?Authorization=KEY

// 各鄉鎮預報：RESTful https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?Authorization=KEY
const WeatherArea = [{ areaName: '宜蘭縣', id: 'F-D0047-001' }, { areaName: '桃園市', id: 'F-D0047-005' }, { areaName: '新竹縣', id: 'F-D0047-009' }, { areaName: '苗栗縣', id: 'F-D0047-013' }, { areaName: '彰化縣', id: 'F-D0047-017' }, { areaName: '南投縣', id: 'F-D0047-021' }, { areaName: '雲林縣', id: 'F-D0047-025' }, { areaName: '嘉義縣', id: 'F-D0047-029' }, { areaName: '屏東縣', id: 'F-D0047-033' }, { areaName: '臺東縣', id: 'F-D0047-037' }, { areaName: '花蓮縣', id: 'F-D0047-041' }, { areaName: '澎湖縣', id: 'F-D0047-045' }, { areaName: '基隆市', id: 'F-D0047-049' }, { areaName: '新竹市', id: 'F-D0047-053' }, { areaName: '嘉義市', id: 'F-D0047-057' }, { areaName: '臺北市', id: 'F-D0047-061' }, { areaName: '高雄市', id: 'F-D0047-065' }, { areaName: '新北市', id: 'F-D0047-069' }, { areaName: '台中市', id: 'F-D0047-073' }, { areaName: '台南市', id: 'F-D0047-077' }, { areaName: '連江縣', id: 'F-D0047-081' }, { areaName: '金門縣', id: 'F-D0047-085' }];

// 各地區小助手：document http://opendata.cwb.gov.tw/opendataapi?dataid=F-D0047-001&authorizationkey=KEY
const helper = [{ areaName: '台北市', id: 'F-C0032-009' }, { areaName: '新北市', id: 'F-C0032-010' }, { areaName: '基隆市', id: 'F-C0032-011' }, { areaName: '花蓮縣', id: 'F-C0032-012' }, { areaName: '宜蘭縣', id: 'F-C0032-013' }, { areaName: '金門縣', id: 'F-C0032-014' }, { areaName: '澎湖縣', id: 'F-C0032-015' }, { areaName: '台南市', id: 'F-C0032-016' }, { areaName: '高雄市', id: 'F-C0032-017' }, { areaName: '嘉義縣', id: 'F-C0032-018' }, { areaName: '嘉義市', id: 'F-C0032-019' }, { areaName: '苗栗縣', id: 'F-C0032-020' }, { areaName: '台中市', id: 'F-C0032-021' }, { areaName: '桃園市', id: 'F-C0032-022' }, { areaName: '新竹縣', id: 'F-C0032-023' }, { areaName: '新竹市', id: 'F-C0032-024' }, { areaName: '屏東縣', id: 'F-C0032-025' }, { areaName: '南投縣', id: 'F-C0032-026' }, { areaName: '台東縣', id: 'F-C0032-027' }, { areaName: '彰化縣', id: 'F-C0032-028' }, { areaName: '雲林縣', id: 'F-C0032-029' }, { areaName: '連江縣', id: 'F-C0032-030' }];

var weather = [], lastGet = 0;
module.exports = {
    getCityWeather: function (city) {
        return new Promise(resolve => {
            getAllWeather().then(data => {
                let weather = data.find(element => { return element.areaName == city; });
                if (weather) {
                    let reply = '以下是 ' + city + ' 的未來 36 小時天氣概況：';
                    for (let i = 0; i < 3; i++) {
                        reply += '\n' + weather.time[i].startDate + ' ' + weather.time[i].startHour + ' 時至 ' + weather.time[i].endDate + ' ' + weather.time[i].endHour + ' 時' +
                            '\n氣溫：' + weather.minTamperature[i] + ' ~ ' + weather.maxTamperature[i] +
                            '\n降雨機率：' + weather.rainfall[i] +
                            '\n整體天氣狀況：' + weather.weatherDescription[i] + ' ' + weather.tamperatureDestription[i];
                    }
                    resolve(reply);
                } else resolve('發生錯誤。');
            });
        });
    },
    refreshCityWeather: function () {
        return new Promise(resolve => {
            weather = [];
            getAllWeather().then(() => resolve());
        });
    }
}

function getAllWeather() {
    return new Promise(function (resolve, reject) {
        let time = new Date();
        if (weather.length != 0 && (time.getTime() - 21600000) > lastGet) resolve(weather); else $({
            type: 'GET',
            url: 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=' + Config.Weather.AuthorizationKey,
            success: function (data) {
                data = JSON.parse(data);
                weather = [];
                lastGet = time.getTime();
                console.log('\n\ngetData\n\n');
                for (let i = 0; i < data.records.location.length; i++) {
                    weather[weather.length] = {
                        areaName: data.records.location[i].locationName,
                        time: [
                            {
                                startDate: data.records.location[i].weatherElement[0].time[0].startTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                endDate: data.records.location[i].weatherElement[0].time[0].endTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                startHour: data.records.location[i].weatherElement[0].time[0].startTime.split(' ')[1].split(':')[0],
                                endHour: data.records.location[i].weatherElement[0].time[0].endTime.split(' ')[1].split(':')[0]
                            }, {
                                startDate: data.records.location[i].weatherElement[0].time[1].startTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                endDate: data.records.location[i].weatherElement[0].time[1].endTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                startHour: data.records.location[i].weatherElement[0].time[1].startTime.split(' ')[1].split(':')[0],
                                endHour: data.records.location[i].weatherElement[0].time[1].endTime.split(' ')[1].split(':')[0]
                            }, {
                                startDate: data.records.location[i].weatherElement[0].time[2].startTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                endDate: data.records.location[i].weatherElement[0].time[2].endTime.split(' ')[0].replace('-', '/').split('/')[1].replace('-', '/'),
                                startHour: data.records.location[i].weatherElement[0].time[2].startTime.split(' ')[1].split(':')[0],
                                endHour: data.records.location[i].weatherElement[0].time[2].endTime.split(' ')[1].split(':')[0]
                            }
                        ],
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
                    };
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
    });
}

// function getCityHelper() {
//     $({
//         type: 'GET',
//         url: 'http://opendata.cwb.gov.tw/opendataapi?dataid=' + helper[].id + '&authorizationkey=' + Config.Weather.AuthorizationKey
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

/*
    Wx, 天氣圖示代碼 + 描述
    PoP, 降雨機率 (Probability of Precipitation)
    AT, 體感溫度 (Apparent Temperature)
    T, 溫度 (Temperature)
    RH, 相對溼度 (Relative Humidity)
    CI, 舒適度 (Comfort Index)
    WeatherDescription, 一小段總結式的預報
    PoP6h, 未來6小時降雨機率 (Probability of Precipitation in 6 Hour)
    Wind, 風向+蒲福風級
    Td, 露點溫度 (Dew Point Temperature)
*/