var DIFFBOT_TOKEN = "DEFINITELY NOT A TOKEN";

// for god's sake, sanitize loadedText 
function hideLoadIndicator( indicator_id, loadedText ){
	var replacetext = loadedText || "[loaded!]";
	var ld = document.getElementById(indicator_id);
    ld.innerHTML = replacetext;
    ld.classList.remove("disabled");
    ld.classList.add("enabled");
    setTimeout( function(){ ld.classList.add("faded") }, 1000 );
}

function fillContent( container_id, content ){
	var elm = document.getElementById(container_id);
	elm.innerHTML = content;
	elm.classList.remove("faded");
}

function requestSummary( text ){
	summarizer.summarizeWithWorker( text, onSummaryDone );
}

function onSummaryDone( summary_data ){
	fillContent( "summary-box", summary_data.summary );
}

function useCurrentURL( callback ){
	chrome.tabs.query(
		{currentWindow:true, active:true},
		function(tabs){
			callback(tabs[0]);
		}
	);
}

var INFO_GATHER_FAILED = "Failed to gather article information.";

function requestArticleInfo(){
	useCurrentURL( 
		function( retreived_url ){
			var client = new Diffbot(DIFFBOT_TOKEN);
			client.article.get({
					url:retreived_url, // encodeURIComponent(retreived_url);
				},
				onInfoGathered,
				function onError(response){
					console.log(INFO_GATHER_FAILED);
					fillContent("page-info", INFO_GATHER_FAILED);
				}
			);
		}
	);
}

function onInfoGathered( response ){

}

document.addEventListener('DOMContentLoaded', function(){
	document.getElementById("summary-button").onclick = function(){
		requestSummary("HELLO SIR! MY NAME IS BOB. I HAVE A CAT. HE LIKES TO MEOW. MEOW MEOW MIX IS MY FAVORITE CAT FOOD. I AM DEFINITELY NOT A CAT.");
		//function(){hideLoadIndicator('diffbot-query-indicator', '[Response received!]')};
	}
});
