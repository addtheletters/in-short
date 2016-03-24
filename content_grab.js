chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse){
		if(message.method=="getText"){
			sendResponse({data: document.body.innerText, method: "getText"});
		}
		if(message.method=="getReadableText"){
			//console.log("document is",document);
			var readable = new Readability(document, null, 2);
			sendResponse({data: readable.getArticle().getText(), method:"getReadableText"});
		}
		// I guess this should be implemented at some point for proper summaries
		if(message.method=="getAPIResponse"){
			sendResponse({data: "UNIMPLEMENTED", method: "getAPIResponse"});
		}
	}
);
