chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse){
		if(message.method=="getText"){
			sendResponse({data: document.body.innerText, method: "getText"});
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
		}
		// I guess this should be implemented at some point for proper summaries
		if(message.method=="getAPIResponse"){
			sendResponse({data: "UNIMPLEMENTED", method: "getAPIResponse"});
		}
	}
);
