chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse){
		if(message.method="getText"){
			sendResponse({data: document.body.innerText, method: "getText"});
		}

		// I guess this should be implemented at some point for proper summaries
		if(message.method="getAPIResponse"){
			sendResponse({data: "UNIMPLEMENTED", method: "getAPIResponse"});
		}
	}
);
