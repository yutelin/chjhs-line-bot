var Crawler = require('js-crawler');
var he = require('he');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var dbTool = require('./db');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});
var classes = require('./classes');

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

const crawl = (url) =>{
    return new Promise((resolve, reject) => {
        crawler.crawl({
            url: url,
            success: (page) => resolve(page),
            failure: (page) => reject(page)
        });
    });
};


const getSelector = (page) => {
    return new Promise((resolve, reject) => {

        const html = page.content.toString();
        const selector = Cheerio.load(html);
        resolve(selector);
    });
};

const checkHasContent = (selector) => {
    return new Promise((resolve, reject) =>{
        const lis = selector('div.ecbookdetail li');
        if (lis.length > 0){
            resolve(selector);
        }
        else{
            throw new Error('no content!');
        }
    });

};

const getContent = (selector, className) => {
    return new Promise((resolve, reject) =>{
        var resultString = '';

        //get the day string
        const mon = selector('div.todayarea .mm');
        const day = selector('div.todayarea .dd');
        var dayString = selector(mon[0]).text() + ' ' +  selector(day[0]).text();
        resultString = className + ' ' + dayString + '\n';

        const result = selector('div.ecbookdetail li,h5');
        for(i=0;i<result.length;i++) {
            console.log(result[i].name);
            //insert change line before header
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
            selector('i').remove();
            //resultString += selector(result[i]).text().replaceAll('[\t]' ,'') + '\n';
            
            //convert <br> to change line
            resultString += he.decode(selector(result[i]).html()).replaceAll('<br>' ,'\n\n') + '\n';
            //insert change line after header
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
        }
        console.log(resultString);

        resolve({dayString: dayString, contentString: resultString});
    });
};

function crawlTheUrl(url, classId, className, bot){
    return crawl(url)
    .then((page) => {
        return getSelector(page);
    })
    .then((selector) =>{
        return checkHasContent(selector);
    })
    .then((selector) => {
        return getContent(selector, className);
    })
    .then((content) => {
        
        console.log(content);


            return dbTool.findLastestContent(classId).then((contentObject) =>{

                /*if ((contentObject) && (contentObject.dayString == content.dayString)){
                    console.log('this content already exist in db'); 
                }
                else if ((!contentObject) || (contentObject.dayString != content.dayString)){
                 */   
                    // clean old content and insert new day
                    dbTool.cleanContentDb(classId); 

                    dbTool.insertContent(classId, content.dayString, content.contentString);

                    // send content to each id
                    return dbTool.findId(classId).then((ids)=>{
                        console.log('send to ' + ids);
                        return bot.multicast(ids, content.contentString);
                        /*for (i in ids){
                            console.log('send to ' + ids[i]);
                            bot.push(ids[i], content.contentString);
                        }*/
                    });


                //}

            });


    })
    .catch((err) => console.log(err.message));
}

require('dotenv').config();
var bot = linebot({
            channelId:  process.env.ChannelId,
            channelSecret:  process.env.ChannelSecret,
            channelAccessToken:  process.env.ChannelAccessToken
        });


crawlTheUrl(classes[0].url, classes[0].id, classes[0].name, bot).then(() =>{
  crawlTheUrl(classes[1].url, classes[1].id, classes[1].name, bot).then((json)=>{dbTool.endDb()});
});
