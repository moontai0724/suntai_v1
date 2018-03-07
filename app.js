// Require Line Bot SDK
const LineBotSDK = require('@line/bot-sdk');

// Require Node Module
const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaBodyParser = require('koa-bodyparser');

const ngrok = require('ngrok');
const najax = $ = require('najax');
const parseString = require('xml2js').parseString;
const sqlite = require('sqlite');
const ping = require('ping-net');

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
const server = app.listen(8080, function () { console.log('App now running on port: ', this.address().port); });

// ================================================== My Functions Start ================================================== 

const DBref = require('./functions/Variables').DBref; //ok
const Country = require('./functions/Variables').Country;
const AllCity = require('./functions/Variables').AllCity;
const AllCityList = require('./functions/Variables').AllCityList;

const UTC8Time = require('./functions/UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./functions/MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const QuizDB = require('./functions/QuizDB'); //ok.include: value(function), get(function), searchIndex(function), searchData(function)
const EarthquakeCheck = require('./functions/EarthquakeCheck'); //ok
const GetRandomNumber = require('./functions/GetRandomNumber'); //ok.include: start(function)
const UploadPicToImgurByURL = require('./functions/UploadPicToImgurByURL'); //ok.include: start(function)
const ConnectDB = require('./functions/ConnectDB'); //ok
const CallTimer = require('./functions/CallTimer'); //ok

// ================================================== My Functions Over ==================================================
// ================================================== Start My Program ==================================================

var owners, owners_notice, last_commit_time = undefined;

// 獲取資料庫中的資料
ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) { owners = data; });
ConnectDB.readDB(DBref.indexOf('ownersnotice') + 1).then(function (data) { owners_notice = data; });

