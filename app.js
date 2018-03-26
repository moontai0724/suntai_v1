// npm install @line/bot-sdk koa koa-bodyparser koa-router najax ngrok ping-net sqlite xml2js
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
const Config = require('./config/config.json');
const app = new Koa();
const router = new KoaRouter();
const LineBotClient = new LineBotSDK.Client(Config.LineBot);

app.use(KoaBodyParser());

// Webhook
router.post('/', ctx => {
	console.log(JSON.stringify(ctx.request.header));
	if (ctx.request.header['user-agent'].includes('LineBotWebhook')) {
		const req = ctx.request;
		if (LineBotSDK.validateSignature(req.rawBody, Config.LineBot.channelSecret, req.headers['x-line-signature'])) {
			ctx.status = 200;
			req.body.events.map(MessageHandler);
		}
		else {
			ctx.body = '驗證失敗';
			ctx.status = 401;
		}
	} else if (ctx.request.header['user-agent'].includes('GitHub')) {
		setTimeout(() => {
			server.close(() => {
				console.log('Received GitHub push message, server restarted.');
				process.exit();
			});
		}, 2000);
	}
})

app.use(router.routes());

// Service Startup
const server = app.listen(8080);

// ================================================== My Functions Start ================================================== 

const Country = require('./functions/Variables').Country;
const AllCity = require('./functions/Variables').AllCity;
const AllCityName = require('./functions/Variables').AllCityName;
const AllCityList = require('./functions/Variables').AllCityList;

const UTC8Time = require('./functions/UTC8Time'); //include: getNowTime(function), value
const MsgFormat = require('./functions/MsgFormat'); //include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const QuizDB = require('./functions/QuizDB'); //include: value(function), get(function), searchIndex(function), searchData(function)
const EarthquakeCheck = require('./functions/EarthquakeCheck');
const GetRandomNumber = require('./functions/GetRandomNumber');
const UploadPicToImgurByURL = require('./functions/UploadPicToImgurByURL');
const CallTimer = require('./functions/CallTimer');
const Chatlog = require('./functions/Chatlog');
const Fortune = require('./functions/Fortune');
const Weather = require('./functions/Weather');

// ================================================== My Functions Over ==================================================
// ================================================== Start My Program ==================================================

var db_settings, owners = [], owners_notice = [];
setTimeout(async function OpenDB() {
	db_settings = await sqlite.open('./database/settings.sqlite', { Promise });
	owners = await db_settings.all('SELECT * FROM Owners');
	owners_notice = await db_settings.all('SELECT * FROM OwnersNotice');
});

