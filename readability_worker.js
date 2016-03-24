importScripts("lib/readabilitySAX/readabilitySAX.js");

var DEFAULT_SKIPLEVEL = 3;

onmessage = function(event){
	var settings = Object(null);
	settings['cleanAttributes'] = false;
	var edata = event.data;
	var readable = new Readability(edata.doc, settings, edata.skiplevel || DEFAULT_SKIPLEVEL);
	var article = readable.getArticle(false);
	postMessage( article );
};
