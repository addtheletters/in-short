var lsi = lsi;
if(!lsi){
	console.log("Error: Event page failed to find LSI library.");
}

chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse){
		if(message.method="runSummary"){
			var summaryOutput =  "";
			sendResponse({data:summaryOutput , method: "runSummary"});
		}
	}
);
