// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk')

// Require Node Module
const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaBodyParser = require('koa-bodyparser');

const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');

// Require config
const Config = require('./config/config');
const app = new Koa();
const router = new KoaRouter();
const LineBotClient = new LineBotSDK.Client(Config);

app.use(KoaBodyParser());

// Webhook
router.post('/', ctx => {
	const req = ctx.request;
	if (LineBotSDK.validateSignature(req.rawBody, Config.channelSecret, req.headers['x-line-signature'])) {
		ctx.status = 200;
		req.body.events.map(MessageHandler);
	}
	else {
		ctx.body = '驗證失敗';
		ctx.status = 401;
	}
})

app.use(router.routes());

// Service Startup
app.listen(process.env.PORT || 8080, function () { console.log('App now running on port: ', this.address().port); });

/* ================================================== My Functions Start ================================================== */

// const DBref = require('./functions/Variables').DBref; //ok

// const UTC8Time = require('./functions/UTC8Time'); //ok.include: getNowTime(function), value
// const MsgFormat = require('./functions/MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
// const QuizDB = require('./functions/QuizDB'); //ok.include: value(function), get(function), searchIndex(function), searchData(function)
// const EarthquakeCheck = require('./functions/EarthquakeCheck'); //ok
// const GetRandomNumber = require('./functions/GetRandomNumber'); //ok.include: start(function)
// const UploadPicToImgurByURL = require('./functions/UploadPicToImgurByURL'); //ok.include: start(function)
// const ConnectDB = require('./functions/ConnectDB'); //ok
// const CallTimer = require('./functions/CallTimer'); //ok

/* ================================================== My Functions Over ================================================== */
/* ================================================== Start My Program ================================================== */

var owners, owners_notice;

// 不會寫入資料庫的變數
var msg_log = [], msg_log_UUID = [], msg_count = [], msg_countime_UUID = [];

// 獲取資料庫中的資料
ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) { owners = data; });
ConnectDB.readDB(DBref.indexOf('owners_notice') + 1).then(function (data) { owners_notice = data; });

