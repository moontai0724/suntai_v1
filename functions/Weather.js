// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');
const ping = require('ping-net');

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

// RESTful
// URL Format: https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?locationName={locationName}&elementName={elementName}&sort={sort}&startTime={startTime}&timeFrom={timeFrom}&timeTo={timeTo}
// https://opendata.cwb.gov.tw/api/v1/rest/datastore/{dataid}?Authorization=***REMOVED***
// 今明 36 小時天氣預報： https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=***REMOVED***

// 各鄉鎮預報：
// const WeatherArea = [{ id: 'F-D0047-001', areaName: '宜蘭縣' },
// { id: 'F-D0047-005', areaName: '桃園市' },
// { id: 'F-D0047-009', areaName: '新竹縣' },
// { id: 'F-D0047-013', areaName: '苗栗縣' },
// { id: 'F-D0047-017', areaName: '彰化縣' },
// { id: 'F-D0047-021', areaName: '南投縣' },
// { id: 'F-D0047-025', areaName: '雲林縣' },
// { id: 'F-D0047-029', areaName: '嘉義縣' },
// { id: 'F-D0047-033', areaName: '屏東縣' },
// { id: 'F-D0047-037', areaName: '臺東縣' },
// { id: 'F-D0047-041', areaName: '花蓮縣' },
// { id: 'F-D0047-045', areaName: '澎湖縣' },
// { id: 'F-D0047-049', areaName: '基隆市' },
// { id: 'F-D0047-053', areaName: '新竹市' },
// { id: 'F-D0047-057', areaName: '嘉義市' },
// { id: 'F-D0047-061', areaName: '臺北市' },
// { id: 'F-D0047-065', areaName: '高雄市' },
// { id: 'F-D0047-069', areaName: '新北市' },
// { id: 'F-D0047-073', areaName: '台中市' },
// { id: 'F-D0047-077', areaName: '台南市' },
// { id: 'F-D0047-081', areaName: '連江縣' },
// { id: 'F-D0047-085', areaName: '金門縣' }];

$({
    type: 'GET',
    url: 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=***REMOVED***',
    success: function (data) {
        data = JSON.parse(data);
        let weather = [];
        let today = data.records.location[0].weatherElement[0].time[2].startTime.split(' ')[0].replace('-', '/').replace('-', '/');
        let tomorrow = data.records.location[0].weatherElement[0].time[2].endTime.split(' ')[0].replace('-', '/').replace('-', '/');
        for (let a = 0; a < data.records.location.length; a++) {
            weather[a] = {
                areaName: data.records.location[a].locationName,
                weather: [{
                    time: today + ' 00:00~06:00',
                    parameter: data.records.location[a].weatherElement[0].time[0].parameter.parameterName + '°C'
                }, {
                    time: today + ' 06:00~18:00',
                    parameter: data.records.location[a].weatherElement[0].time[1].parameter.parameterName + '°C'
                }, {
                    time: today + ' 18:00~ ' + tomorrow + ' 06:00',
                    parameter: data.records.location[a].weatherElement[0].time[2].parameter.parameterName + '°C'
                }]
            }
        }
    },
    error: function (jqXHR, textStatus, errorThrown) {
        console.log(UTC8Time.getNowTime(), 'Responsed jqXHR: ', jqXHR);
        console.log(UTC8Time.getNowTime(), 'Responsed textStatus: ', textStatus);
        console.log(UTC8Time.getNowTime(), 'Responsed errorThrown: ', errorThrown);
        reject(jqXHR);
    }
})