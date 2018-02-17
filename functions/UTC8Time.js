var time_ms, time_sec, time_min, time_hr, time_day, time_month, time_year;
module.exports = {
    value: {
        time_ms, time_sec, time_min, time_hr, time_day, time_month, time_year
    },
    getNowTime: function (tms) {
        if (tms) {
            var time = new Date(tms);
        } else {
            var time = new Date();
        }
        time_ms = time.getUTCMilliseconds();
        time_sec = time.getUTCSeconds();
        time_min = time.getUTCMinutes();
        time_hr = time.getUTCHours() + 8; // 換算為台灣時間 UTC+8
        time_day = time.getUTCDate();
        time_month = time.getUTCMonth() + 1; // 獲取到的時間是從0開始，因此+1
        time_year = time.getUTCFullYear();
        // 調整時間
        if (time_hr > 23) {
            time_hr = time_hr - 24;
            time_day = time_day + 1;
            switch (time_month) {
                case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                    if (time_day > 31) {
                        time_day = time_day - 31;
                        time_month = time_month + 1;
                    }
                    break;
                default:
                    if (time_day > 30) {
                        time_day = time_day - 30;
                        time_month = time_month + 1;
                    }
                    break;
            }
            if (time_month > 12) {
                time_month = time_month - 12;
                time_year = time_year + 1;
            }
        }
        // 時間格式化
        if (time_ms < 10) { time_ms = '00' + time_ms; }
        else if (time_ms < 100) { time_ms = '0' + time_ms; }
        if (time_sec < 10) { time_sec = '0' + time_sec; }
        if (time_min < 10) { time_min = '0' + time_min; }
        if (time_hr < 10) { time_hr = '0' + time_hr; }
        if (time_day < 10) { time_day = '0' + time_day; }
        if (time_month < 10) { time_month = '0' + time_month; }
        return time_year + '/' + time_month + '/' + time_day + ' ' + time_hr + ':' + time_min + ':' + time_sec + ':' + time_ms;
    },
    getNowTimePromise: function (tms) {
        return new Promise(function (resolve) {
            if (tms) {
                var time = new Date(tms);
            } else {
                var time = new Date();
            }
            time_ms = time.getUTCMilliseconds();
            time_sec = time.getUTCSeconds();
            time_min = time.getUTCMinutes();
            time_hr = time.getUTCHours() + 8; // 換算為台灣時間 UTC+8
            time_day = time.getUTCDate();
            time_month = time.getUTCMonth() + 1; // 獲取到的時間是從0開始，因此+1
            time_year = time.getUTCFullYear();
            // 調整時間
            if (time_hr > 23) {
                time_hr = time_hr - 24;
                time_day = time_day + 1;
                switch (time_month) {
                    case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                        if (time_day > 31) {
                            time_day = time_day - 31;
                            time_month = time_month + 1;
                        }
                        break;
                    default:
                        if (time_day > 30) {
                            time_day = time_day - 30;
                            time_month = time_month + 1;
                        }
                        break;
                }
                if (time_month > 12) {
                    time_month = time_month - 12;
                    time_year = time_year + 1;
                }
            }
            // 時間格式化
            if (time_ms < 10) { time_ms = '00' + time_ms; }
            else if (time_ms < 100) { time_ms = '0' + time_ms; }
            if (time_sec < 10) { time_sec = '0' + time_sec; }
            if (time_min < 10) { time_min = '0' + time_min; }
            if (time_hr < 10) { time_hr = '0' + time_hr; }
            if (time_day < 10) { time_day = '0' + time_day; }
            if (time_month < 10) { time_month = '0' + time_month; }
            resolve({
                "time_year": time_year,
                "time_month": time_month,
                "time_day": time_day,
                "time_hr": time_hr,
                "time_min": time_min,
                "time_sec": time_sec,
                "time_ms": time_ms
            });
        });
    }
};