// Message handler
async function MessageHandler(event) {
	console.log(event)

	var SourceData = {
		type: undefined,
		userId: undefined,
		id: undefined,
		Profile: {}
	};
	SourceData.type = event.source.type;
	if (event.source.userId) { SourceData.userId = event.source.userId; }

	switch (event.source.type) {
		case 'user':
			SourceData.id = event.source.userId;
			SourceData.Profile = await LineBotClient.getProfile(event.source.userId); // displayName, userId, pictureUrl, statusMessage
			break;
		case 'group':
			SourceData.id = event.source.groupId;
			SourceData.Profile = await LineBotClient.getGroupMemberProfile(event.source.groupId, event.source.userId); // displayName, userId, pictureUrl
			break;
		case 'room':
			SourceData.id = event.source.roomId;
			SourceData.Profile = await LineBotClient.getRoomMemberProfile(event.source.roomId, event.source.userId); // displayName, userId, pictureUrl
			break;
	}

	console.log(SourceData);

	switch (event.message.type) {
		case 'text':
			// if (event.source.text.startsWith('/')) {
			// 	var msgs = event.source.text.replace(/[\n]/g, '').split(' '), authorize = false;
			// 	if (owners.indexOf(SourceData.userId) != -1) { authorize = true; }
			// 	switch (msgs[0]) {
			// 		case '/mt':
			// 			if (authorize == true) {
			// 				switch (msgs[1]) {
			// 					case 'help':
			// 						startReply(MsgFormat.Text('可用指令如下：' +
			// 							'\n*/st get myid' +
			// 							'\n/mt addfriend' +
			// 							'\n/mt calltimertest || ctt [groupId/userId]' +
			// 							'\n/mt get id || i (group/room)' +
			// 							'\n/mt get groupmemberids || gmi' +
			// 							'\n/mt get groupmemberprofile || gmp <userId> [groupId]' +
			// 							'\n/mt get roommemberids || rmi' +
			// 							'\n/mt get roommemberprofile || rmp <userId> [groupId]' +
			// 							'\n/mt get memberprofile || mp <userId>' +
			// 							'\n/mt multi group list' +
			// 							'\n/mt multi group leave <roomId>' +
			// 							'\n/mt multi room list' +
			// 							'\n/mt multi room leave <roomId>' +
			// 							'\n/mt owners add <userId>' +
			// 							'\n/mt owners remove <userId>' +
			// 							'\n/mt owners list' +
			// 							'\n/mt owners notice <userId>' +
			// 							'\n/mt calltimer <groupId/userId>' +
			// 							'\n/mt renewquizdb' +
			// 							'\n/mt send <groupId> <msg>'));
			// 						break;
			// 					case 'addfriend':
			// 						startReply(MsgFormat.Text('http://line.me/ti/p/~@web9850f'));
			// 						break;
			// 					case 'calltimertest': case 'ctt':
			// 						if (msgs[2]) {
			// 							CallTimer.calltimertest(msgs[2]);
			// 						} else {
			// 							CallTimer.calltimertest();
			// 						}
			// 						break;
			// 					case 'get':
			// 						switch (msgs[2]) {
			// 							case 'id': case 'i':
			// 								if (SourceData.id != undefined) {
			// 									startReply(MsgFormat.Text(SourceData.id));
			// 								} else {
			// 									startReply(MsgFormat.Text('請在群組或聊天室中發送此指令。'));
			// 								}
			// 								break;
			// 							case 'groupmemberids': case 'gmi':
			// 								let group_id = undefined;
			// 								if (msgs[3]) {
			// 									group_id = msg[3];
			// 								} else if (!msgs[3] && SourceData.type == 'group') {
			// 									group_id = SourceData.id;
			// 								}

			// 								if (group_id != undefined) {
			// 									LineBotClient.getGroupMemberIds(group_id).then(function (ids) {
			// 										ids.forEach((id) => console.log(id));
			// 										startReply(MsgFormat.Text(ids.memberIds));
			// 									}, function (data) {
			// 										console.log(data);
			// 										startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
			// 								}
			// 								break;
			// 							case 'groupmemberprofile': case 'gmp':
			// 								let userId = undefined, groupId = undefined;

			// 								if (msgs[3] && msgs[4]) {
			// 									userId = msgs[3];
			// 									groupId = msgs[4];
			// 								} else if (msgs[3]) {
			// 									userId = msgs[3];
			// 									groupId = SourceData.id;
			// 								}

			// 								if (userId != undefined && groupId != undefined) {
			// 									LineBotClient.getGroupMemberProfile(groupId, userId).then(function (profile) {
			// 										console.log(profile);
			// 										startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
			// 											'\nuserId: ' + profile.userId +
			// 											'\npictureUrl: ' + profile.pictureUrl));
			// 									}, function (data) {
			// 										console.log(data);
			// 										startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
			// 								}
			// 								break;
			// 							case 'roommemberids': case 'rmi':
			// 								let id = undefined;
			// 								if (msgs[3]) {
			// 									id = msg[3];
			// 								} else if (!msgs[3] && SourceData.type == 'room') {
			// 									id = SourceData.id;
			// 								}

			// 								if (id != undefined) {
			// 									LineBotClient.getRoomMemberIds(id).then(function (ids) {
			// 										ids.forEach((id) => console.log(id));
			// 										startReply(MsgFormat.Text(ids.memberIds));
			// 									}, function (data) {
			// 										console.log(data);
			// 										startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
			// 								}
			// 								break;
			// 							case 'roommemberprofile': case 'rmp':
			// 								let userId = undefined, roomId = undefined;

			// 								if (msgs[3] && msgs[4]) {
			// 									userId = msgs[3];
			// 									roomId = msgs[4];
			// 								} else if (msgs[3]) {
			// 									userId = msgs[3];
			// 									roomId = SourceData.id;
			// 								}

			// 								if (userId != undefined && roomId != undefined) {
			// 									LineBotClient.getRoomMemberProfile(roomId, userId).then(function (profile) {
			// 										console.log(profile);
			// 										startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
			// 											'\nuserId: ' + profile.userId +
			// 											'\npictureUrl: ' + profile.pictureUrl));
			// 									}, function (data) {
			// 										console.log(data);
			// 										startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
			// 								}
			// 								break;
			// 							case 'memberprofile': case 'mp':
			// 								if (msgs[3]) {
			// 									LineBotClient.getProfile(msgs[3]).then(function (profile) {
			// 										console.log(profile);
			// 										startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
			// 											'\nuserId: ' + profile.userId +
			// 											'\npictureUrl: ' + profile.pictureUrl +
			// 											'\nstatusMessage: ' + profile.statusMessage));
			// 									}, function (data) {
			// 										console.log(data);
			// 										startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('參數錯誤。'));
			// 								}
			// 								break;
			// 							default:
			// 								startReply(MsgFormat.Text('參數錯誤。'));
			// 								break;
			// 						}
			// 						break;
			// 					case 'mulit':
			// 						switch (msgs[2]) {
			// 							case 'group':
			// 								switch (msgs[3]) {
			// 									case 'list':
			// 										ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (data) {
			// 											let reply = data[0];
			// 											for (let i = 1; i < data.length; i++) {
			// 												reply = reply + ', ' + data[i];
			// 											}
			// 											startReply(MsgFormat.Text('目前有： ' + reply));
			// 										});
			// 										break;
			// 									case 'leave':
			// 										LineBotClient.leaveGroup(msgs[4]);
			// 										break;
			// 								}
			// 								break;
			// 							case 'room':
			// 								switch (msgs[3]) {
			// 									case 'list':
			// 										ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (data) {
			// 											let reply = data[0];
			// 											for (let i = 1; i < data.length; i++) {
			// 												reply = reply + ', ' + data[i];
			// 											}
			// 											startReply(MsgFormat.Text('目前有： ' + reply));
			// 										});
			// 										break;
			// 									case 'leave':
			// 										LineBotClient.leaveRoom(msgs[4]);
			// 										break;
			// 								}
			// 								break;
			// 							default:
			// 								startReply(MsgFormat.Text('參數錯誤。'));
			// 								break;
			// 						}
			// 						break;
			// 					case 'owners':
			// 						switch (msgs[2]) {
			// 							case 'add':
			// 								if (msgs[3]) {
			// 									ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
			// 										owners = data;
			// 										if (owners.indexOf(msgs[3]) > -1) {
			// 											startReply(MsgFormat.Text('owners 名單中已經有這位使用者。'));
			// 										} else {
			// 											ConnectDB.writeDB('owners', owners.length + 3, owners.length + 3, msgs[3]).then(function () {
			// 												ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
			// 													owners = data;
			// 													let reply = owners[0];
			// 													for (let i = 1; i < owners.length; i++) {
			// 														reply = reply + ', ' + owners[i];
			// 													}
			// 													startReply(MsgFormat.Text('新增完成，目前有： ' + reply));
			// 												});
			// 											});
			// 										}
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('參數錯誤。'));
			// 								}
			// 								break;
			// 							case 'remove':
			// 								if (msg[3]) {
			// 									ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
			// 										owners = data;
			// 										if (owners.indexOf(msg[3]) > -1) {
			// 											owners.splice(owners.indexOf(msg[3]), 1);
			// 											ConnectDB.writeDB('owners', 3, owners.length + 3, owners).then(function () {
			// 												ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
			// 													owners = data;
			// 													let reply = owners[0];
			// 													for (let i = 1; i < owners.length; i++) {
			// 														reply = reply + ', ' + owners[i];
			// 													}
			// 													startReply(MsgFormat.Text('移除完成，目前有： ' + reply));
			// 												});
			// 											});
			// 										} else {
			// 											startReply(MsgFormat.Text('owners 名單中沒有這位使用者。'));
			// 										}
			// 									});
			// 								} else {
			// 									startReply(MsgFormat.Text('參數錯誤。'));
			// 								}
			// 								break;
			// 							case 'list':
			// 								ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
			// 									let reply = owners[0];
			// 									for (let i = 1; i < owners.length; i++) {
			// 										reply = reply + ', ' + owners[i];
			// 									}
			// 									startReply(MsgFormat.Text('目前有： ' + reply));
			// 								});
			// 								break;
			// 							case 'notice':
			// 								let id;
			// 								if (msgs[3]) {
			// 									id = msgs[3];
			// 								} else {
			// 									id = event.source.userId;
			// 								}

			// 								ConnectDB.readDB(DBref.indexOf('owners_notice') + 1).then(function (data) {
			// 									owners_notice = data;
			// 									if (owners_notice.indexOf(id) > -1) {
			// 										owners_notice.splice(owners_notice.indexOf(id), 1);
			// 										ConnectDB.writeDB('owners_notice', 3, owners_notice.length + 3, owners_notice).then(function () {
			// 											ConnectDB.readDB(DBref.indexOf('owners_notice') + 1).then(function (data) {
			// 												owners_notice = data;
			// 												console.log(owners_notice);
			// 												startReply(MsgFormat.Text('已經為 ' + id + ' 關閉管理者通知。'));
			// 												console.log('已經為 ' + id + ' 關閉管理者通知。');
			// 											});
			// 										});
			// 									} else {
			// 										ConnectDB.writeDB('owners_notice', owners_notice.length + 3, owners_notice.length + 3, id).then(function () {
			// 											ConnectDB.readDB(DBref.indexOf('owners_notice') + 1).then(function (data) {
			// 												owners_notice = data;
			// 												console.log(owners_notice);
			// 												startReply(MsgFormat.Text('已經為 ' + id + ' 開啟管理者通知。'));
			// 												console.log('已經為 ' + id + ' 開啟管理者通知。');
			// 											});
			// 										});
			// 									}
			// 								});
			// 								break;
			// 							default:
			// 								startReply(MsgFormat.Text('參數錯誤。'));
			// 								break;
			// 						}
			// 						break;
			// 					case 'calltimer':
			// 						let id;
			// 						if (msg_list[2]) {
			// 							id = msg_list[2];
			// 						} else {
			// 							id = SourceData.id;
			// 						}

			// 						ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 							if (ontime_timer_list.indexOf(id) > -1) {
			// 								ontime_timer_list.splice(ontime_timer_list.indexOf(id), 1);
			// 								ConnectDB.writeDB('ontime_timer', 3, ontime_timer_list.length + 3, ontime_timer_list).then(function () {
			// 									ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 										console.log(ontime_timer_list);
			// 										let reply = ontime_timer_list[0];
			// 										for (let i = 1; i < ontime_timer_list.length; i++) {
			// 											reply = reply + ', ' + ontime_timer_list[i];
			// 										}
			// 										startReply(MsgFormat.Text('群組：' + id + ' 的報時功能已經關閉。\n目前清單： ' + reply));
			// 										console.log('群組：' + id + ' 的報時功能已經關閉。\n目前清單： ' + reply);
			// 									});
			// 								});
			// 							} else {
			// 								ConnectDB.writeDB('ontime_timer', ontime_timer_list.length + 3, ontime_timer_list.length + 3, id).then(function () {
			// 									ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 										console.log(ontime_timer_list);
			// 										let reply = ontime_timer_list[0];
			// 										for (let i = 1; i < ontime_timer_list.length; i++) {
			// 											reply = reply + ', ' + ontime_timer_list[i];
			// 										}
			// 										startReply(MsgFormat.Text('群組：' + id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list));
			// 										console.log('群組：' + id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list);
			// 									});
			// 								});
			// 							}
			// 						});
			// 						break;
			// 					case 'renewquizdb':
			// 						QuizDB.renew().then(function (data) { startReply(MsgFormat.Text('已重新獲取題庫！')); });
			// 						break;
			// 					case 'send':
			// 						if (msg_list[2] && msg_list[3]) {
			// 							LineBotClient.pushMessage(msg_list[2], MsgFormat.Text(msg_list[3]));
			// 							startReply(MsgFormat.Text('傳送完成。'));
			// 						} else {
			// 							startReply(MsgFormat.Text('參數錯誤。'));
			// 						}
			// 						break;
			// 					default:
			// 						startReply(MsgFormat.Text('參數錯誤。'));
			// 						break;
			// 				}
			// 			} else {
			// 				startReply(MsgFormat.Text('您沒有權限。'));
			// 			}
			// 			break;
			// 		case '/st':
			// 			switch (msg[1]) {
			// 				case 'help':
			// 					startReply(MsgFormat.Text('可用指令如下：' +
			// 						'\n/st help' +
			// 						'\n/st time get' +
			// 						'\n/st time getall' +
			// 						'\n/st calltimer' +
			// 						'\n/st earthquakenotification || eqn' +
			// 						'\n/st quiz [bsn]' +
			// 						'\n/st quizans <bsn>' +
			// 						'\n　註：bsn 為巴哈姆特看板編號。' +
			// 						// '\n/st antiunsend || au [SpecificSort]' +
			// 						'\n　註：最多指定 20 筆資料，若無指定預設五筆。'));
			// 					break;
			// 				case 'time':
			// 					switch (msgs[2]) {
			// 						case 'get':
			// 							UTC8Time.getNowTimePromise().then(function (data) {
			// 								startReply(MsgFormat.Text(data.time_hr + CallTimer.clocktext[GetRandomNumber.start(0, CallTimer.clocktext.length - 1)]));
			// 							});
			// 							break;
			// 						case 'getall':
			// 							startReply(MsgFormat.Text(UTC8Time.getNowTime()));
			// 							break;
			// 						default:
			// 							startReply(MsgFormat.Text('參數錯誤。'));
			// 							break;
			// 					}
			// 					break;
			// 				case 'calltimer':
			// 					ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 						if (ontime_timer_list.indexOf(SourceData.id) > -1) {
			// 							ontime_timer_list.splice(ontime_timer_list.indexOf(SourceData.id), 1);
			// 							ConnectDB.writeDB('ontime_timer', 3, ontime_timer_list.length + 3, ontime_timer_list).then(function () {
			// 								ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 									startReply(MsgFormat.Text('報時功能已經關閉。'));
			// 									console.log(SourceData.id + ' 的報時功能已經關閉。');
			// 								});
			// 							});
			// 						} else {
			// 							ConnectDB.writeDB('ontime_timer', ontime_timer_list.length + 3, ontime_timer_list.length + 3, SourceData.id).then(function () {
			// 								ConnectDB.readDB(DBref.indexOf('ontime_timer') + 1).then(function (ontime_timer_list) {
			// 									startReply(MsgFormat.Text('報時功能已經開啟。'));
			// 									console.log(SourceData.id + ' 的報時功能已經開啟。');
			// 								});
			// 							});
			// 						}
			// 					});
			// 					break;
			// 				case 'earthquakenotification': case 'eqn':
			// 					ConnectDB.readDB(DBref.indexOf('earthquake_notification') + 1).then(function (earthquake_notification_list) {
			// 						if (earthquake_notification_list.indexOf(SourceData.id) > -1) {
			// 							earthquake_notification_list.splice(earthquake_notification_list.indexOf(SourceData.id), 1);
			// 							ConnectDB.writeDB('earthquake_notification', 3, earthquake_notification_list.length + 3, earthquake_notification_list).then(function () {
			// 								startReply(MsgFormat.Text('地震通知已經關閉。'));
			// 								console.log(SourceData.id + ' 的地震通知已經關閉。');
			// 							});
			// 						} else {
			// 							ConnectDB.writeDB('earthquake_notification', earthquake_notification_list.length + 3, earthquake_notification_list.length + 3, SourceData.id).then(function () {
			// 								startReply(MsgFormat.Text('地震通知已經開啟。'));
			// 								console.log(SourceData.id + ' 的地震通知已經開啟。');
			// 							});
			// 						}
			// 					});
			// 					break;
			// 				case 'quiz':
			// 					if (msgs[2]) {
			// 						if (msgs[2] > 0 && msgs[2] < 100000) {
			// 							QuizDB.get().then(function () {
			// 								QuizDB.searchData('bsn', msgs[2]).then(function (data) {
			// 									if (data.length != 0) {
			// 										quiz_start();
			// 										let count = 0;
			// 										function quiz_start() {
			// 											let choose = GetRandomNumber.start(0, data.length - 1);
			// 											switch (data[choose].answer) {
			// 												case '1': case '2': case '3': case '4':
			// 													startReply(MsgFormat.Text('題目編號：' + data[choose].sn +
			// 														'\n題目：' + data[choose].question +
			// 														'\n選項：1. ' + data[choose].option_1 +
			// 														'\n2. ' + data[choose].option_2 +
			// 														'\n3. ' + data[choose].option_3 +
			// 														'\n4. ' + data[choose].option_4 +
			// 														'\n\n題目來源討論區：https://forum.gamer.com.tw/A.php?bsn=' + data[choose].bsn +
			// 														'\n獲取答案請打 /st quizans ' + data[choose].sn));
			// 												default:
			// 													count++;
			// 													if (count > data.length) {
			// 														startReply(MsgFormat.Text('資料庫中可能沒有已經有答案的題目＞＜'));
			// 													} else {
			// 														quiz_start();
			// 													}
			// 													break;
			// 											}
			// 										}
			// 									} else {
			// 										startReply(MsgFormat.Text('資料庫中無該看板題庫。'));
			// 									}
			// 								});
			// 							});
			// 						} else {
			// 							startReply(MsgFormat.Text("參數錯誤。"));
			// 						}
			// 					} else {
			// 						QuizDB.get().then(function (data) {
			// 							quiz_start();
			// 							function quiz_start() {
			// 								let choose = getRandomNumber(0, data.length - 1);
			// 								switch (data[choose].answer) {
			// 									case '1': case '2': case '3': case '4':
			// 										startReply(MsgFormat.Text('題目編號：' + data[choose].sn +
			// 											'\n題目：' + data[choose].question +
			// 											'\n選項：1. ' + data[choose].option_1 +
			// 											'\n2. ' + data[choose].option_2 +
			// 											'\n3. ' + data[choose].option_3 +
			// 											'\n4. ' + data[choose].option_4 +
			// 											'\n\n題目來源討論區：https://forum.gamer.com.tw/A.php?bsn=' + data[choose].bsn +
			// 											'\n獲取答案請打 /st quizans ' + data[choose].sn));
			// 									default:
			// 										quiz_start();
			// 										break;
			// 								}
			// 							}
			// 						});
			// 					}
			// 					break;
			// 				case 'quizans':
			// 					if (msgs[2]) {
			// 						if (msgs[2] > 0 && msgs[2] < 100000) {
			// 							QuizDB.searchData('sn', msgs[2]).then(function (data) {
			// 								switch (data.answer) {
			// 									case '1': case '2': case '3': case '4':
			// 										startReply(MsgFormat.Text('題目編號：' + data.sn +
			// 											'\n題目：' + data[choose].question +
			// 											'\n選項：1. ' + data[choose].option_1 +
			// 											'\n2. ' + data[choose].option_2 +
			// 											'\n3. ' + data[choose].option_3 +
			// 											'\n4. ' + data[choose].option_4 +
			// 											'\n答案為：' + data.answer));
			// 										break;
			// 									default:
			// 										startReply(MsgFormat.Text('資料庫中可能沒有這一題＞＜"'));
			// 										break;
			// 								}
			// 							});
			// 						}
			// 					} else {
			// 						startReply(MsgFormat.Text("參數錯誤。"));

			// 					}
			// 					break;
			// 				default:
			// 					startReply(MsgFormat.Text('參數錯誤。'));
			// 					break;
			// 			}
			// 			break;
			// 		default:
			// 			break;
			// 	}
			// } else {
			// 	if (event.source.text == '87') {
			// 		startReply(MsgFormat.Text('你說誰 87，你全家都 87'));
			// 	} else if (msg.indexOf("新年快樂") > -1) {
			// 		startReply(MsgFormat.Text("新年快樂ヾ(*´∀ ˋ*)ﾉ"));
			// 	} else if (msg.indexOf("狗年快樂") > -1) {
			// 		startReply(MsgFormat.Text("狗年快樂ヾ(*´∀ ˋ*)ﾉ 汪"));
			// 	}
			// }
			break;
		case 'image':
			break;
		case 'video':
			break;
		case 'audio':
			break;
		case 'file':
			break;
		case 'location':
			break;
		case 'sticker':
			break;
		case 'follow':
			break;
		case 'unfollow':
			break;
		case 'join':
			// ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
			// 	if (groups.indexOf(event.source.groupId) == -1) {
			// 		ConnectDB.writeDB('groups', groups.length + 3, groups.length + 3, event.source.groupId).then(function () {
			// 			ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
			// 				console.log(groups);
			// 			});
			// 		}, function (error) {
			// 			console.log(error);
			// 		});
			// 	} else {
			// 		console.log('沒有達成條件');
			// 	}
			// });
			// for (let i = 0; i < owners_notice.length; i++) {
			// 	LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太加入了群組: ' + event.source.groupId));
			// }
			break;
		case 'leave':
			// ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
			// 	if (groups.indexOf(event.source.groupId) > -1) {
			// 		groups.splice(groups.indexOf(event.source.groupId), 1);
			// 		ConnectDB.writeDB('groups', 3, groups.length + 3, groups).then(function () {
			// 			ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
			// 				console.log(groups);
			// 			});
			// 		}, function (error) {
			// 			console.log(error);
			// 		});
			// 	} else {
			// 		console.log('沒有達成條件');
			// 	}
			// });
			// for (let i = 0; i < owners_notice.length; i++) {
			// 	LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太離開了群組: ' + event.source.groupId));
			// }
			break;
	}

	// Start Reply Message
	function startReply(replyMsg_1, replyMsg_2, replyMsg_3, replyMsg_4, replyMsg_5) {
		let replyMsg = [];
		replyMsg[0] = replyMsg_1;
		// If more than 1 message then add into replyMsgs, maximum 5 messages. 
		if (replyMsg_2) { replyMsg[1] = replyMsg_2; }
		if (replyMsg_3) { replyMsg[2] = replyMsg_3; }
		if (replyMsg_4) { replyMsg[3] = replyMsg_4; }
		if (replyMsg_5) { replyMsg[4] = replyMsg_5; }
		LineBotClient.replyMessage(event.replyToken, replyMsg).then(function () {
			console.log('Source Msg: ' + event.message.text + ';Replyed: ' + replyMsg);
		}).catch(function (error) {
			console.log(error);
		});
	}
}

/* ================================================== My Program Over ================================================== */
/* ================================================== Start Other Functions ================================================== */

// 開機提醒
setTimeout(function () {
	for (let i = 0; i < owners_notice.length; i++) {
		LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已啟動完成。'));
		console.log('send: ' + owners_notice[i] + ';msg: ' + UTC8Time.getNowTime() + '\n日太已啟動完成。');
	}
}, 3000);

// 報時功能
// UTC8Time.getNowTimePromise().then(function (data) {
// 	CallTimer.calltimer((((60 - data.time_min) * 60) - data.time_sec) * 1000 - data.time_ms);
// });

// 地震報告
// EarthquakeCheck.opendata();