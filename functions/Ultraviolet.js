const najax = $ = require('najax');
// ================================================== My Functions Start ==================================================

const Country = require('./Variables').Country;
const AllCity = require('./Variables').AllCity;
const AllCityList = require('./Variables').AllCityList;

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value

// ================================================== My Functions Over ==================================================

// Source: https://data.gov.tw/dataset/6076

var lastTime = undefined, result = undefined;

module.exports = {
    get: function (county) {
        return new Promise(resolve => {
            let time = new Date().getDate + new Date().getHours;
            if (lastTime != time) {
                $({
                    mode: "GET",
                    url: "http://opendata2.epa.gov.tw/UV/UV.json",
                    success: function (data) {
                        data = JSON.parse(data);
                        let UVI = 0;
                        data.forEach(element => {
                            if (element.County == county)
                                if (!isNaN(element.UVI))
                                    UVI = (Number(UVI) + Number(element.UVI)) / 2;
                        });
                        UVI = Math.round(UVI);
                    }
                });
            }
            reply = '\n紫外線指數：';
            if (0 <= UVI && UVI <= 2) reply += '􀔃􀇫small green triangle􏿿微量級 (' + UVI + '): 對於一般人無危險';
            else if (3 <= UVI && UVI <= 5) reply += '􂜁􀆑.􏿿低量級 (' + UVI + '): 無保護暴露於陽光中有較輕傷害的風險';
            else if (6 <= UVI && UVI <= 7) reply += '􀔃􀇪small yellow reversed triangle􏿿中量級 (' + UVI + '): 無保護暴露於陽光中有很大傷害的風險';
            else if (8 <= UVI && UVI <= 10) reply += '􂘁􀆑.􏿿過量級 (' + UVI + '): 暴露於陽光中有極高風險';
            else if (11 <= UVI) reply += '􂘁􀆋down􏿿危險級 (' + UVI + '): 暴露於陽光中極其危險';
            resolve(reply);
        });
    }
}

// 測站名稱(SiteName)、紫外線指數(UVI)、發布機關(PublishAgency)、縣市(County)、經度(WGS84)、WGS84Lon、緯度(WGS84)、WGS84Lat、發布時間(PublishTime)