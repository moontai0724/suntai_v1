// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk')

// Require config
const Config = require('../config/config');
const LineBotClient = new LineBotSDK.Client(Config);

const DBref = require('./Variables').DBref;
const GetRandomNumber = require('./GetRandomNumber'); //ok.include: start(function)
const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const ConnectDB = require('./ConnectDB');

module.exports = {
    calltimer: function (settime) {
        setTimeout(function () {
            ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
                let original_pic, clocksort = GetRandomNumber.start(0, clocktext.length - 1);
                for (i = 0; i < 24; i++) {
                    let i2;
                    if (i < 10) { i2 = '0' + i; } else { i2 = i; }
                    if (clock == i2 && i < 11) {
                        clock = i + 1;
                        original_pic = "https://i.imgur.com/" + original_pic_src[clock] + ".jpg";
                        break;
                    } else if (clock == i2 && i > 10) {
                        clock = i + 1;
                        if (clock == 24) { clock = 0; }
                        original_pic = "https://i.imgur.com/" + original_pic_src[clock - 12] + ".jpg";
                        break;
                    }
                }
                console.log(clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')');
                for (let i = 0; i < ontime_timer_list.length; i++) {
                    LineBotClient.pushMessage(ontime_timer_list[i], MsgFormat.Text(clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')'));
                    LineBotClient.pushMessage(ontime_timer_list[i], MsgFormat.Image(original_pic, original_pic));
                }

                UTC8Time.getNowTimePromise().then(function (time) {
                    this.calltimer((((60 - time.time_min) * 60) - time.time_sec) * 1000 - time.time_ms);
                });
            });
        }, settime);
    },

    calltimertest: function () {
        ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
            let original_pic, clocksort = GetRandomNumber.start(0, clocktext.length - 1);
            for (i = 0; i < 24; i++) {
                let i2;
                if (i < 10) { i2 = '0' + i; } else { i2 = i; }
                if (clock == i2 && i < 12) {
                    clock = i;
                    original_pic = "https://i.imgur.com/" + original_pic_src[clock] + ".jpg";
                    break;
                } else if (clock == i2 && i > 11) {
                    clock = i;
                    original_pic = "https://i.imgur.com/" + original_pic_src[clock - 12] + ".jpg";
                    break;
                }
            }
            for (let i = 0; i < ontime_timer_list.length; i++) {
                console.log(ontime_timer_list[i] + '（測試訊息）\n' + clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')\n' + original_pic);
                LineBotClient.pushMessage(ontime_timer_list[i], '（測試訊息）\n' + clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')\n');
                LineBotClient.pushMessage(ontime_timer_list[i], MsgFormat.Image(original_pic, original_pic));
            }
        });
    }
}