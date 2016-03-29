// everyone loves global variables
var article_info	  = null;
var article_text      = null;
var done_readable_sum = false;
var done_raw          = false;
var summary_working   = false;

function enableIndicator( indicator_id, loadedText ){
	var replacetext = loadedText || "[loaded!]";
	var ld = document.getElementById(indicator_id);
    ld.innerHTML = replacetext;
    ld.classList.remove("disabled");
    ld.classList.add("enabled");
    return ld;
}

// for god's sake, sanitize loadedText 
function hideLoadIndicator( indicator_id, loadedText ){
	var ld = enableIndicator(indicator_id, loadedText)
    setTimeout( function(){ ld.classList.add("faded") }, 1000 );
    return ld;
}

function hide( indicator_id ){
	var ld = document.getElementById(indicator_id);
	ld.classList.add("transitive");
	ld.classList.add("faded");
	setTimeout( function(){ld.classList.add("gone")}, 1000 );
}

function fillContent( container_id, content ){
	var elm = document.getElementById(container_id);
	elm.innerHTML = content;
	elm.classList.remove("faded");
}

function requestCurrentSummary(){
	summarizer.summarizeCurrentWithWorker( onSummaryDone );
}

function requestSummary( text ){
	summarizer.summarizeWithWorker( text, onSummaryDone );
}

function onSummaryDone( summary_data ){
	summary_working = false;
	var sb = document.getElementById("summary-button")
	sb.classList.remove("disabled");
	if(!done_readable_sum){
		done_readable_sum = true;
		enableIndicator( "summary-button", "Done! Redo with raw page text contents?");
	}
	else{
		done_raw = true;
		enableIndicator( "summary-button", "Done! Based on raw text; may contain strangeness." );
		sb.onclick = function(){};
		sb.onmouseover = function(){};
	}
	fillContent( "summary-p", summary_data.summary );
}

function useCurrentURL( callback ){
	chrome.tabs.query(
		{currentWindow:true, active:true},
		function(tabs){
			callback(tabs[0].url);
		}
	);
}

function requestReadable(){
	summarizer.readablizeCurrent( onReceiveReadable );
}

function onReceiveReadable( readable_info ){
	if(!readable_info || readable_info.failed){
		fillContent('finding-text-indicator', '[Failed to find readable text.]');
		activateSummaryButton( readable_info );
		return;
	}

	article_info = readable_info;
	//console.log(article_info);
	article_text = article_info.text;
	enableIndicator('finding-text-indicator', '[Readable text found! '+article_text.match( /(\([^\(\)]+\))|([^\r\n.!?]+(([.!?]+"?'?)|$))/gim ).length+' sentences.]');
	activateSummaryButton( true );
}

function requestDiffbot(){
	summarizer.diffbotCurrent( onReceiveDiffbot );
}

function onReceiveDiffbot( diffbot_objects ){
	console.log(diffbot_objects);
	if(!diffbot_objects || diffbot_objects.failed){
		var err = diffbot_objects.failed ?  '('+diffbot_objects.reason+')' : "";
		fillContent('finding-text-indicator', '[Failed to get Diffbot analysis. ' + err + ']');
		activateSummaryButton( diffbot_objects );
		return;
	}
	console.log(diffbot_objects);
}

// var INFO_GATHER_FAILED_NORE = "Failed to gather article information (API did not respond).";

// function requestArticleInfo(){
// 	console.log("attempting request");
// 	useCurrentURL( 
// 		function( retreived_url ){
// 			console.log("using url", retreived_url);
// 			//
// 		}
// 	);
// }


// function onInfoGathered( response ){
// 	console.log("Received response!", response);
// }
// 


function activateSummaryButton( readable ){
	var summary_button = document.getElementById("summary-button");

	if(readable.failed){
		if(readable.bad_url){
			summary_button.innerHTML = "This page cannot be summarized.";
			summary_button.classList.add("disabled");
			return;
		}
		else{
			summary_button.innerHTML = "Summarize with raw text content!";
			done_readable_sum = true;
		}
	}
	else{
		summary_button.innerHTML = "Summarize readable text!";
	}

	summary_button.onmouseover = function(){
		if(!summary_working){
			summary_button.classList.add("hovering");
		}
		else{
			summary_button.classList.add("disabled");
		}
	};

	summary_button.onmouseout = function(){
		summary_button.classList.remove("disabled");
		summary_button.classList.remove("hovering");
	}

	summary_button.onclick = function(){
		if(summary_working){
			return;
		}

		if(done_readable_sum){
			requestCurrentSummary();
			summary_working = true;
			summary_button.classList.remove("enabled");
			fillContent("summary-button", "Summarizing...");
		}
		else if(article_text){
			requestSummary(article_text);
			summary_working = true;
			fillContent("summary-button", "Summarizing...");
		}
		else{
			fillContent("summary-button", "No article text has been found. Try the raw text?");
			done_readable_sum = true;
		}
		//requestArticleInfo();
		//requestSummary("HELLO SIR! MY NAME IS BOB. I HAVE A CAT. HE LIKES TO MEOW. MEOW MEOW MIX IS MY FAVORITE CAT FOOD. I AM DEFINITELY NOT A CAT.");
		//function(){hideLoadIndicator('diffbot-query-indicator', '[Response received!]')};
	}
};

document.addEventListener('DOMContentLoaded', function(){
	//requestReadable();
	requestDiffbot();
});
