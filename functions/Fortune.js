const GetRandomNumber = require('./GetRandomNumber');
const FortuneStick = require('./FortuneStick.json');

module.exports = {
    draw: function () {
        let rn = GetRandomNumber.start(0, 99);
        return replyMsg = '籤號：' + FortuneStick[rn].id + '：' + FortuneStick[rn].type +
            '！\n籤詩內文：' + FortuneStick[rn].poem +
            '\n解籤：' + FortuneStick[rn].explain +
            '\n查看詳細：/st f ' + FortuneStick[rn].id;
    },
    seeOriginal: function (StickNumber) {
        let replyMsg = '籤號：' + FortuneStick[StickNumber].id + '：' + FortuneStick[StickNumber].type + '！\n';
        let result = JSON.stringify(FortuneStick[StickNumber].result).replace('{', '').replace('}', '').replace(/\"/g, '').replace(/\:/g, '：').split(',');
        for (let i = 0; i < result.length; i++) {
            replyMsg += '\n' + result[i];
        }
        return replyMsg;
    }
}