var linebot = require('linebot');
var express = require('express');
var dbTool = require('./db');
var classes = require('./classes');

var bot1 = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

const initialMessage = '目前僅支援鸚鵡班與一年孝班';

const checkContentAndReply = (event, classId) => {
    dbTool.findLastestContent(classId).then((content) =>{
      if (content.contentString){
        event.reply(content.contentString);
      }
    });

}

function registerCallback(bot, classId){

bot.on('message', function(event) {
    //console.log(event); //把收到訊息的 event 印出來看看
    if (event.message.type = 'text') {
        var msg = event.message.text;
        console.log('message ' + msg);
        var hit = false;
        if (msg.includes('關注')){

          for (var i in classes){
            if (msg.includes(classes[i].name)){
              dbTool.insertId(classes[i].id, event.source.userId);
              event.reply('已關注' + classes[i].name);
              checkContentAndReply(event, classes[i].id);
              hit = true;
            }
          }

          if (!hit){
            event.reply('要關注哪一班?');
          }
/*
          if (msg.includes('一年孝班')){
            dbTool.insertId('ECELE1B', event.source.userId);
            event.reply('已關注一年孝班');
            checkContentAndReply(event, 'ECELE1B');
          }
          else if (msg.includes('鸚鵡班')){
            dbTool.insertId('ECKID1C', event.source.userId);
            event.reply('已關注鸚鵡班');
            checkContentAndReply(event, 'ECKID1C');
          }
          else{
            event.reply('要關注哪一班?');
          }*/

        }

        else if (msg.includes('退訂')){
          if (msg.includes('一年孝班')){
            dbTool.removeId('ECELE1B', event.source.userId);
            event.reply('已退訂一年孝班');
          }
          else if (msg.includes('鸚鵡班')){
            dbTool.removeId('ECKID1C', event.source.userId);
            event.reply('已退訂鸚鵡班');
          }
          else{
            event.reply('要退訂哪一班?');
          }

        }
        else{
          event.reply(msg);
        }
    }
});

bot.on('follow', function(event) {
    console.log(event);
    //dbTool.insertId(classId, event.source.userId);
    //checkContentAndReply(event, classId);
});

bot.on('unfollow', function(event) {
    console.log(event);
    //dbTool.removeIdFromAllClass(event.source.groupId);
});

bot.on('join', function(event) {
    console.log(event);
    //dbTool.insertId(classId, event.source.groupId);
    //checkContentAndReply(event, classId);
});

bot.on('leave', function(event) {
    console.log(event);
    //dbTool.removeIdFromAllClass(event.source.groupId);

});

}

registerCallback(bot1, 'ECELE1B');

const app = express();
const linebotParser1 = bot1.parser();
app.post('/ECELE1B', linebotParser1);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
