// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');
const fs = require('fs');

// Require config
const Config = require('../config/config');
const LineBotClient = new LineBotSDK.Client(Config);

// ================================================== My Functions Start ================================================== 

const DBref = require('./Variables').DBref; //ok

const UTC8Time = require('./UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const GetRandomNumber = require('./GetRandomNumber'); //ok.include: start(function)
const UploadPicToImgurByURL = require('./UploadPicToImgurByURL'); //ok.include: start(function)
const ConnectDB = require('./ConnectDB'); //ok

var db_GroupChatlog, db_Ids;
start();
async function start() {
    [db_GroupChatlog, db_Ids] = await Promise.all([
        sqlite.open('../database/GroupChatlog.sqlite', { Promise }),
        sqlite.open('../database/Ids.sqlite', { Promise })
    ]);
}

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
                    db_Ids.all('SELECT id FROM userIds').then(function (data) {
                        if (data.findIndex(function (element) { return element.id == event.source.userId; }) == -1) {
                            db_Ids.run('INSERT INTO userIds VALUES (' + event.source.userId + ' ' + SourceData.Profile.displayName + ')');
                        }
                    });
                    break;
                case 'group': case 'room':
                    db_Ids.all('SELECT * FROM sqlite_master').then(function (data) {
                        if (data.findIndex(function (element) { return element.name == SourceData.id; }) > -1) {
                            db_Ids.run('INSERT INTO ' + SourceData.id + ' VALUES (' + event.source.userId + ' ' + SourceData.Profile.displayName + ')');
                        } else {
                            db_Ids.run('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT)');
                            db_Ids.run('INSERT INTO ' + SourceData.id + ' VALUES (' + event.source.userId + ' ' + SourceData.Profile.displayName + ')');
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
                SaveData = '[位置] id: ' + event.message.id +
                    ', title: ' + event.message.title +
                    ', Address: ' + event.message.address +
                    ', latitude: ' + event.message.latitude +
                    ', longitude: ' + event.message.longitude;
                break;
            case 'sticker':
                SaveData = '[貼圖] id: ' + event.message.id +
                    ', packageId: ' + event.message.packageId +
                    ', stickerId: ' + event.message.stickerId;
                break;
        }

        function SaveFile(extension) {
            LineBotClient.getMessageContent(event.message.id).then(function (res) {
                if (!extension) { extension = res.headers['content-type'].split('/')[1] }
                var file = fs.createWriteStream('../ChatlogFiles/' + event.timestamp + '.' + extension);
                res.on('data', function (chunk) {
                    file.write(chunk);
                });
                res.on('end', function () {
                    file.end();
                    console.log(event.message.id + '.' + event.timestamp + '.' + extension + ' Saved.');
                });
            });
        }

        db_GroupChatlog.all('SELECT * FROM sqlite_master').then(function (data) {
            if (data.findIndex(function (element) { return element.name == SourceData.id; }) > -1) {
                db_GroupChatlog.run('INSERT INTO ' + SourceData.id + ' VALUES (' + SourceData.userId + ' ' + SourceData.Profile.displayName + ' ' + event.message.type + ' ' + event.timestamp + ' ' + SaveData + ')');
            } else {
                db_GroupChatlog.run('CREATE TABLE ' + SourceData.id + ' (id TEXT, displayName TEXT, messageType TEXT, timestamp INTEGER, message TEXT)');
                db_GroupChatlog.run('INSERT INTO ' + SourceData.id + ' VALUES (' + SourceData.userId + ' ' + SourceData.Profile.displayName + ' ' + event.message.type + ' ' + event.timestamp + ' ' + SaveData + ')');
            }
        });
    },
    deleteOutdatedFiles: function (specific_timestamp) {
        if (!specific_timestamp) { specific_timestamp = UTC8Time.getNowTimestamp - 604800000 - 604800000 - 604800000 - 604800000; }
        fs.readdir('../ChatlogFiles', function (err, files) {
            for (let i = 0; i < files.length; i++) {
                if (Number(files[i].split('.')[0]) < specific_timestamp) {
                    fs.unlink('../ChatlogFiles/' + files[i]);
                }
            }
        });
    },
    searchHistory: function (count, startTime, overTime) {
        if (!count) { count = 10; } else if (count > 100) { count = 100; } else if (count < 1) { count = 1; }
        if (startTime && overTime) {
            db_GroupChatlog.all('SELECT * FROM ' + SourceData.id + ' WHERE timestamp BETWEEN ' + startTime + ' AND ' + overTime + ' ORDER BY timestamp DESC LIMIT ' + count).then(function (data) {
                if (data.length != 0) {
                    let replyMsg = data[0].displayName + ': ' + data[i].message;
                    for (let i = 1; i < data.length; i++) {
                        let time = new Date(data[i].timestamp);
                        replyMsg += '\n' + time.getHours() + ':' + time.getMinutes() + ' ' + data[i].displayName + '-> ' + data[i].message;
                    }
                    return replyMsg;
                } else {
                    return '沒有任何紀錄。';
                }
            });
        } else {
            db_GroupChatlog.all('SELECT * FROM ' + SourceData.id + ' ORDER BY timestamp DESC LIMIT ' + count).then(function (data) {
                if (data.length != 0) {
                    let replyMsg = data[0].displayName + ': ' + data[i].message;
                    for (let i = 1; i < data.length; i++) {
                        let time = new Date(data[i].timestamp);
                        replyMsg += '\n' + time.getHours() + ':' + time.getMinutes() + ' ' + data[i].displayName + '-> ' + data[i].message;
                    }
                    return replyMsg;
                } else {
                    return '沒有任何紀錄。';
                }
            });
        }
    }
}