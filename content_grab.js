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
		// I guess this should be implemented at some point for proper summaries
		if(message.method=="getAPIResponse"){

			var errored = function(reason){
				sendResponse({failed:true, method:"getAPIResponse", reason:reason});
			};

			var tkn = message.data.authToken || DIFFBOT_TKN;
			if(!tkn){
				errored("no-token");
			}

			var xhr = new XMLHttpRequest();
			var apiUrl = getAPIUrl();

			xhr.open("GET", apiUrl, true);
            xhr.timeout = 40000;
            xhr.responseType = "json";
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) { // xhr completed
                    var status = xhr.status;
                    if (status === 200) {
                    	var rsponse = JSON.parse(xhr.response);
                    	if('error' in rsponse || !rsponse.objects || rsponse.objects.length <= 0){
                    		errored('bad response');
                    	}
                    	sendResponse( {data:rsponse.objects, method:"getAPIResponse"} );
                        // var _resp = JSON.parse(xhr.responseText);
                        // if (!('error' in _resp)
                        //         && 'objects' in _resp
                        //         && _resp['objects'].length > 0) {
                        //     var articles = [];
                        //     for (var i = 0; i < _resp['objects'].length; i++) {
                        //         var object = _resp['objects'][i];
                        //         if ('type' in object && object['type'] === 'article') {
                        //             articles.push(object);
                        //         }
                        //     }
                        //     if (articles.length > 0) {
                        //         var article = articles[0];
                        //         sendResponse({data:article, method:"getAPIResponse"});
                        //     }
                        // }
                    }
                    else{
                    	errored("code " + status);
                    }
                }
            };
            xhr.ontimeout = function () {
                errored("timeout");
            };
            xhr.send();
			//sendResponse({data: "UNIMPLEMENTED", method: "getAPIResponse"});
		}
	}
);