// Message handler
async function MessageHandler(event) {
	console.log(JSON.stringify(event));

	var SourceData = {
		type: undefined,
		userId: undefined,
		id: undefined,
		Profile: {}
	};

	SourceData.type = event.source.type;
	if (event.source.userId) {
		SourceData.userId = event.source.userId;
		switch (event.source.type) {
			case 'user':
				SourceData.id = event.source.userId;
				SourceData.Profile = LineBotClient.getProfile(event.source.userId); // displayName, userId, pictureUrl, statusMessage
				break;
			case 'group':
				SourceData.id = event.source.groupId;
				SourceData.Profile = LineBotClient.getGroupMemberProfile(event.source.groupId, event.source.userId); // displayName, userId, pictureUrl
				break;
			case 'room':
				SourceData.id = event.source.roomId;
				SourceData.Profile = LineBotClient.getRoomMemberProfile(event.source.roomId, event.source.userId); // displayName, userId, pictureUrl
				break;
		}
	}

	switch (event.type) {
		case 'message':
			switch (event.message.type) {
				case 'text':
					if (event.message.text.startsWith('/')) {
						var msgs = event.message.text.replace(/[\n]/g, '').split(' '), authorize = false;
						if (owners.indexOf(SourceData.userId) != -1) { authorize = true; }
						switch (msgs[0]) {
							case '/mt':
								if (authorize == true) {
									switch (msgs[1]) {
										case 'help':
											startReply(MsgFormat.Text('可用指令如下：' +
												'\n* /st get myid' +
												'\n/mt shutdown [sec]' +
												'\n/mt addfriend' +
												'\n/mt calltimertest || ctt [groupId/userId]' +
												'\n/mt get id || i (group/room)' +
												'\n/mt get groupmemberids || gmi' +
												'\n/mt get groupmemberprofile || gmp <userId> [groupId]' +
												'\n/mt get roommemberids || rmi' +
												'\n/mt get roommemberprofile || rmp <userId> [groupId]' +
												'\n/mt get memberprofile || mp <userId>' +
												'\n/mt multi group list' +
												'\n/mt multi group leave <roomId>' +
												'\n/mt multi room list' +
												'\n/mt multi room leave <roomId>' +
												'\n/mt owners add <userId>' +
												'\n/mt owners remove <userId>' +
												'\n/mt owners list' +
												'\n/mt owners notice <userId>' +
												'\n/mt calltimer <groupId/userId>' +
												'\n/mt renewquizdb' +
												'\n/mt send <groupId> <msg>'));
											break;
										case 'restart':
											if (msgs[2]) {
												setTimeout(function () {
													server.close(function () {
														for (let i = 0; i < owners_notice.length; i++) {
															LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已關機。'));
															console.log('send: ' + owners_notice[i] + ';msg: ' + UTC8Time.getNowTime() + '\n日太已關機。');
														}
														process.exit();
													});
												}, msgs[2] * 1000);
											} else {
												server.close(function () {
													for (let i = 0; i < owners_notice.length; i++) {
														LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已關機。'));
														console.log('send: ' + owners_notice[i] + ';msg: ' + UTC8Time.getNowTime() + '\n日太已關機。');
													}
													process.exit();
												});
											}
											break;
										case 'addfriend':
											startReply(MsgFormat.Text('http://line.me/ti/p/~@web9850f'));
											break;
										case 'calltimertest': case 'ctt':
											if (msgs[2]) {
												CallTimer.calltimertest(msgs[2]);
											} else {
												CallTimer.calltimertest();
											}
											break;
										case 'get':
											switch (msgs[2]) {
												case 'id': case 'i':
													if (SourceData.id != undefined) {
														startReply(MsgFormat.Text(SourceData.id));
													} else {
														startReply(MsgFormat.Text('請在群組或聊天室中發送此指令。'));
													}
													break;
												case 'groupmemberids': case 'gmi':
													var group_id = undefined;
													if (msgs[3]) {
														group_id = msgs[3];
													} else if (!msgs[3] && SourceData.type == 'group') {
														group_id = SourceData.id;
													}

													if (group_id != undefined) {
														LineBotClient.getGroupMemberIds(group_id).then(function (ids) {
															ids.forEach((each_id) => console.log(each_id));
															startReply(MsgFormat.Text(ids.memberIds));
														}, function (data) {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else {
														startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
													}
													break;
												case 'groupmemberprofile': case 'gmp':
													var user_id = undefined, group_id = undefined;

													if (msgs[3] && msgs[4]) {
														user_id = msgs[3];
														group_id = msgs[4];
													} else if (msgs[3]) {
														user_id = msgs[3];
														group_id = SourceData.id;
													}

													if (user_id != undefined && group_id != undefined) {
														LineBotClient.getGroupMemberProfile(group_id, user_id).then(function (profile) {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl));
														}, function (data) {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else {
														startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
													}
													break;
												case 'roommemberids': case 'rmi':
													var room_id = undefined;
													if (msgs[3]) {
														room_id = msgs[3];
													} else if (!msgs[3] && SourceData.type == 'room') {
														room_id = SourceData.id;
													}

													if (room_id != undefined) {
														LineBotClient.getRoomMemberIds(room_id).then(function (ids) {
															ids.forEach((each_id) => console.log(each_id));
															startReply(MsgFormat.Text(ids.memberIds));
														}, function (data) {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else {
														startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
													}
													break;
												case 'roommemberprofile': case 'rmp':
													var user_id = undefined, room_id = undefined;

													if (msgs[3] && msgs[4]) {
														user_id = msgs[3];
														room_id = msgs[4];
													} else if (msgs[3]) {
														user_id = msgs[3];
														room_id = SourceData.id;
													}

													if (user_id != undefined && room_id != undefined) {
														LineBotClient.getRoomMemberProfile(room_id, user_id).then(function (profile) {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl));
														}, function (data) {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else {
														startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
													}
													break;
												case 'memberprofile': case 'mp':
													if (msgs[3]) {
														LineBotClient.getProfile(msgs[3]).then(function (profile) {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl +
																'\nstatusMessage: ' + profile.statusMessage));
														}, function (data) {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else {
														startReply(MsgFormat.Text('參數錯誤。'));
													}
													break;
												default:
													startReply(MsgFormat.Text('參數錯誤。'));
													break;
											}
											break;
										case 'multi':
											switch (msgs[2]) {
												case 'group':
													switch (msgs[3]) {
														case 'list':
															ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (data) {
																let reply = data[0];
																for (let i = 1; i < data.length; i++) {
																	reply = reply + ', ' + data[i];
																}
																startReply(MsgFormat.Text('目前有： ' + reply));
															});
															break;
														case 'leave':
															LineBotClient.leaveGroup(msgs[4]).then(function () {
																startReply(MsgFormat.Text('日太離開了群組：' + msgs[4]));
															}, function (data) {
																console.log(data);
																startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
															});
															break;
													}
													break;
												case 'room':
													switch (msgs[3]) {
														case 'list':
															ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (data) {
																let reply = data[0];
																for (let i = 1; i < data.length; i++) {
																	reply = reply + ', ' + data[i];
																}
																startReply(MsgFormat.Text('目前有： ' + reply));
															});
															break;
														case 'leave':
															LineBotClient.leaveRoom(msgs[4]).then(function () {
																startReply(MsgFormat.Text('日太離開了聊天室：' + msgs[4]));
															}, function (data) {
																console.log(data);
																startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
															});
															break;
													}
													break;
												default:
													startReply(MsgFormat.Text('參數錯誤。'));
													break;
											}
											break;
										case 'owners':
											switch (msgs[2]) {
												case 'add':
													if (msgs[3]) {
														ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
															owners = data;
															if (owners.indexOf(msgs[3]) > -1) {
																startReply(MsgFormat.Text('owners 名單中已經有這位使用者。'));
															} else {
																ConnectDB.writeDB('owners', owners.length + 3, owners.length + 3, msgs[3]).then(function () {
																	ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
																		owners = data;
																		let reply = owners[0];
																		for (let i = 1; i < owners.length; i++) {
																			reply = reply + ', ' + owners[i];
																		}
																		startReply(MsgFormat.Text('新增完成，目前有： ' + reply));
																	});
																});
															}
														});
													} else {
														startReply(MsgFormat.Text('參數錯誤。'));
													}
													break;
												case 'remove':
													if (msgs[3]) {
														ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
															owners = data;
															if (owners.indexOf(msgs[3]) > -1) {
																owners.splice(owners.indexOf(msgs[3]), 1);
																ConnectDB.writeDB('owners', 3, owners.length + 3, owners).then(function () {
																	ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
																		owners = data;
																		let reply = owners[0];
																		for (let i = 1; i < owners.length; i++) {
																			reply = reply + ', ' + owners[i];
																		}
																		startReply(MsgFormat.Text('移除完成，目前有： ' + reply));
																	});
																});
															} else {
																startReply(MsgFormat.Text('owners 名單中沒有這位使用者。'));
															}
														});
													} else {
														startReply(MsgFormat.Text('參數錯誤。'));
													}
													break;
												case 'list':
													ConnectDB.readDB(DBref.indexOf('owners') + 1).then(function (data) {
														let reply = owners[0];
														for (let i = 1; i < owners.length; i++) {
															reply = reply + ', ' + owners[i];
														}
														startReply(MsgFormat.Text('目前有： ' + reply));
													});
													break;
												case 'notice':
													var user_id;
													if (msgs[3]) {
														user_id = msgs[3];
													} else {
														user_id = event.source.userId;
													}

													ConnectDB.readDB(DBref.indexOf('ownersnotice') + 1).then(function (data) {
														owners_notice = data;
														if (owners_notice.indexOf(user_id) > -1) {
															owners_notice.splice(owners_notice.indexOf(user_id), 1);
															ConnectDB.writeDB('ownersnotice', 3, owners_notice.length + 3, owners_notice).then(function () {
																ConnectDB.readDB(DBref.indexOf('ownersnotice') + 1).then(function (data) {
																	owners_notice = data;
																	console.log(owners_notice);
																	startReply(MsgFormat.Text('已經為 ' + user_id + ' 關閉管理者通知。'));
																	console.log('已經為 ' + user_id + ' 關閉管理者通知。');
																});
															});
														} else {
															ConnectDB.writeDB('ownersnotice', owners_notice.length + 3, owners_notice.length + 3, user_id).then(function () {
																ConnectDB.readDB(DBref.indexOf('ownersnotice') + 1).then(function (data) {
																	owners_notice = data;
																	console.log(owners_notice);
																	startReply(MsgFormat.Text('已經為 ' + user_id + ' 開啟管理者通知。'));
																	console.log('已經為 ' + user_id + ' 開啟管理者通知。');
																});
															});
														}
													});
													break;
												default:
													startReply(MsgFormat.Text('參數錯誤。'));
													break;
											}
											break;
										case 'calltimer':
											var id;
											if (msgs[2]) {
												id = msgs[2];
											} else {
												id = SourceData.id;
											}

											ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
												if (ontime_timer_list.indexOf(id) > -1) {
													ontime_timer_list.splice(ontime_timer_list.indexOf(id), 1);
													ConnectDB.writeDB('ontimetimer', 3, ontime_timer_list.length + 3, ontime_timer_list).then(function () {
														ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
															console.log(ontime_timer_list);
															let reply = ontime_timer_list[0];
															for (let i = 1; i < ontime_timer_list.length; i++) {
																reply = reply + ', ' + ontime_timer_list[i];
															}
															startReply(MsgFormat.Text(id + ' 的報時功能已經關閉。\n目前清單： ' + reply));
															console.log(id + ' 的報時功能已經關閉。\n目前清單： ' + reply);
														});
													});
												} else {
													ConnectDB.writeDB('ontimetimer', ontime_timer_list.length + 3, ontime_timer_list.length + 3, id).then(function () {
														ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
															console.log(ontime_timer_list);
															let reply = ontime_timer_list[0];
															for (let i = 1; i < ontime_timer_list.length; i++) {
																reply = reply + ', ' + ontime_timer_list[i];
															}
															startReply(MsgFormat.Text(id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list));
															console.log(id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list);
														});
													});
												}
											});
											break;
										case 'renewquizdb':
											QuizDB.renew().then(function (data) { startReply(MsgFormat.Text('已重新獲取題庫！')); });
											break;
										case 'send':
											if (msgs[2] && msgs[3]) {
												LineBotClient.pushMessage(msgs[2], MsgFormat.Text(msgs[3]));
												startReply(MsgFormat.Text('傳送完成。'));
											} else {
												startReply(MsgFormat.Text('參數錯誤。'));
											}
											break;
										default:
											startReply(MsgFormat.Text('參數錯誤。'));
											break;
									}
								} else {
									startReply(MsgFormat.Text('您沒有權限。'));
								}
								break;
							case '/st':
								switch (msgs[1]) {
									case 'help':
										startReply(MsgFormat.Text('可用指令如下：' +
											'\n/st help' +
											'\n/st time get' +
											'\n/st time getall' +
											'\n/st calltimer' +
											'\n/st earthquakenotification || eqn' +
											'\n/st quiz [bsn]' +
											'\n/st quizans <bsn>' +
											'\n　註：bsn 為巴哈姆特看板編號。' +
											// '\n/st antiunsend || au [SpecificSort]' +
											// '\n　註：最多指定 20 筆資料，若無指定預設五筆。' +
											'\n/st ping <address> [port] [attempt]' +
											'\n　註：attempt 預設 2，port 預設 80'));
										break;
									case 'time':
										switch (msgs[2]) {
											case 'get':
												UTC8Time.getNowTimePromise().then(function (data) {
													startReply(MsgFormat.Text(data.time_hr + CallTimer.clocktext[GetRandomNumber.start(0, CallTimer.clocktext.length - 1)]));
												});
												break;
											case 'getall':
												startReply(MsgFormat.Text(UTC8Time.getNowTime()));
												break;
											default:
												startReply(MsgFormat.Text('參數錯誤。'));
												break;
										}
										break;
									case 'calltimer':
										ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
											if (ontime_timer_list.indexOf(SourceData.id) > -1) {
												ontime_timer_list.splice(ontime_timer_list.indexOf(SourceData.id), 1);
												ConnectDB.writeDB('ontimetimer', 3, ontime_timer_list.length + 3, ontime_timer_list).then(function () {
													ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
														startReply(MsgFormat.Text('報時功能已經關閉。'));
														console.log(SourceData.id + ' 的報時功能已經關閉。');
													});
												});
											} else {
												ConnectDB.writeDB('ontimetimer', ontime_timer_list.length + 3, ontime_timer_list.length + 3, SourceData.id).then(function () {
													ConnectDB.readDB(DBref.indexOf('ontimetimer') + 1).then(function (ontime_timer_list) {
														startReply(MsgFormat.Text('報時功能已經開啟。'));
														console.log(SourceData.id + ' 的報時功能已經開啟。');
													});
												});
											}
										});
										break;
									case 'earthquakenotification': case 'eqn':
										if (msgs[2] == 'list') {
											ConnectDB.readDB(DBref.indexOf('earthquakenotification') + 1).then(function (earthquake_notification_list) {
												if (earthquake_notification_list.find(function (element) { return element.id == SourceData.id; })) {
													let eqn_area_list = earthquake_notification_list.find(function (element) { return element.id == SourceData.id; }).area;
													let replyMsg = eqn_area_list[0];
													for (let i = 1; i < eqn_area_list.length; i++) {
														replyMsg += '、' + eqn_area_list[i];
													}
													startReply(MsgFormat.Text('啟用地區如下： ' + replyMsg), MsgFormat.Text('如需調整通知地區，請使用指令：/st eqn <地區編號>，使用 /st eqn 獲取地區編號列表。選擇的地區若沒有選擇過將會新增，若已經有選擇過將會移除。'));
												} else {
													startReply(MsgFormat.Text('並沒有啟用地震通知。'));
												}
											});
										} else if (msgs[2] == 'off') {
											ConnectDB.readDB(DBref.indexOf('earthquakenotification') + 1).then(function (earthquake_notification_list) {
												if (earthquake_notification_list.find(function (element) { return element.id == SourceData.id; })) {
													earthquake_notification_list.splice(earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; }), 1);
													ConnectDB.writeDB('earthquakenotification', 3, earthquake_notification_list.length + 3, earthquake_notification_list, 'A', 'B', ['id', 'area']).then(function () {
														startReply(MsgFormat.Text('地震通知已經關閉。'));
														console.log(SourceData.id + ' 的地震通知已經關閉。');
													});
												} else {
													startReply(MsgFormat.Text('並沒有啟用地震通知。'));
												}
											});
										} else if (Number(msgs[2]) >= 0 && Number(msgs[2]) < 23) {
											ConnectDB.readDB(DBref.indexOf('earthquakenotification') + 1).then(function (earthquake_notification_list) {
												if (Number(msgs[2]) == 0) {
													if (earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; }) > -1) {
														earthquake_notification_list.splice(earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; }), 1);
														ConnectDB.writeDB('earthquakenotification', 3, earthquake_notification_list.length + 3, earthquake_notification_list, 'A', 'B', ['id', 'area']).then(function () {
															startReply(MsgFormat.Text('所有 地區的地震通知已經關閉。'));
															console.log(SourceData.id + ' 的 所有 地區的地震通知已經關閉。');
														});
													} else {
														ConnectDB.writeDB('earthquakenotification', earthquake_notification_list.length + 3, earthquake_notification_list.length + 4, [{
															'id': SourceData.id,
															'area': AllCity
														}], 'A', 'B', ['id', 'area']).then(function () {
															startReply(MsgFormat.Text('所有 地區的地震通知已經開啟。'));
															console.log(SourceData.id + ' 的 所有 地區的地震通知已經開啟。');
														})
													}
												} else if (earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; }) > -1) {
													if (earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area.findIndex(function (element) { return element == AllCity[Number(msgs[2]) - 1]; }) > -1) {
														earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area.splice(earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area.findIndex(function (element) { return element == AllCity[Number(msgs[2]) - 1]; }), 1);
														if (earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area.length == 0) {
															earthquake_notification_list.splice(earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; }), 1);
														}
														ConnectDB.writeDB('earthquakenotification', 3, earthquake_notification_list.length + 3, earthquake_notification_list, 'A', 'B', ['id', 'area']).then(function () {
															startReply(MsgFormat.Text(Number(msgs[2]) + '. ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經關閉。'));
															console.log(SourceData.id + ' 的 ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經關閉。');
														});
													} else {
														earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area[earthquake_notification_list[earthquake_notification_list.findIndex(function (element) { return element.id == SourceData.id; })].area.length] = AllCity[Number(msgs[2]) - 1];
														ConnectDB.writeDB('earthquakenotification', 3, earthquake_notification_list.length + 3, earthquake_notification_list, 'A', 'B', ['id', 'area']).then(function () {
															startReply(MsgFormat.Text(Number(msgs[2]) + '. ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。'));
															console.log(SourceData.id + ' 的 ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。');
														});
													}
												} else {
													ConnectDB.writeDB('earthquakenotification', earthquake_notification_list.length + 3, earthquake_notification_list.length + 4, [{
														'id': SourceData.id,
														'area': [AllCity[Number(msgs[2]) - 1]]
													}], 'A', 'B', ['id', 'area']).then(function () {
														startReply(MsgFormat.Text(Number(msgs[2]) + '. ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。'));
														console.log(SourceData.id + ' 的 ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。');
													});
												}
											});
										} else {
											startReply(MsgFormat.Text('請以數字選擇接收通知地區，當選擇的地區最大震度二級即會通知。請使用指令：/st eqn <地區編號>\n' + AllCityList));
										}
										break;
									case 'quiz':
										if (msgs[2]) {
											if (msgs[2] > 0 && msgs[2] < 100000) {
												QuizDB.get().then(function () {
													QuizDB.searchData('bsn', msgs[2]).then(function (data) {
														if (data.length != 0) {
															for (let i = 0; i < data.length; i++) {
																let choose = GetRandomNumber.start(0, data.length - 1);
																switch (data[choose].answer) {
																	case '1': case '2': case '3': case '4':
																		i = data.length;
																		startReply(MsgFormat.Text('題目編號：' + data[choose].sn +
																			'\n題目：' + data[choose].question +
																			'\n選項：\n1. ' + data[choose].option_1 +
																			'\n2. ' + data[choose].option_2 +
																			'\n3. ' + data[choose].option_3 +
																			'\n4. ' + data[choose].option_4 +
																			'\n\n題目來源討論區：https://forum.gamer.com.tw/A.php?bsn=' + data[choose].bsn +
																			'\n獲取答案請打 /st quizans ' + data[choose].sn));
																		break;
																	default:
																		if (i > data.length - 2) {
																			startReply(MsgFormat.Text('資料庫中可能沒有已經有答案的題目＞＜"'));
																		}
																		break;
																}
															}
														} else {
															startReply(MsgFormat.Text('資料庫中無該看板題庫＞＜"'));
														}
													});
												});
											} else {
												startReply(MsgFormat.Text('參數錯誤。'));
											}
										} else {
											QuizDB.get().then(function (data) {
												quiz_start();
												function quiz_start() {
													let choose = GetRandomNumber.start(0, data.length - 1);
													switch (data[choose].answer) {
														case '1': case '2': case '3': case '4':
															startReply(MsgFormat.Text('題目編號：' + data[choose].sn +
																'\n題目：' + data[choose].question +
																'\n選項：\n1. ' + data[choose].option_1 +
																'\n2. ' + data[choose].option_2 +
																'\n3. ' + data[choose].option_3 +
																'\n4. ' + data[choose].option_4 +
																'\n\n題目來源討論區：https://forum.gamer.com.tw/A.php?bsn=' + data[choose].bsn +
																'\n獲取答案請打 /st quizans ' + data[choose].sn));
															break;
														default:
															quiz_start();
															break;
													}
												}
											});
										}
										break;
									case 'quizans':
										if (msgs[2]) {
											if (msgs[2] > 0 && msgs[2] < 100000) {
												QuizDB.get().then(function (data) {
													QuizDB.searchData('sn', msgs[2]).then(function (data) {
														if (data != undefined) {
															switch (data.answer) {
																case '1': case '2': case '3': case '4':
																	startReply(MsgFormat.Text('題目編號：' + data.sn +
																		'\n題目：' + data.question +
																		'\n選項：\n1. ' + data.option_1 +
																		'\n2. ' + data.option_2 +
																		'\n3. ' + data.option_3 +
																		'\n4. ' + data.option_4 +
																		'\n答案為：' + data.answer));
																	break;
																default:
																	startReply(MsgFormat.Text('資料庫中可能沒有這一題的答案＞＜"'));
																	break;
															}
														} else {
															startReply(MsgFormat.Text('資料庫中可能沒有這一題＞＜"'));
														}
													});
												});
											}
										} else {
											startReply(MsgFormat.Text('參數錯誤。'));
										}
										break;
									case 'ping':
										if (msgs[2] || SourceData.id == 'C0170a911180661dae5d2ec25bdffceae') {
											if (msgs[2]) {
												msgs[2] = msgs[2].replace('http://', '').replace('https://', '');
												msgs[2] = msgs[2].split('/')[0];
											}

											let pingport, pingattempts, replyMsg;

											if (msgs[3]) {
												if (65536 > Number(msgs[3]) && Number(msgs[3]) > 0) {
													pingport = Number(msgs[3]);
												} else {
													pingport = 80;
												}
											} else {
												pingport = 80;
											}

											if (msgs[4]) {
												if (6 > Number(msgs[4]) && Number(msgs[4]) > 0) {
													pingattempts = Number(msgs[4]);
												} else {
													pingattempts = 2;
												}
											} else {
												pingattempts = 2;
											}

											if (!msgs[2] && SourceData.id == 'C0170a911180661dae5d2ec25bdffceae') {
												msgs[2] = 'dokidokiweebclub.ddns.net';
												pingport = 25565;
											}

											ping.ping({ address: msgs[2], port: pingport, attempts: pingattempts }, function (data) {
												replyMsg = '目標位址： ' + data[0].address + '\n連接埠： ' + data[0].port + '\n嘗試次數： ' + data[0].attempts;
												if (data[0].avg) {
													replyMsg += '\n狀態： 線上' + '\n平均時間： ' + data[0].avg;
												} else {
													replyMsg += '\n狀態： 離線';
												}

												startReply(MsgFormat.Text(replyMsg));
											});
										} else {
											startReply(MsgFormat.Text('參數錯誤。'));
										}
										break;
									case 'get':
										if (msgs[2] == "myid" && event.source.userId) {
											startReply(MsgFormat.Text("您的個人 ID 為： " + event.source.userId));
										} else if (msgs[2] == "myid") {
											startReply(MsgFormat.Text("無法獲取您的 ID，請同意使用規約以獲取個人 ID。操作流程：\n**注意，請勿加入好友。**\n點選日太後，選擇「聊天」，隨意傳送訊息，並同意使用規約後，於一對一聊天中重新傳送指令。"));
										}
										break;
									default:
										startReply(MsgFormat.Text('參數錯誤。'));
										break;
								}
								break;
							default:
								break;
						}
					} else {
						if (event.message.text == '87') {
							startReply(MsgFormat.Text('你說誰 87，你全家都 87'));
						}
					}
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
			}
			break;
		case 'follow':
			break;
		case 'unfollow':
			break;
		case 'join':
			switch (event.source.type) {
				case 'group':
					ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
						if (groups.indexOf(event.source.groupId) == -1) {
							ConnectDB.writeDB('groups', groups.length + 3, groups.length + 3, event.source.groupId).then(function () {
								ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
									console.log(groups);
								});
							}, function (error) {
								console.log(error);
							});
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太加入了群組: ' + event.source.groupId));
					}
					break;
				case 'room':
					ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (rooms) {
						if (rooms.indexOf(event.source.roomId) == -1) {
							ConnectDB.writeDB('rooms', rooms.length + 3, rooms.length + 3, event.source.roomId).then(function () {
								ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (rooms) {
									console.log(rooms);
								});
							}, function (error) {
								console.log(error);
							});
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太加入了聊天室: ' + event.source.roomId));
					}
					break;
			}
			break;
		case 'leave':
			switch (event.source.type) {
				case 'group':
					ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
						if (groups.indexOf(event.source.groupId) > -1) {
							groups.splice(groups.indexOf(event.source.groupId), 1);
							ConnectDB.writeDB('groups', 3, groups.length + 3, groups).then(function () {
								ConnectDB.readDB(DBref.indexOf('groups') + 1).then(function (groups) {
									console.log(groups);
								});
							}, function (error) {
								console.log(error);
							});
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太離開了群組: ' + event.source.groupId));
					}
					break;
				case 'room':
					ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (rooms) {
						if (rooms.indexOf(event.source.roomId) > -1) {
							rooms.splice(rooms.indexOf(event.source.roomId), 1);
							ConnectDB.writeDB('rooms', 3, rooms.length + 3, rooms).then(function () {
								ConnectDB.readDB(DBref.indexOf('rooms') + 1).then(function (rooms) {
									console.log(rooms);
								});
							}, function (error) {
								console.log(error);
							});
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + '\n日太離開了聊天室: ' + event.source.roomId));
					}
					break;
			}
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
			console.log(UTC8Time.getNowTime(), 'Source Msg: ' + event.message.text + ';Replyed: ' + replyMsg);
		}).catch(function (error) {
			console.log(error);
		});
	}
}

