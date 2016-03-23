
// for god's sake, sanitize loadedText 
function hideLoadIndicator( indicator_id, loadedText ){
	var replacetext = loadedText || "[loaded!]";
	var ld = document.getElementById(indicator_id);
    ld.innerHTML = replacetext;
    ld.classList.remove("disabled");
    ld.classList.add("enabled");
    setTimeout( function(){ ld.classList.add("faded") }, 1500 );
    //setTimeout( function(){ ld }, 4000 )
}

document.addEventListener('DOMContentLoaded', function(){
	document.getElementById("summary-button").onclick = function(){hideLoadIndicator('diffbot-query-indicator', '[Response received!]')};
});
