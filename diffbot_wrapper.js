var DIFFBOT_URL = "http://api.diffbot.com/v3/article";
var DIFFBOT_TOKEN = DIFFBOT_TOKEN || "LOL";

function requestArticleInfo(callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', DIFFBOT_URL, true);
	xhr.send();
}

function concatArguments(args){
	// crap I looked on github and diffbot already has a good js client LOL
}
