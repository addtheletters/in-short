importScripts("lib/numeric-1.2.6.min.js", "lib/PorterStemmer1980.min.js", "lsi.js", "summarizer.js" );

onmessage = function(event){
	postMessage( summarizer.summarize( event.data.text, event.data.summary_length || null, event.data.dimensions || null ) );
};
