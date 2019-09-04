var linebot = require('linebot');
var express = require('express');
var dbTool = require('./db');
var classes = require('./classes');

require('dotenv').config();
var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

const initialMessage = '目前僅支援大象班，綿羊班，長頸鹿班，蝴蝶班與三年級所有班級\n'
                        +'請問你要關注哪一班\n'
                        +'請用"小幫手我要關注" 或 "小幫手我要退訂" 加上班級名稱來關注或退訂聯絡簿'
                        ;

const checkContentAndReply = (event, classId, className) => {
    dbTool.findLastestContent(classId).then((content) =>{
      if (content){
        event.reply(content.contentString);
      }
      else{
        event.reply('已關注' + className);
      }
    });

}


bot.on('message', function(event) {
    //console.log(event); //把收到訊息的 event 印出來看看
    var targetId = event.source.groupId? event.source.groupId : event.source.userId;
    if (event.message.type = 'text') {
        var msg = event.message.text;
        console.log('message ' + msg);
        var hit = false;
        if (msg && msg.includes('小幫手我要')){
          if (msg.includes('關注')){

            for (var i in classes){
              if (msg.includes(classes[i].name)){
                dbTool.insertId(classes[i].id, targetId);
                checkContentAndReply(event, classes[i].id, classes[i].name);
                hit = true;
              }
            }
            if (!hit){
              event.reply('要關注哪一班?');
            }
          }
          else if (msg.includes('退訂')){

            for (var i in classes){
              if (msg.includes(classes[i].name)){
                dbTool.removeId(classes[i].id, targetId);
                event.reply('已退訂' + classes[i].name);
                hit = true;
              }
            }
            if (!hit){
              event.reply('要退訂哪一班?');
            }
          }
        }
    }
});

bot.on('follow', function(event) {
    console.log(event);
    event.reply(initialMessage);
});

bot.on('unfollow', function(event) {
    console.log(event);
    dbTool.removeIdFromAllClass(event.source.userId);
});

bot.on('join', function(event) {
    console.log(event);
    event.reply(initialMessage);
});

bot.on('leave', function(event) {
    console.log(event);
    dbTool.removeIdFromAllClass(event.source.groupId);

});


const app = express();
const linebotParser1 = bot.parser();
app.post('/', linebotParser1);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
