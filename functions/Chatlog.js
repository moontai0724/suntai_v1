// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');
const fs = require('fs');

// Require config
const Config = require('../config/config.json');
const LineBotClient = new LineBotSDK.Client(Config.LineBot);

// ================================================== My Functions Start ================================================== 

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const GetRandomNumber = require('./GetRandomNumber'); //ok.include: start(function)
const UploadPicToImgurByURL = require('./UploadPicToImgurByURL'); //ok.include: start(function)

fs.readdir('./ChatlogFiles', (err, files) => { if (err) fs.mkdir('./ChatlogFiles', () => console.log('Spawned ChatlogFiles dir.')); });
fs.readdir('./database', (err, files) => { if (err) fs.mkdir('./database', () => console.log('Spawned database dir.')); });
var db_GroupChatlog, db_Ids;
setTimeout(async function () {
    [db_GroupChatlog, db_Ids] = await Promise.all([
        sqlite.open('./database/GroupChatlog.sqlite', { Promise }),
        sqlite.open('./database/Ids.sqlite', { Promise })
    ]);
});

// ================================================== My Functions Over ==================================================

module.exports = {
    log: async function (event) {
        var SourceData = {
            userId: 'UNKNOWN',
            id: undefined,
            Profile: {}
        };

        switch (event.source.type) {
            case 'user':
                SourceData.id = event.source.userId;
                break;
            case 'group':
                SourceData.id = event.source.groupId;
                break;
            case 'room':
                SourceData.id = event.source.roomId;
                break;
        }

        if (event.source.userId) {
            SourceData.userId = event.source.userId;
            switch (event.source.type) {
                case 'user':
                    SourceData.Profile = await LineBotClient.getProfile(event.source.userId); // displayName, userId, pictureUrl, statusMessage
                    break;
                case 'group':
                    SourceData.Profile = await LineBotClient.getGroupMemberProfile(event.source.groupId, event.source.userId); // displayName, userId, pictureUrl
                    break;
                case 'room':
                    SourceData.Profile = await LineBotClient.getRoomMemberProfile(event.source.roomId, event.source.userId); // displayName, userId, pictureUrl
                    break;
            }

            switch (event.source.type) {
                case 'user':
                    db_Ids.all('SELECT * FROM sqlite_master').then(lists => {
                        if (lists.findIndex(element => { return element.name == 'userIds'; }) > -1) {
                            db_Ids.all('SELECT id FROM userIds').then(data => {
                                if (data.findIndex(element => { return element.id == event.source.userId; }) == -1) {
                                    console.log('INSERT INTO userIds VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                    db_Ids.run('INSERT INTO userIds VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                }
                            });
                        } else {
                            console.log('CREATE TABLE userIds (id TEXT, displayName TEXT)');
                            db_Ids.run('CREATE TABLE userIds (id TEXT, displayName TEXT)').then(() => {
                                db_Ids.run('PRAGMA auto_vacuum = FULL;');
                                console.log('INSERT INTO userIds VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                db_Ids.run('INSERT INTO userIds VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                            });
                        }
                    });
                    break;
                case 'group': case 'room':
                    db_Ids.all('SELECT * FROM sqlite_master').then(data => {
                        if (data.findIndex(element => { return element.name == SourceData.id; }) > -1) {
                            db_Ids.all('SELECT id FROM ' + SourceData.id).then(lists => {
                                if (lists.findIndex(element => { return element.id == event.source.userId; }) == -1) {
                                    console.log('INSERT INTO ' + SourceData.id + ' VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                    db_Ids.run('INSERT INTO ' + SourceData.id + ' VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                }
                            });
                        } else {
                            console.log('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT)');
                            db_Ids.run('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT)').then(() => {
                                console.log('INSERT INTO ' + SourceData.id + ' VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                                db_Ids.run('INSERT INTO ' + SourceData.id + ' VALUES ("' + event.source.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '")');
                            });
                        }
                    });
                    break;
            }
        }

        var SaveData;
        switch (event.message.type) {
            case 'text':
                SaveData = event.message.text;
                break;
            case 'image':
                SaveData = '[圖片] id: ' + event.message.id;
                SaveFile();
                break;
            case 'video':
                SaveData = '[影片] id: ' + event.message.id;
                SaveFile();
                break;
            case 'audio':
                SaveData = '[音訊] id: ' + event.message.id;
                SaveFile('m4a');
                break;
            case 'file':
                SaveData = '[檔案] FileName: ' + event.message.fileName + ', id: ' + event.message.id;
                SaveFile();
                break;
            case 'location':
                SaveData = '[位置]' +
                    ' title: ' + event.message.title +
                    ', Address: ' + event.message.address +
                    ', latitude: ' + event.message.latitude +
                    ', longitude: ' + event.message.longitude;
                break;
            case 'sticker':
                SaveData = '[貼圖]' +
                    ' packageId: ' + event.message.packageId +
                    ', stickerId: ' + event.message.stickerId;
                break;
        }

        function SaveFile(extension) {
            LineBotClient.getMessageContent(event.message.id).then(res => {
                if (!extension) { extension = res.headers['content-type'].split('/')[1] }
                var file = fs.createWriteStream('./ChatlogFiles/' + event.timestamp + '.' + extension);
                res.on('data', chunk => file.write(chunk));
                res.on('end', () => {
                    file.end();
                    console.log(event.message.id + ', ' + event.timestamp + '.' + extension + ' Saved.');
                });
            });
        }

        db_GroupChatlog.all('SELECT * FROM sqlite_master').then(data => {
            if (data.findIndex(element => { return element.name == SourceData.id; }) > -1) {
                console.log('INSERT INTO ' + SourceData.id + ' VALUES ("' + SourceData.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '", "' + event.message.type + '", ' + event.timestamp + ', "' + SaveData + '")');
                db_GroupChatlog.run('INSERT INTO ' + SourceData.id + ' VALUES ("' + SourceData.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '", "' + event.message.type + '", ' + event.timestamp + ', "' + encodeURIComponent(SaveData) + '")');
            } else {
                console.log('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT, messageType TEXT, timestamp INTEGER, message TEXT)');
                db_GroupChatlog.run('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT, messageType TEXT, timestamp INTEGER, message TEXT)').then(() => {
                    db_GroupChatlog.run('PRAGMA auto_vacuum = FULL;');
                    console.log('INSERT INTO ' + SourceData.id + ' VALUES ("' + SourceData.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '", "' + event.message.type + '", ' + event.timestamp + ', "' + SaveData + '")');
                    db_GroupChatlog.run('INSERT INTO ' + SourceData.id + ' VALUES ("' + SourceData.userId + '", "' + encodeURIComponent(SourceData.Profile.displayName) + '", "' + event.message.type + '", ' + event.timestamp + ', "' + encodeURIComponent(SaveData) + '")');
                });
            }
        });
    },
    deleteOutdatedFiles: function (specific_timestamp) {
        if (!specific_timestamp) { specific_timestamp = UTC8Time.getNowTimestamp - 604800000 - 604800000 - 604800000 - 604800000; }
        fs.readdir('./ChatlogFiles', (err, files) => {
            for (let i = 0; i < files.length; i++) {
                if (Number(files[i].split('.')[0]) < specific_timestamp) fs.unlink('./ChatlogFiles/' + files[i]);
            }
        });
    },
    searchHistory: function (SourceData, count, settings, changelog) {
        return new Promise(resolve => {
            if (count > 50) count = 50; else if (count < 1) count = 1;
            if (settings.StartMonth > 12) settings.StartMonth = 12; else if (settings.StartMonth < 1) settings.StartMonth = 1;
            if (settings.StartDay > 31) settings.StartDay = 30; else if (settings.StartDay < 0) settings.StartDay = 0;
            if (settings.StartHour > 24) settings.StartHour = 24; else if (settings.StartHour < 0) settings.StartHour = 0;
            if (settings.StartMinute > 60) settings.StartMinute = 60; else if (settings.StartMinute < 0) settings.StartMinute = 0;
            if (settings.StartSecond > 60) settings.StartSecond = 60; else if (settings.StartSecond < 0) settings.StartSecond = 0;
            if (changelog.start == true || changelog.over == true) {
                let startDate = new Date(settings.StartYear, settings.StartMonth - 1, settings.StartDay, settings.StartHour, settings.StartMinute, settings.StartSecond);
                let overDate = new Date(settings.OverYear, settings.OverMonth - 1, settings.OverDay, settings.OverHour, settings.OverMinute, settings.OverSecond);
                let startTime = startDate.getTime();
                let overTime = overDate.getTime();
                db_GroupChatlog.all('SELECT * FROM ' + SourceData.id + ' WHERE timestamp BETWEEN ' + startTime + ' AND ' + overTime + ' ORDER BY timestamp DESC LIMIT ' + count).then(data => {
                    if (data.length != 0) {
                        let replyMsg = '';
                        UTC8Time.getNowTimePromise(data[0].timestamp).then(time => replyMsg = time.time_year + '/' + time.time_month + '/' + time.time_day + ' ' + time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[0].displayName) + '-> ' + decodeURIComponent(data[0].message));
                        for (let i = 1; i < data.length; i++) {
                            UTC8Time.getNowTimePromise(data[i].timestamp).then(time => {
                                replyMsg = time.time_year + '/' + time.time_month + '/' + time.time_day + ' ' + time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[i].displayName) + '-> ' + decodeURIComponent(data[i].message) + '\n' + replyMsg;
                                if (i == data.length - 1) resolve(replyMsg);
                            });
                        }
                    } else resolve('沒有任何紀錄。');
                });
            } else if (changelog.specific == true) {
                let overDate = new Date();
                let overTime = overDate.getTime();
                let SpecificTime = settings.Year * 1000 * 60 * 60 * 24 * 265 + settings.Month * 1000 * 60 * 60 * 24 * 30 + settings.Day * 1000 * 60 * 60 * 24 + settings.Hour * 1000 * 60 * 60 + settings.Minute * 1000 * 60 + settings.Second * 1000;
                db_GroupChatlog.all('SELECT * FROM ' + SourceData.id + ' WHERE timestamp BETWEEN ' + (overTime - SpecificTime) + ' AND ' + overTime + ' ORDER BY timestamp DESC LIMIT ' + count).then(data => {
                    if (data.length != 0) {
                        let replyMsg = '';
                        UTC8Time.getNowTimePromise(data[0].timestamp).then(time => {
                            replyMsg = time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[0].displayName) + '-> ' + decodeURIComponent(data[0].message);
                        });
                        for (let i = 1; i < data.length; i++) {
                            UTC8Time.getNowTimePromise(data[i].timestamp).then(time => {
                                replyMsg = time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[i].displayName) + '-> ' + decodeURIComponent(data[i].message) + '\n' + replyMsg;
                                if (i == data.length - 1) resolve(replyMsg);
                            });
                        }
                    } else resolve('沒有任何紀錄。');
                });
            } else {
                db_GroupChatlog.all('SELECT * FROM ' + SourceData.id + ' ORDER BY timestamp DESC LIMIT ' + count).then(data => {
                    if (data.length != 0) {
                        let replyMsg = '';
                        UTC8Time.getNowTimePromise(data[0].timestamp).then(time => {
                            replyMsg = time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[0].displayName) + '-> ' + decodeURIComponent(data[0].message);
                        });
                        for (let i = 1; i < data.length; i++) {
                            UTC8Time.getNowTimePromise(data[i].timestamp).then(time => {
                                replyMsg = time.time_hr + ':' + time.time_min + ' ' + decodeURIComponent(data[i].displayName) + '-> ' + decodeURIComponent(data[i].message) + '\n' + replyMsg;
                                if (i == data.length - 1) resolve(replyMsg);
                            });
                        }
                    } else resolve('沒有任何紀錄。');
                });
            }
        })
    },
    searchHistoryWithKeyWords: function () {

    },
    getFile: function (event, SourceData, FileId) {
        let Fileinfo = {
            id: undefined,
            type: undefined,
            ImgContentUrl: undefined,
            VideoContentUrl: undefined,
            AudioContentUrl: undefined,
            FileContentUrl: undefined,
            Filename: undefined
        };
        db_GroupChatlog.get('SELECT * FROM ' + SourceData.id + ' WHERE message LIKE "%id: ' + FileId + '"').then(data => {
            Fileinfo.type = data.messageType;
            Fileinfo.id = data.timestamp;
            if (data.messageType == 'file') {
                Fileinfo.Filename = data.message.split(',')[0].split('Filename: ')[1];
            }
            switch (Fileinfo.type) {
                case 'image':
                    break;
                case 'video':
                    break;
                case 'audio':
                    break;
                case 'file':
                    break;
            }
        });
    }
}