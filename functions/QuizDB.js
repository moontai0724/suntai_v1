const najax = $ = require('najax');
var quizdbget = false, data_quiz = [];
module.exports = {
    value: function () {
        return data_quiz;
    },
    renew: function () {
        return new Promise(function (resolve) {
            quizdbget = false;
            this.get().then(function (data) { resolve(data); });
        });
    },
    get: function () {
        return new Promise(function (resolve) {
            if (quizdbget == true) { resolve(false); } else {
                data_quiz = [];
                $.get('https://spreadsheets.google.com/feeds/list/1bV8nZP0Iahgp1GoqTT7qNlgvQYPWmg2yT5Wcsta6lbo/2/public/values?alt=json', function (data) {
                    data = JSON.parse(data);
                    for (var i = 0; i < data.feed.entry.length; i++) {
                        data_quiz[i] = {
                            "sn": data.feed.entry[i].gsx$quizsn.$t,
                            "question": data.feed.entry[i].gsx$quizquestion.$t,
                            "option_1": data.feed.entry[i].gsx$quizoption1.$t,
                            "option_2": data.feed.entry[i].gsx$quizoption2.$t,
                            "option_3": data.feed.entry[i].gsx$quizoption3.$t,
                            "option_4": data.feed.entry[i].gsx$quizoption4.$t,
                            "answer": data.feed.entry[i].gsx$quizanswer.$t,
                            "bsn": data.feed.entry[i].gsx$boardsn.$t
                        };
                        if (i == data.feed.entry.length - 1) {
                            quizdbget = true;
                            resolve(data_quiz);
                        }
                    }
                });
            }
        });
    },
    searchIndex: function (type, value) {
        switch (type) {
            case 'sn':
                return data_quiz.findIndex(function (element) {
                    return element.sn == value;
                })
                break;
            case 'bsn':
                var all = [];
                data_quiz.forEach(function (element, index) {
                    if (element.bsn == value) {
                        all[all.length] = index;
                    }
                })
                return all;
                break;
            default:
                return 'Error';
                break;
        }
    },
    searchData: function (type, value) {
        switch (type) {
            case 'sn':
                return data_quiz.find(function (element) {
                    return element.sn == value;
                })
                break;
            case 'bsn':
                var all = [];
                data_quiz.forEach(function (element, index) {
                    if (element.bsn == value) {
                        all[all.length] = element;
                    }
                })
                return all;
                break;
            default:
                return 'Error';
                break;
        }
    }
};