const najax = $ = require('najax');
// ================================================== My Functions Start ==================================================

const Country = require('./Variables').Country;
const AllCity = require('./Variables').AllCity;
const AllCityList = require('./Variables').AllCityList;

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value

// ================================================== My Functions Over ==================================================

// Source: https://data.gov.tw/dataset/40448

var item = ["AQI", "SO2", "CO", "CO_8hr", "O3", "O3_8hr", "PM10", "PM2.5", "NO2", "NOx", "NO", "WindSpeed", "WindDirec", "PM2.5_AVG", "PM10_AVG"];

module.exports = {
    get: async function (county) {
        return new Promise(resolve => {
            $({
                mode: "GET",
                url: "http://opendata2.epa.gov.tw/AQI.json",
                success: function (data) {
                    data = JSON.parse(data);
                    result = {
                        "County": 0,
                        "AQI": 0,
                        "Pollutant": "",
                        "Status": "",
                        "SO2": 0,
                        "CO": 0,
                        "CO_8hr": 0,
                        "O3": 0,
                        "O3_8hr": 0,
                        "PM10": 0,
                        "PM2.5": 0,
                        "NO2": 0,
                        "NOx": 0,
                        "NO": 0,
                        "WindSpeed": 0,
                        "WindDirec": 0,
                        "PM2.5_AVG": 0,
                        "PM10_AVG": 0
                    }
                    data.forEach(element => {
                        if (element.County == county) {
                            result.Status = element.Status;
                            result.County = element.County;
                            for (let i = 0; i < item.length; i++) {
                                if (!isNaN(element[item[i]]))
                                    result[item[i]] = (Number(result[item[i]]) + Number(element[item[i]])) / 2;
                            }
                        }
                    });
                    for (let i = 0; i < item.length; i++) {
                        switch (item[i]) {
                            case 'SO2': case 'CO': case 'CO_8hr': case 'NO2': case 'NOx': case 'NO':
                                result[item[i]] = Math.round(result[item[i]] * 10) / 10;
                                break;
                            default:
                                result[item[i]] = Math.round(result[item[i]]);
                                break;
                        }
                    }
                    reply = '\n空氣品質指標 AQI: ';
                    if (0 <= result.AQI && result.AQI <= 50) reply += '良好 (' + result.AQI + '): 空氣品質為良好，污染程度低或無污染。';
                    else if (51 <= result.AQI && result.AQI <= 100) reply += '普通 (' + result.AQI + '): 空氣品質普通，但對非常少數之極敏感族群產生輕微影響。';
                    else if (101 <= result.AQI && result.AQI <= 150) reply += '對敏感族群不健康 (' + result.AQI + '): 空氣污染物可能會對敏感族群的健康造成影響，但是對一般大眾的影響不明顯。';
                    else if (151 <= result.AQI && result.AQI <= 200) reply += '對所有族群不健康 (' + result.AQI + '): 對所有人的健康開始產生影響，對於敏感族群可能產生較嚴重的健康影響。';
                    else if (201 <= result.AQI && result.AQI <= 300) reply += '非常不健康 (' + result.AQI + '): 健康警報：所有人都可能產生較嚴重的健康影響。';
                    else if (301 <= result.AQI && result.AQI <= 500) reply += '危害 (' + result.AQI + '): 健康威脅達到緊急，所有人都可能受到影響。';
                    reply += '\n細懸浮微粒 PM2.5: ';
                    if (0 <= result['PM2.5'] && result['PM2.5'] <= 11) reply += '1 低 (' + result['PM2.5'] + ')';
                    else if (12 <= result['PM2.5'] && result['PM2.5'] <= 23) reply += '2 低 (' + result['PM2.5'] + ')';
                    else if (24 <= result['PM2.5'] && result['PM2.5'] <= 35) reply += '3 低 (' + result['PM2.5'] + ')';
                    else if (36 <= result['PM2.5'] && result['PM2.5'] <= 41) reply += '4 中 (' + result['PM2.5'] + ')';
                    else if (42 <= result['PM2.5'] && result['PM2.5'] <= 47) reply += '5 中 (' + result['PM2.5'] + ')';
                    else if (48 <= result['PM2.5'] && result['PM2.5'] <= 53) reply += '6 中 (' + result['PM2.5'] + ')';
                    else if (54 <= result['PM2.5'] && result['PM2.5'] <= 58) reply += '7 高 (' + result['PM2.5'] + ')';
                    else if (59 <= result['PM2.5'] && result['PM2.5'] <= 64) reply += '8 高 (' + result['PM2.5'] + ')';
                    else if (65 <= result['PM2.5'] && result['PM2.5'] <= 70) reply += '9 高 (' + result['PM2.5'] + ')';
                    else if (71 <= result['PM2.5']) reply += '10 非常高 (' + result['PM2.5'] + ')';
                    resolve(reply);
                }
            });
        });
    }
}

/*
SiteName(測站名稱)、
County(縣市)、
AQI(空氣品質指標)、
Pollutant(空氣污染指標物)、
Status(狀態)、
SO2(二氧化硫 ppb)、
CO(一氧化碳 ppm)、
O3(臭氧 ppb)、
O3_8hr(臭氧8小時移動平均 ppb)、
PM10(懸浮微粒 μg/m3)、
PM2.5(細懸浮微粒 μg/m3)、
NO2(二氧化氮 ppb)、
NOx(氮氧化物 ppb)、
NO(一氧化氮 ppb)、
WindSpeed(風速 m/sec)、
WindDirec(風向 degrees)、
DataCreationDate(資料建置日期)、
Unit(單位)、
CO_8hr(一氧化碳8小時移動平均 ppm)、
PM2.5_AVG(細懸浮微粒移動平均值 μg/m3)、
PM10_AVG(懸浮微粒移動平均值 μg/m3)、
SO2_AVG(二氧化硫移動平均值 ppb)、
Longitude(經度)、
Latitude(緯度)。
*/