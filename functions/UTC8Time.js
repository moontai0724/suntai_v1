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
        this.value.time_ms = time.getUTCMilliseconds();
        this.value.time_sec = time.getUTCSeconds();
        this.value.time_min = time.getUTCMinutes();
        this.value.time_hr = time.getUTCHours() + 8; // 換算為台灣時間 UTC+8
        this.value.time_day = time.getUTCDate();
        this.value.time_month = time.getUTCMonth() + 1; // 獲取到的時間是從0開始，因此+1
        this.value.time_year = time.getUTCFullYear();
        // 調整時間
        if (this.value.time_hr > 23) {
            this.value.time_hr = this.value.time_hr - 24;
            this.value.time_day = this.value.time_day + 1;
            switch (this.value.time_month) {
                case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                    if (this.value.time_day > 31) {
                        this.value.time_day = this.value.time_day - 31;
                        this.value.time_month = this.value.time_month + 1;
                    }
                    break;
                default:
                    if (this.value.time_day > 30) {
                        this.value.time_day = this.value.time_day - 30;
                        this.value.time_month = this.value.time_month + 1;
                    }
                    break;
            }
            if (this.value.time_month > 12) {
                this.value.time_month = this.value.time_month - 12;
                this.value.time_year = this.value.time_year + 1;
            }
        }
        // 時間格式化
        if (this.value.time_ms < 10) { this.value.time_ms = '00' + this.value.time_ms; }
        else if (this.value.time_ms < 100) { this.value.time_ms = '0' + this.value.time_ms; }
        if (this.value.time_sec < 10) { this.value.time_sec = '0' + this.value.time_sec; }
        if (this.value.time_min < 10) { this.value.time_min = '0' + this.value.time_min; }
        if (this.value.time_hr < 10) { this.value.time_hr = '0' + this.value.time_hr; }
        if (this.value.time_day < 10) { this.value.time_day = '0' + this.value.time_day; }
        if (this.value.time_month < 10) { this.value.time_month = '0' + this.value.time_month; }
        return this.value.time_year + '/' + this.value.time_month + '/' + this.value.time_day + ' ' + this.value.time_hr + ':' + this.value.time_min + ':' + this.value.time_sec + ':' + this.value.time_ms;
    },
    getNowTimePromise: function (tms) {
        return new Promise(function (resolve) {
            this.getNowTime(tms);
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