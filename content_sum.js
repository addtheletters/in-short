chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse){
		if(message.method="getText"){
			sendResponse({data: document.body.innerText, method: "getText"});
		}
	}
);