// Message handler
async function MessageHandler(event) {
	console.log(JSON.stringify(event));
	// if (!owners) break;

	var SourceData = {
		userId: 'UNKNOWN',
		id: undefined,
		Profile: {
			displayName: undefined,
			userId: undefined,
			pictureUrl: undefined,
			statusMessage: undefined
		}
	};

	if (event.source.userId) SourceData.userId = event.source.userId;
	switch (event.source.type) {
		case 'user': SourceData.id = event.source.userId; break;
		case 'group': SourceData.id = event.source.groupId; break;
		case 'room': SourceData.id = event.source.roomId; break;
	}

	// SourceData.Profile = await LineBotClient.getProfile(event.source.userId); // displayName, userId, pictureUrl, statusMessage
	// SourceData.Profile = await LineBotClient.getGroupMemberProfile(event.source.groupId, event.source.userId); // displayName, userId, pictureUrl
	// SourceData.Profile = await LineBotClient.getRoomMemberProfile(event.source.roomId, event.source.userId); // displayName, userId, pictureUrl

	switch (event.type) {
		case 'message':
			Chatlog.log(event);
			switch (event.message.type) {
				case 'text':
					if (event.message.text.startsWith('/')) {
						var msgs = event.message.text.replace(/\n/g, '').split(' '), authorize = false;
						if (owners.findIndex(element => { return element.id == SourceData.userId; }) != -1) authorize = true;
						switch (msgs[0]) {
							case '/mt':
								if (authorize == true) {
									switch (msgs[1]) {
										case 'help':
											startReply(MsgFormat.Text('可用指令如下：' +
												'\n* /st get myid' +
												'\n/mt ngrok (noauth || auth)' +
												'\n/mt (shutdown || restart) [sec]' +
												'\n/mt addfriend' +
												'\n/mt (calltimertest || ctt) [groupId/userId]' +
												'\n/mt get (id || i) (group/room)' +
												'\n/mt get (groupmemberids || gmi)' +
												'\n/mt get (groupmemberprofile || gmp) <userId> [groupId]' +
												'\n/mt get (roommemberids || rmi)' +
												'\n/mt get (roommemberprofile || rmp) <userId> [groupId]' +
												'\n/mt get (memberprofile || mp) <userId>' +
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
												'\n/mt send <groupId> <msg>' +
												'\n/mt weather refresh'));
											break;
										case 'ngrok':
											switch (msgs[2]) {
												case 'noauth':
													fs.unlink(process.env.HOMEDRIVE + process.env.HOMEPATH + '/.ngrok2/ngrok.yml', (err) => console.log('Non exist'));
													ngrok.connect(8080, (err, url) => {
														console.log(err, url);
														if (url) {
															for (let i = 0; i < owners_notice.length; i++) {
																LineBotClient.pushMessage(owners_notice[i].id, [MsgFormat.Text(UTC8Time.getNowTime() + '\nngrok 已啟動完成。' +
																	'\n請更改網址：https://developers.line.me/console/channel/1558579961/basic/' +
																	'\nNow running at: ' + url), MsgFormat.Text(url.split('://')[1].split('.')[0])]);
															}
														} else {
															for (let i = 0; i < owners_notice.length; i++) {
																LineBotClient.pushMessage(owners_notice[i].id, [MsgFormat.Text('ngrok 啟動失敗。')]);
															}
														}
													});
													break;
												case 'auth':
													ngrok.connect(8080, (err, url) => {
														console.log(err, url);
														if (url) {
															for (let i = 0; i < owners_notice.length; i++) {
																LineBotClient.pushMessage(owners_notice[i].id, [MsgFormat.Text(UTC8Time.getNowTime() + '\nngrok 已啟動完成。' +
																	'\n請更改網址：https://developers.line.me/console/channel/1558579961/basic/' +
																	'\nNow running at: ' + url), MsgFormat.Text(url.split('://')[1].split('.')[0])]);
															}
														} else {
															for (let i = 0; i < owners_notice.length; i++) {
																LineBotClient.pushMessage(owners_notice[i].id, [MsgFormat.Text('ngrok 啟動失敗。')]);
															}
														}
													});
													break;
												default:
													startReply(MsgFormat.Text('請輸入 auth 或 noauth 參數。'));
													break;
											}
											break;
										case 'shutdown': case 'restart':
											if (msgs[2]) {
												setTimeout(() => {
													server.close(() => {
														for (let i = 0; i < owners_notice.length; i++) {
															LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已關機。'));
															console.log('send: ' + owners_notice[i].id + ';msg: ' + UTC8Time.getNowTime() + '\n日太已關機。');
														}
														process.exit();
													});
												}, Number(msgs[2]) * 1000);
											} else {
												server.close(() => {
													for (let i = 0; i < owners_notice.length; i++) {
														LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已關機。'));
														console.log('send: ' + owners_notice[i].id + ';msg: ' + UTC8Time.getNowTime() + '\n日太已關機。');
													}
													process.exit();
												});
											}
											break;
										case 'addfriend':
											startReply(MsgFormat.Text('http://line.me/ti/p/~@web9850f'));
											break;
										case 'calltimertest': case 'ctt':
											if (msgs[2]) CallTimer.calltimertest(Number(msgs[2]));
											else CallTimer.calltimertest();
											break;
										case 'get':
											switch (msgs[2]) {
												case 'id': case 'i':
													if (SourceData.id != 'UNKNOWN') startReply(MsgFormat.Text(SourceData.id));
													else startReply(MsgFormat.Text('請在群組或聊天室中發送此指令。'));
													break;
												case 'groupmemberids': case 'gmi':
													var group_id = undefined;
													if (msgs[3]) group_id = encodeURI(msgs[3]);
													else if (!msgs[3] && event.source.type == 'group') group_id = event.source.groupId;

													if (group_id != undefined) {
														LineBotClient.getGroupMemberIds(group_id).then(ids => {
															ids.forEach(each_id => console.log(each_id));
															startReply(MsgFormat.Text(ids.memberIds));
														}, data => {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
													break;
												case 'groupmemberprofile': case 'gmp':
													var user_id = undefined, group_id = undefined;

													if (msgs[3] && msgs[4]) {
														user_id = encodeURI(msgs[3]);
														group_id = encodeURI(msgs[4]);
													} else if (msgs[3]) {
														user_id = encodeURI(msgs[3]);
														group_id = SourceData.id;
													}

													if (user_id != undefined && group_id != undefined) {
														LineBotClient.getGroupMemberProfile(group_id, user_id).then(profile => {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl));
														}, data => {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else startReply(MsgFormat.Text('請輸入應有參數，或在群組中發送此指令。'));
													break;
												case 'roommemberids': case 'rmi':
													var room_id = undefined;
													if (msgs[3]) room_id = encodeURI(msgs[3]);
													else if (!msgs[3] && event.source.type == 'room') room_id = SourceData.id;


													if (room_id != undefined) {
														LineBotClient.getRoomMemberIds(room_id).then(ids => {
															ids.forEach(each_id => console.log(each_id));
															startReply(MsgFormat.Text(ids.memberIds));
														}, data => {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
													break;
												case 'roommemberprofile': case 'rmp':
													var user_id = undefined, room_id = undefined;

													if (msgs[3] && msgs[4]) {
														user_id = encodeURI(msgs[3]);
														room_id = encodeURI(msgs[4]);
													} else if (msgs[3]) {
														user_id = encodeURI(msgs[3]);
														room_id = SourceData.id;
													}

													if (user_id != undefined && room_id != undefined) {
														LineBotClient.getRoomMemberProfile(room_id, user_id).then(profile => {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl));
														}, data => {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else startReply(MsgFormat.Text('請輸入應有參數，或在聊天室中發送此指令。'));
													break;
												case 'memberprofile': case 'mp':
													if (msgs[3]) {
														LineBotClient.getProfile(encodeURI(msgs[3])).then(profile => {
															console.log(profile);
															startReply(MsgFormat.Text('Display Name: ' + profile.displayName +
																'\nuserId: ' + profile.userId +
																'\npictureUrl: ' + profile.pictureUrl +
																'\nstatusMessage: ' + profile.statusMessage));
														}, data => {
															console.log(data);
															startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
														});
													} else startReply(MsgFormat.Text('參數錯誤。'));
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
															db_settings.all('SELECT * FROM Groups').then(data => {
																let reply = data[0].id;
																for (let i = 1; i < data.length; i++) {
																	reply = reply + ', ' + data[i].id;
																}
																startReply(MsgFormat.Text('目前有： ' + reply));
															});
															break;
														case 'leave':
															if (msgs[4]) {
																msgs[4] = encodeURI(msgs[4]);
																LineBotClient.leaveGroup(msgs[4]).then(() => {
																	db_settings.run('DELETE FROM Groups WHERE id="' + msgs[4] + '"');
																	startReply(MsgFormat.Text('日太離開了群組：' + msgs[4]));
																}, data => {
																	console.log(data);
																	startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
																});
															} else startReply(MsgFormat.Text('缺少必要參數。'));
															break;
													}
													break;
												case 'room':
													switch (msgs[3]) {
														case 'list':
															db_settings.all('SELECT * FROM Rooms').then(data => {
																let reply = data[0].id;
																for (let i = 1; i < data.length; i++) {
																	reply = reply + ', ' + data[i].id;
																}
																startReply(MsgFormat.Text('目前有： ' + reply));
															});
															break;
														case 'leave':
															if (msgs[4]) {
																msgs[4] = encodeURI(msgs[4]);
																LineBotClient.leaveRoom(msgs[4]).then(() => {
																	db_settings.run('DELETE FROM Rooms WHERE id="' + msgs[4] + '"');
																	startReply(MsgFormat.Text('日太離開了聊天室：' + msgs[4]));
																}, data => {
																	console.log(data);
																	startReply(MsgFormat.Text('Process Failed: ' + data.statusCode + ' ' + data.statusMessage));
																});
															} else startReply(MsgFormat.Text('缺少必要參數。'));
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
														msgs[3] = encodeURI(msgs[3]);
														if (owners.findIndex(element => { return element.id == msgs[3] }) == -1) {
															db_settings.run('INSERT INTO Owners VALUES ("' + msgs[3] + '")').then(() => {
																owners[owners.length] = { id: msgs[3] };
																let reply = owners[0].id;
																for (let i = 1; i < owners.length; i++) {
																	reply = reply + ', ' + owners[i].id;
																}
																startReply(MsgFormat.Text('新增完成，目前有： ' + reply));
															});
														} else startReply(MsgFormat.Text('owners 名單中已經有這位使用者。'));
													} else startReply(MsgFormat.Text('參數錯誤。'));

													break;
												case 'remove':
													if (msgs[3]) {
														msgs[3] = encodeURI(msgs[3]);
														if (owners.findIndex(element => { return element.id == msgs[3] }) > -1) {
															db_settings.run('DELETE FROM Owners WHERE id="' + msgs[3] + '"').then(() => {
																owners.splice(owners.findIndex(element => { return element.id == msgs[3] }), 1);
																let reply = owners[0].id;
																for (let i = 1; i < owners.length; i++) {
																	reply = reply + ', ' + owners[i].id;
																}
																startReply(MsgFormat.Text('移除完成，目前有： ' + reply));
															});
														} else {
															startReply(MsgFormat.Text('owners 名單中沒有這位使用者。'));
														}
													} else startReply(MsgFormat.Text('參數錯誤。'));
													break;
												case 'list':
													let reply = owners[0].id;
													for (let i = 1; i < owners.length; i++) {
														reply = reply + ', ' + owners[i].id;
													}
													startReply(MsgFormat.Text('目前有： ' + reply));
													break;
												case 'notice':
													var user_id;
													if (msgs[3]) user_id = encodeURI(msgs[3]); else user_id = event.source.userId;

													if (owners_notice.findIndex(element => { return element.id == user_id; }) > -1) {
														db_settings.run('DELETE FROM OwnersNotice WHERE id="' + user_id + '"').then(() => {
															owners_notice.splice(owners_notice.findIndex(element => { return element.id == user_id; }), 1);
															console.log(owners_notice);
															startReply(MsgFormat.Text('已經為 ' + user_id + ' 關閉管理者通知。'));
															console.log('已經為 ' + user_id + ' 關閉管理者通知。');
														});
													} else {
														db_settings.run('INSERT INTO OwnersNotice VALUES ("' + user_id + '")').then(() => {
															owners_notice[owners_notice.length] = { id: user_id };
															console.log(owners_notice);
															startReply(MsgFormat.Text('已經為 ' + user_id + ' 開啟管理者通知。'));
															console.log('已經為 ' + user_id + ' 開啟管理者通知。');
														});
													}
													break;
												default:
													startReply(MsgFormat.Text('參數錯誤。'));
													break;
											}
											break;
										case 'calltimer':
											var id;
											if (msgs[2]) id = encodeURI(msgs[2]); else id = SourceData.id;

											db_settings.all('SELECT * FROM OntimeTimer').then(ontime_timer_list => {
												if (ontime_timer_list.findIndex(element => { return element.id == id }) > -1) {
													db_settings.run('DELETE FROM OntimeTimer WHERE id="' + id + '"').then(() => {
														ontime_timer_list.splice(ontime_timer_list.findIndex(element => { return element.id == id }), 1);
														console.log(ontime_timer_list);
														let reply = ontime_timer_list[0].id;
														for (let i = 1; i < ontime_timer_list.length; i++) {
															reply = reply + ', ' + ontime_timer_list[i].id;
														}
														startReply(MsgFormat.Text(id + ' 的報時功能已經關閉。\n目前清單： ' + reply));
														console.log(id + ' 的報時功能已經關閉。\n目前清單： ' + reply);
													});
												} else {
													db_settings.run('INSERT INTO OntimeTimer VALUES ("' + id + '")').then(() => {
														ontime_timer_list[ontime_timer_list.length] = { id: id };
														console.log(ontime_timer_list);
														let reply = ontime_timer_list[0].id;
														for (let i = 1; i < ontime_timer_list.length; i++) {
															reply = reply + ', ' + ontime_timer_list[i].id;
														}
														startReply(MsgFormat.Text(id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list));
														console.log(id + ' 的報時功能已經開啟。\n目前清單： ' + ontime_timer_list);
													});
												}
											});
											break;
										case 'renewquizdb':
											QuizDB.renew().then(() => startReply(MsgFormat.Text('已重新獲取題庫！')));
											break;
										case 'send':
											if (msgs[2] && msgs[3]) {
												LineBotClient.pushMessage(encodeURI(msgs[2]), MsgFormat.Text(event.message.text.replace('/mt send ' + msgs[2] + ' ', '')));
												startReply(MsgFormat.Text('傳送完成；\n目標： ' + msgs[2] + '\n訊息： ' + event.source.text.replace('/mt send ' + msgs[2] + ' ', '')));
											} else {
												startReply(MsgFormat.Text('參數錯誤。'));
											}
											break;
										case 'weather':
											switch (msgs[2]) {
												case 'refresh':
													Weather.refreshCityWeather().then(() => startReply(MsgFormat.Text('已重新獲取。')));
													break;
												default:
													startReply(MsgFormat.Text('參數錯誤。'));
													break;
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
											'\n/st keyword list' +
											'\n/st time get' +
											'\n/st time getall' +
											'\n/st calltimer' +
											'\n/st (earthquakenotification || eqn)' +
											'\n/st quiz [bsn]' +
											'\n/st quizans <bsn>' +
											'\n　註：bsn 為巴哈姆特看板編號。' +
											'\n/st ping <address> [port] [attempt]' +
											'\n　註：attempt 預設 2，port 預設 80' +
											// '\n/st (history || h) (getfile || gf) <FileId>' +
											'\n/st (history || h) [SpecificCount] [Parameters]' +
											'\n　獲取更多協助請打 /st h help' +
											'\n　註：最多指定 50 筆資料，若無指定預設 5 筆。' +
											'\n/st (weather || w) 36hr <CityNumber>'));
										break;
									case 'keyword':
										startReply(MsgFormat.Text('特定回應列表回應如下：' +
											'\n87' +
											'\n運勢' +
											'\n籤運' +
											'\n@日太 求 機率'));
										break;
									case 'get':
										if (msgs[2] == "myid" && event.source.userId) {
											startReply(MsgFormat.Text("您的個人 ID 為： " + event.source.userId));
										} else if (msgs[2] == "myid") {
											startReply(MsgFormat.Text("無法獲取您的 ID，請同意使用規約以獲取個人 ID。操作流程：\n**注意，請勿加入好友。**\n點選日太後，選擇「聊天」，隨意傳送訊息，並同意使用規約後，於一對一聊天中重新傳送指令。"));
										}
										break;
									case 'time':
										switch (msgs[2]) {
											case 'get':
												UTC8Time.getNowTimePromise().then(data => {
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
										db_settings.all('SELECT * FROM OntimeTimer').then(ontime_timer_list => {
											if (ontime_timer_list.findIndex(element => { return element.id == SourceData.id }) > -1) {
												db_settings.run('DELETE FROM OntimeTimer WHERE id="' + SourceData.id + '"').then(() => {
													startReply(MsgFormat.Text('報時功能已經關閉。'));
													console.log(SourceData.id + ' 的報時功能已經關閉。');
												});
											} else {
												db_settings.run('INSERT INTO OntimeTimer VALUES ("' + SourceData.id + '")').then(() => {
													startReply(MsgFormat.Text('報時功能已經開啟。'));
													console.log(SourceData.id + ' 的報時功能已經開啟。');
												});
											}
										});
										break;
									case 'earthquakenotification': case 'eqn':
										if (msgs[2] == 'list') {
											db_settings.all('SELECT * FROM EarthquakeNotification').then(earthquake_notification_list => {
												if (earthquake_notification_list.find(element => { return element.id == SourceData.id; })) {
													let eqn_area_list = earthquake_notification_list.find(element => { return element.id == SourceData.id; }).area;
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
											db_settings.all('SELECT * FROM EarthquakeNotification').then(earthquake_notification_list => {
												if (earthquake_notification_list.find(element => { return element.id == SourceData.id; })) {
													earthquake_notification_list.splice(earthquake_notification_list.findIndex(element => { return element.id == SourceData.id; }), 1);
													db_settings.run('DELETE FROM EarthquakeNotification WHERE id="' + SourceData.id + '"').then(() => {
														startReply(MsgFormat.Text('地震通知已經關閉。'));
														console.log(SourceData.id + ' 的地震通知已經關閉。');
													});
												} else {
													startReply(MsgFormat.Text('並沒有啟用地震通知。'));
												}
											});
										} else if (Number(msgs[2]) >= 0 && Number(msgs[2]) < 23) {
											db_settings.all('SELECT * FROM EarthquakeNotification').then(earthquake_notification_list => {
												if (Number(msgs[2]) == 0) {
													if (earthquake_notification_list.findIndex(element => { return element.id == SourceData.id; }) > -1) {
														db_settings.run('DELETE FROM EarthquakeNotification WHERE id="' + SourceData.id + '"').then(() => {
															startReply(MsgFormat.Text('所有 地區的地震通知已經關閉。'));
															console.log(SourceData.id + ' 的 所有 地區的地震通知已經關閉。');
														});
													} else {
														db_settings.run('INSERT INTO EarthquakeNotification VALUES ("' + SourceData.id + '", "' + AllCityName + '")').then(() => {
															startReply(MsgFormat.Text('所有 地區的地震通知已經開啟。'));
															console.log(SourceData.id + ' 的 所有 地區的地震通知已經開啟。');
														})
													}
												} else if (earthquake_notification_list.findIndex(element => { return element.id == SourceData.id; }) > -1) {
													db_settings.all('SELECT * FROM EarthquakeNotification WHERE id=' + SourceData.id).then(data => {
														if (data.area.indexOf(AllCity[Number(msgs[2]) - 1]) > -1) {
															let areas = data.area.split(', ');
															areas.splice(areas.indexOf(AllCity[Number(msgs[2]) - 1]), 1);
															let afterChanged = areas[0];
															for (let i = 1; i < areas.length; i++) {
																afterChanged += ', ' + areas[1];
															}
															db_settings.run('UPDATE EarthquakeNotification SET area="' + afterChanged + '" WHERE id="' + SourceData.id + '"').then(() => {
																startReply(MsgFormat.Text(Number(msgs[2]) + '. ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經關閉。'));
																console.log(SourceData.id + ' 的 ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經關閉。');
															});
														} else {
															let afterChanged = data.area + ', ' + AllCity[Number(msgs[2]) - 1];
															db_settings.run('UPDATE EarthquakeNotification SET area="' + afterChanged + '" WHERE id="' + SourceData.id + '"').then(() => {
																startReply(MsgFormat.Text(Number(msgs[2]) + '. ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。'));
																console.log(SourceData.id + ' 的 ' + AllCity[Number(msgs[2]) - 1] + ' 地區的地震通知已經開啟。');
															});
														}
													});
												} else {
													db_settings.run('INSERT INTO EarthquakeNotification VALUES ("' + SourceData.id + '", "' + AllCity[Number(msgs[2]) - 1] + '")').then(() => {
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
											msgs[2] = Number(msgs[2]);
											if (msgs[2] > 0 && msgs[2] < 100000) {
												QuizDB.get().then(() => {
													QuizDB.searchData('bsn', msgs[2]).then(data => {
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
											QuizDB.get().then(data => {
												setTimeout(function quiz_start() {
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
												});
											});
										}
										break;
									case 'quizans':
										if (msgs[2]) {
											msgs[2] = Number(msgs[2]);
											if (msgs[2] > 0 && msgs[2] < 100000) {
												QuizDB.get().then(data => {
													QuizDB.searchData('sn', msgs[2]).then(data => {
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
												msgs[2] = encodeURIComponent(msgs[2].split('/')[0]);
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

											ping.ping({ address: msgs[2], port: pingport, attempts: pingattempts }, data => {
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
									case 'history': case 'h':
										let settings = {
											'StartYear': 2018,
											'StartMonth': 1,
											'StartDay': 1,
											'StartHour': 0,
											'StartMinute': 0,
											'StartSecond': 0,
											'OverYear': 2018,
											'OverMonth': 1,
											'OverDay': 1,
											'OverHour': 0,
											'OverMinute': 0,
											'OverSecond': 0,
											'Year': 0,
											'Month': 0,
											'Day': 0,
											'Hour': 0,
											'Minute': 0,
											'Second': 0,
										};
										let changelog = {
											'start': false,
											'over': false,
											'specific': false
										};
										let allCommand = ['-StartYear', '-StartMonth', '-StartDay', '-StartHour', '-StartMinute', '-StartSecond', '-OverYear', '-OverMonth', '-OverDay', '-OverHour', '-OverMinute', '-OverSecond', '-Year', '-Month', '-Day', '-Hour', '-Minute', '-Second'];
										let FullTimeCommand = ['-StartTime', '-OverTime', '-FullTime'];
										if (msgs[2] == 'help') {
											startReply(MsgFormat.Text('可用的參數如下：' +
												'\n-StartTime：指定查詢開始的完整時間' +
												'\n-StartYear：指定查詢開始的年份' +
												'\n-StartMonth：指定查詢開始的月份' +
												'\n-StartDay：指定查詢開始的日期' +
												'\n-StartHour：指定查詢開始的小時' +
												'\n-StartMinute：指定查詢開始的分鐘' +
												'\n-StartSecond：指定查詢開始的秒鐘' +
												'\n\n-OverTime：指定查詢結束的完整時間' +
												'\n-OverYear：指定查詢結束的年份' +
												'\n-OverMonth：指定查詢結束的月份' +
												'\n-OverDay：指定查詢結束的日期' +
												'\n-OverHour：指定查詢結束的小時' +
												'\n-OverMinute：指定查詢結束的分鐘' +
												'\n-OverSecond：指定查詢結束的秒鐘' +
												'\n\n-FullTime：指定查詢一段完整時間內的紀錄' +
												'\n-Year：指定查詢一段年份內的紀錄' +
												'\n-Month：指定查詢一段月份內的紀錄' +
												'\n-Day：指定查詢一段日期內的紀錄' +
												'\n-Hour：指定查詢一段小時內的紀錄' +
												'\n-Minute：指定查詢一段分鐘內的紀錄' +
												'\n-Second：指定查詢一段秒鐘內的紀錄' +
												'\n\n　→完整時間格式：YYYY-MM-DD-HH-MM-SS' +
												'\n　→預設開始時間 2018/1/1 00:00:00；結束時間 2018/1/1 00:00:00；一段時間：0/0/0 0:0:0' +
												'\n　→指定一段時間的查詢不能與開始結束時間一起使用，如果都有填入將以 開始／結束 為主。' +
												'\n　→範例１查詢五小時內的 10 條紀錄：/st h 10 -Hour 5' +
												'\n　→範例２查詢 2017/1/1 00:00:00 ~ 2018/1/1 00:00:00 的 10 條紀錄：/st h 10 -StartYear 2017 -OverYear 2018' +
												'\n　→範例３查詢 2018/01/20 15:39 ~ 2019/01/01 20:40 的 10 條紀錄：/st h 10 -StartYear 2018 -StartMonth 01 -StartDay 20 -StartHour 15 -StartMinute 39 -OverYear 2019 -OverHour 20 -OverMinute 40'));
											// } else if (msgs[2] == 'getfile' || msgs[2] == 'gf') {
											// 	Chatlog.getFile(event, SourceData, Number(msgs[3])).then((Fileinfo) => {
											// 	});
										} else if (msgs[2]) {
											for (let i = 3; i < msgs.length; i = i + 2) {
												if (msgs[i] && msgs[i + 1]) {
													if (allCommand.indexOf(msgs[i]) > -1) {
														settings[msgs[i].replace('-', '')] = Number(msgs[i + 1]);
														if (allCommand.indexOf(msgs[i]) > -1 && allCommand.indexOf(msgs[i]) < 6) {
															changelog.start = true;
														} else if (allCommand.indexOf(msgs[i]) > 5 && allCommand.indexOf(msgs[i]) < 12) {
															changelog.over = true;
														} else if (allCommand.indexOf(msgs[i]) > 11 && allCommand.indexOf(msgs[i]) < 18) {
															changelog.specific = true;
														}
													} else if (FullTimeCommand.indexOf(msgs[i]) > -1) {
														let FullTime = msgs[i + 1].split('-');
														if (FullTime.length == 6) {
															let firstword = msgs[i].replace('-', '').replace('Time', '');
															let lastword = ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'];
															for (let x = 0; x < FullTime.length; x++) {
																settings[firstword + lastword[x]] = Number(FullTime[x]);
															}
														} else {
															startReply(MsgFormat.Text('所賦予的參數有錯誤。'));
															break;
														}
														if (msgs[i] == '-StartTime') changelog.start = true;
														else if (msgs[i] == '-OverTime') changelog.over = true;
														else if (msgs[i] == '-FullTime') changelog.specific = true;
													} else {
														startReply(MsgFormat.Text('所賦予的參數有錯誤。'));
														break;
													}
													if (i >= msgs.length - 2) {
														Chatlog.searchHistory(SourceData, Number(msgs[2]), settings, changelog).then(data => startReply(MsgFormat.Text(data)));
													}
												} else {
													startReply(MsgFormat.Text('所賦予的參數有錯誤。'));
													break;
												}
											}
											if (msgs.length < 4) {
												Chatlog.searchHistory(SourceData, Number(msgs[2]), settings, changelog).then(data => startReply(MsgFormat.Text(data)));
											}
										} else {
											Chatlog.searchHistory(SourceData, 5, settings, changelog).then(data => {
												startReply(MsgFormat.Text(data));
											});
										}
										break;
									case 'fortune': case 'f':
										if (msgs[2] && msgs[2] < 101 && msgs[2] > 0) startReply(MsgFormat.Text(Fortune.seeOriginal(Number(msgs[2]) - 1)));
										else startReply(MsgFormat.Text('參數錯誤。'));
										break;
									case 'weather': case 'w':
										switch (msgs[2]) {
											case '36hr':
												if (Number(msgs[2]) > 0 && Number(msgs[2]) < 23) {
													Weather.getCityWeather(AllCity[Number(msgs[2])]).then(data => startReply(MsgFormat.Text(data)));
												} else if (AllCity.includes(msgs[2])) {
													Weather.getCityWeather(msgs[2]).then(data => startReply(MsgFormat.Text(data)));
												} else {
													startReply(MsgFormat.Text('缺少地區參數，請重新輸入指令。下列為可選地區：' + AllCityList));
												}
												break;
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
						let msg = event.message.text.replace(/\s/, '');
						if (msg.includes('運勢')) {
							startReply(MsgFormat.Text(Fortune.drawOnly()));
						} else if (msg.includes('籤運')) {
							startReply(MsgFormat.Text(Fortune.draw()));
						} else if (msg.includes('@日太') && msg.includes('求') && msg.includes('的機率')) {
							startReply(MsgFormat.Text(GetRandomNumber.start(0, 100) + ' %'));
						} else if (msg == '87') {
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
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太加入了群組: ' + event.source.groupId));
					}
					break;
				case 'room':
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太加入了聊天室: ' + event.source.roomId));
					}
					break;
			}
			break;
		case 'leave':
			switch (event.source.type) {
				case 'group':
					db_settings.all('SELECT * FROM Groups').then(groups => {
						if (groups.indexOf(event.source.groupId) > -1) {
							db_settings.run('DELETE FROM Groups WHERE id="' + event.source.groupId + '"');
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太離開了群組: ' + event.source.groupId));
					}
					break;
				case 'room':
					db_settings.all('SELECT * FROM Rooms').then(rooms => {
						if (rooms.indexOf(event.source.roomId) > -1) {
							db_settings.run('DELETE FROM Rooms WHERE id="' + event.source.roomId + '"');
						} else {
							console.log('沒有達成條件');
						}
					});
					for (let i = 0; i < owners_notice.length; i++) {
						LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太離開了聊天室: ' + event.source.roomId));
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
		if (replyMsg_2) replyMsg[1] = replyMsg_2;
		if (replyMsg_3) replyMsg[2] = replyMsg_3;
		if (replyMsg_4) replyMsg[3] = replyMsg_4;
		if (replyMsg_5) replyMsg[4] = replyMsg_5;
		LineBotClient.replyMessage(event.replyToken, replyMsg).then(() => {
			console.log(UTC8Time.getNowTime(), 'Source Msg: ' + event.message.text + ';Replyed: ' + replyMsg);
		}).catch(error => {
			console.log(error);
		});
	}
}

// ================================================== My Program Over ==================================================
// ================================================== Start Other Functions ==================================================

// 開機提醒
setTimeout(() => {
	for (let i = 0; i < owners_notice.length; i++) {
		LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(UTC8Time.getNowTime() + '\n日太已啟動完成。'));
	}
}, 3000);

// 定時檢查是否正常連線
setInterval(() => {
	ping.ping({ address: 'localhost', port: 4040, attempts: 2 }, data => {
		let replyMsg = '';
		if (data[0].avg) {
			replyMsg = '目前日太運作狀況良好。';
		} else {
			replyMsg = '目前連線錯誤，請檢查。';
		}
		console.log(replyMsg);

		for (let i = 0; i < owners_notice.length; i++) {
			LineBotClient.pushMessage(owners_notice[i].id, MsgFormat.Text(replyMsg));
		}
	});
}, 21600000);

// 自動重開 28800000ms
// setTimeout(() => {
// 	server.close(() => {
// 		console.log(UTC8Time.getNowTime() + ' 日太已自動關機。');
// 		process.exit();
// 	});
// }, 28800000);

// 報時功能
CallTimer.calltimer();

// 地震報告
EarthquakeCheck.opendata();

// 定時清除下載的資料
// setInterval(() => {
// 	Chatlog.deleteOutdatedFiles();
// }, 86400000);

/* */