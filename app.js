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
app.listen(process.env.PORT || 8080, function () { console.log("App now running on port: ", this.address().port); });

/* ================================================== My Functions Start ================================================== */

const DBref = require('./functions/Variables').DBref; //ok

const UTC8Time = require('./functions/UTC8Time'); //ok.include: getNowTime(function), value
const MsgFormat = require('./functions/MsgFormat'); //ok.include: Text(function), Sticker(function), Image(function), Video(function), Audio(function), Location(function)
const QuizDB = require('./functions/QuizDB'); //ok.include: value(function), get(function), searchIndex(function), searchData(function)
const EarthquakeCheck = require('./functions/EarthquakeCheck');
const GetRandomNumber = require('./functions/GetRandomNumber'); //ok.include: start(function)
const uploadPicToImgurByURL = require('./functions/UploadPicToImgurByURL'); //ok.include: start(function)
const ConnectDB = require('./functions/ConnectDB');//ok
const CallTimer = require('./functions/CallTimer');//ok

/* ================================================== My Functions Over ================================================== */
/* ================================================== Start My Program ================================================== */

// 不會寫入資料庫的變數
var msg_log = [], msg_log_UUID = [], msg_count = [], msg_countime_UUID = [];

// 獲取資料庫中的資料
var owners_notice = ConnectDB.readDB(DBref.indexOf('owners_notice') + 1);
var owners = ConnectDB.readDB(DBref.indexOf('owners') + 1);
var earthquake_last_know_time = ConnectDB.readDB(DBref.indexOf('earthquake_last_know_time') + 1);

// Message handler
async function MessageHandler(event) {
	console.log(event)

	var SourceData = {};
	SourceData.type = event.source.type;
	if (event.source.userId) { SourceData.userId = event.source.userId; }
	if (event.source.groupId) { SourceData.id = event.source.groupId; }
	if (event.source.roomId) { SourceData.id = event.source.roomId; }

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

	console.log(SourceData);

	switch (event.message.type) {
		case 'text':
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
		case 'join':
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
				LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + "\n日太加入了群組: " + event.source.groupId));
			}
			break;
		case 'leave':
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
				LineBotClient.pushMessage(owners_notice[i], MsgFormat.Text(UTC8Time.getNowTime() + "\n日太離開了群組: " + event.source.groupId));
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
			console.log('Source Msg: ' + event.message.text + ';Replyed: ' + replyMsg);
		}).catch(function (error) {
			console.log(error);
		});
	}
}

/* ================================================== My Program Over ================================================== */
/* ================================================== Start Other Functions ================================================== */

// 開機提醒
// setTimeout(function () {
// 	for (let i = 0; i < owners_notice.length; i++) {
// 		LineBotClient.pushMessage(owners_notice[i], UTC8Time.getNowTime() + "\n日太已啟動完成。");
// 		console.log('send: ' + owners_notice[i] + ";msg: " + UTC8Time.getNowTime() + "\n日太已啟動完成。");
// 	}
// }, 3000);