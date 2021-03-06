var grabberLoaded;
var infoCache = infoCache || {};

if(!grabberLoaded){
	var getAPIUrl = function(token, url) {
	    return 'https://api.diffbot.com/v3/article?html&token=' + token + '&url=' + encodeURIComponent(url);
	};

	chrome.runtime.onMessage.addListener(
		function(message, sender, sendResponse){
			if(message.method=="getText"){
				sendResponse({data: document.body.innerText, method: "getText"});
				return;
			}
			if(message.method=="getReadableText"){
				//console.log("document is",document);
				var readable = new Readability(document, null, 1);
				var selected = {};
				selected.article = readable.getArticle();
				//selected.articleText = readable.getArticle().getText();
				//selected.textArticle = readable.getArticle("text");
				selected.text = readable.getText();
				selected.title = readable.getTitle();
				sendResponse({data: selected, method:"getReadableText"});
				return;
			}
			if(message.method=="getAPIResponse"){

				var errored = function( e ){
					//console.log("errored with", e);
					sendResponse({method:"getAPIResponse",
						data:{failed:true, reason:e}
					});
					return true; //false; if this errors, does it need to wait for async responses? maybe
				};

				var tkn = message.authToken || DIFFBOT_TKN;
				if(!tkn){
					return errored("no-token");
				}

				var xhr = new XMLHttpRequest();
				var apiUrl = getAPIUrl(tkn, document.URL || window.location.href);

				xhr.open("GET", apiUrl, true);
	            xhr.timeout = 40000;
	            xhr.responseType = "json";
	            xhr.onreadystatechange = function(){
	                if (xhr.readyState === 4) { // xhr completed
	                    var status = xhr.status;
	                    if (status === 200) {
	                    	var rsponse = xhr.response;
	                    	if('error' in rsponse){
	                    		return errored(rsponse.error);
	                    	}
	                    	if(!rsponse.objects || rsponse.objects.length <= 0){
	                    		return errored('bad response');
	                    	}
	                    	// when is this cached?
	                    	sendResponse( {data:rsponse.objects[0], method:"getAPIResponse"} );
	                    }
	                    else{
	                    	return errored("code " + status);
	                    }
	                }
	            };
	            xhr.ontimeout = function(){
	                return errored("timeout");
	            };
	            xhr.send(); 
				return true; // to allow for longer-term async, supposedly
			}
			if(message.method=="useCache"){
				var status = false;
				var retinfo = false;
				if(message.data && message.data.key){
					status = "ok";
					if(message.data.info){
						infoCache[message.data.key] = message.data.info;
						status = "updated";
					}
					retinfo = infoCache[message.data.key];
				}
				console.log("Content grab sent back cache response.");
				sendResponse({method:"useCache", data:{info:retinfo, status:status}});
				return;
			}
			// this then raises the question of, "Why isn't the summary worker just launched from the content script?"
			// to which I would reply
			// "I don't know but shouldn't the summarizer.js be doing the summarizing"
		}
	);

	grabberLoaded = true;
}
else{
	console.log("Attempted to reload grabber, already existed. Refresh the page?");
}
