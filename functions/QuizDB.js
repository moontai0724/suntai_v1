const najax = $ = require('najax');
var quizdbget = false, data_quiz = [];
module.exports = {
    value: function () {
        return data_quiz;
    },
    renew: function () {
        return new Promise(resolve => {
            quizdbget = false;
            data_quiz = [];
            this.get().then(data => resolve(data));
        });
    },
    get: function () {
        return new Promise(function (resolve) {
            if (quizdbget == true) resolve(data_quiz); else {
                for (let x = 2; x < 10; x++) {
                    $.get('https://spreadsheets.google.com/feeds/list/1bV8nZP0Iahgp1GoqTT7qNlgvQYPWmg2yT5Wcsta6lbo/' + x + '/public/values?alt=json', function (data) {
                        data = JSON.parse(data);
                        let nowlength = data_quiz.length;
                        for (let y = 0; y < data.feed.entry.length; y++) {
                            data_quiz[y + nowlength] = {
                                "sn": data.feed.entry[y].gsx$quizsn.$t,
                                "question": data.feed.entry[y].gsx$quizquestion.$t,
                                "option_1": data.feed.entry[y].gsx$quizoption1.$t,
                                "option_2": data.feed.entry[y].gsx$quizoption2.$t,
                                "option_3": data.feed.entry[y].gsx$quizoption3.$t,
                                "option_4": data.feed.entry[y].gsx$quizoption4.$t,
                                "answer": data.feed.entry[y].gsx$quizanswer.$t,
                                "bsn": data.feed.entry[y].gsx$boardsn.$t
                            };
                            if (x == 9 && y == data.feed.entry.length - 1) {
                                quizdbget = true;
                                resolve(data_quiz);
                            }
                        }
                    });
                }
            }
        });
    },
    searchIndex: function (type, value) {
        return new Promise(function (resolve, reject) {
            switch (type) {
                case 'sn':
                    resolve(data_quiz.findIndex(function (element) {
                        return element.sn == value;
                    }));
                    break;
                case 'bsn':
                    let all = [];
                    data_quiz.forEach(function (element, index) {
                        if (element.bsn == value) {
                            all[all.length] = index;
                        }
                        if (index == data_quiz.length - 1) {
                            resolve(all);
                        }
                    });
                    break;
                default:
                    reject('Error');
                    break;
            }
        });
    },
    searchData: function (type, value) {
        return new Promise(function (resolve, reject) {
            switch (type) {
                case 'sn':
                    resolve(data_quiz.find(function (element) {
                        return element.sn == value;
                    }));
                    break;
                case 'bsn':
                    let all = [];
                    data_quiz.forEach(function (element, index) {
                        if (element.bsn == value) {
                            all[all.length] = element;
                        }
                        if (index == data_quiz.length - 1) {
                            resolve(all);
                        }
                    });
                    break;
                default:
                    reject('Error');
                    break;
            }
        });
    }
};