// ================================================== My Program Over ==================================================
// ================================================== Start Other Functions ==================================================

// 開機提醒
setTimeout(function () {
	ngrok.connect(8080, function (err, url) {
		$({
			type: 'GET',
			url: 'https://bitbucket.org/moontai0724/suntaidev-new/rss?token=647ffb534a2e39dac086cfe6ceaa286e',
			success: function (data) {
				parseString(data, function (err, result) {
					last_commit_time = result.rss.channel[0].item[0].pubDate[0];
				});
			}
		});
		for (let i = 0; i < owners_notice.length; i++) {
			LineBotClient.pushMessage(owners_notice[i], [MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已啟動完成。' +
				'\n請更改網址：https://developers.line.me/console/channel/1558579961/basic/' +
				'\nNow running at: ' + url), MsgFormat.Text(url.split('://')[1].split('.')[0])]);
			console.log(UTC8Time.getNowTime() + 'send: ' + owners_notice[i] + ';msg: ' + '日太已啟動完成。\n請更改網址：https://developers.line.me/console/channel/1558579961/basic/\nNow running at: ' + url, url.split('://')[1].split('.')[0]);

		}
	});
}, 3000);

// 自動重開 28800000ms
setTimeout(function () {
	server.close(function () {
		console.log(UTC8Time.getNowTime() + ' 日太已自動關機。');
		process.exit();
	});
}, 28800000);

// 確認是否有新 code
setInterval(function () {
	$({
		type: 'GET',
		url: 'https://bitbucket.org/moontai0724/suntaidev-new/rss?token=647ffb534a2e39dac086cfe6ceaa286e',
		success: function (data) {
			parseString(data, function (err, result) {
				if (result.rss.channel[0].item[0].pubDate[0] != last_commit_time) {
					server.close(function () {
						console.log(UTC8Time.getNowTime() + ' 偵測到有新編譯，日太已自動關機。');
						process.exit();
					});
				}
			});
		}
	});
}, 60000);

// 報時功能
CallTimer.calltimer();

// 地震報告
EarthquakeCheck.opendata();

/* */