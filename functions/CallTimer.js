// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

// Require config
const Config = require('../config/config');
const LineBotClient = new LineBotSDK.Client(Config);

const DBref = require('./Variables').DBref;
const GetRandomNumber = require('./GetRandomNumber'); //ok.include: start(function)
const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const ConnectDB = require('./ConnectDB');

var clocktext = [' 點了，各位ㄈㄓ們。', ' 點了，是不是該互動一下？', ' 點了，來星爆一下吧。', ' 點了，大哥哥們，一起玩嗎？', ' 點了。蘿莉才是王道，懂？', ' 點了。乳不平，何以天下平？',
    ' 點了。一失足成千古恨，再回頭已變態身。'];
var pic_src = ['8GBnaP7', '5ooBJG8', 'KqoGm7g', 'BCRSPtv', '5dzYGZw', 'wpQycL0', 'bah9cBp', 'L2xBSQ8', 'dkHWMU4', '683S24K', 'p5wouFN', '2uDRWYu'];

module.exports = {
    clocktext: clocktext,
    calltimer: function calltimer() {
        ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
            UTC8Time.getNowTimePromise().then(function (time) {
                setTimeout(function () {
                    let this_pic_src, clock, clocksort = GetRandomNumber.start(0, clocktext.length - 1);
                    for (let i = 0; i < 24; i++) {
                        let i2;
                        if (i < 10) { i2 = '0' + i; } else { i2 = i; }
                        if (time.time_hr == i2 && i < 11) {
                            clock = i + 1;
                            this_pic_src = 'https://i.imgur.com/' + pic_src[clock] + '.jpg';
                            break;
                        } else if (time.time_hr == i2 && i > 10) {
                            clock = i + 1;
                            if (clock == 24) { clock = 0; }
                            this_pic_src = 'https://i.imgur.com/' + pic_src[clock - 12] + '.jpg';
                            break;
                        }
                    }
                    console.log(clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')');
                    for (let i = 0; i < ontime_timer_list.length; i++) {
                        LineBotClient.pushMessage(ontime_timer_list[i], MsgFormat.Text(clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')'));
                        LineBotClient.pushMessage(ontime_timer_list[i], MsgFormat.Image(this_pic_src, this_pic_src));
                    }

                    calltimer();
                }, (((60 - time.time_min) * 60) - time.time_sec) * 1000 - time.time_ms + 5000);
            });
        });
    },

    calltimertest: function (TargetId) {
        ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
            UTC8Time.getNowTimePromise().then(function (time) {
                let this_pic_src, clock, clocksort = GetRandomNumber.start(0, clocktext.length - 1);
                for (let i = 0; i < 24; i++) {
                    let i2;
                    if (i < 10) { i2 = '0' + i; } else { i2 = i; }
                    if (time.time_hr == i2 && i < 12) {
                        clock = i;
                        this_pic_src = 'https://i.imgur.com/' + pic_src[clock] + '.jpg';
                    } else if (time.time_hr == i2 && i > 11) {
                        clock = i;
                        this_pic_src = 'https://i.imgur.com/' + pic_src[clock - 12] + '.jpg';
                    }
                }
                let Msg = [MsgFormat.Text('（測試訊息）\n' + clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')\n'), MsgFormat.Image(this_pic_src, this_pic_src)];
                if (TargetId) {
                    LineBotClient.pushMessage(TargetId, Msg);
                } else {
                    for (let i = 0; i < ontime_timer_list.length; i++) {
                        console.log(ontime_timer_list[i] + '（測試訊息）\n' + clock + clocktext[clocksort] + '\n(' + UTC8Time.getNowTime() + ')\n' + this_pic_src);
                        LineBotClient.pushMessage(ontime_timer_list[i], Msg);
                    }
                }
            });
        });
    }
}