const GetRandomNumber = require('./GetRandomNumber');
const FortuneStick = require('./FortuneStick.json');
// https://gist.github.com/d94bb0a9f37cfd362453
module.exports = {
    draw: function () {
        let rn = GetRandomNumber.start(0, 99);
        return replyMsg = '籤號：' + FortuneStick[rn].id + '：' + FortuneStick[rn].type +
            '！\n籤詩：' + FortuneStick[rn].poem +
            '\n查看詳細：/st f ' + FortuneStick[rn].id;
    },
    drawOnly: function () {
        let rn = GetRandomNumber.start(0, 99);
        return replyMsg = FortuneStick[rn].id + ': ' + FortuneStick[rn].type;
    },
    seeOriginal: function (StickNumber) {
        let replyMsg = '籤號：' + FortuneStick[StickNumber].id + '：' + FortuneStick[StickNumber].type + '！\n解籤：' + FortuneStick[StickNumber].explain;
        let result = JSON.stringify(FortuneStick[StickNumber].result).replace('{', '').replace('}', '').replace(/\"/g, '').replace(/\:/g, '：').split(',');
        for (let i = 0; i < result.length; i++) {
            replyMsg += '\n' + result[i];
        }
        return replyMsg;
    }
}