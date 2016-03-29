var summarizer = summarizer || {};

// from lsi.js
var lsi = lsi || {};
// using numeric.js from http://www.numericjs.com/
var numeric = numeric || {};
// using js implementation of Porter Stemmer from https://github.com/kristopolous/Porter-Stemmer
var stemmer = stemmer || {};

(function(lib){

	lib.summarize = function(doc, length, dim){

		var out = {};
		out.original  = doc;
		out.sentences = lsi.splitSentences(doc);
		out.tdm       = lsi.createTDM(out.sentences);
		out.svd       = numeric.svd(out.tdm);
		out.norm      = Math.log(lsi.frobeniusNormOne(out.svd.S));
		out.frdim     = dim || lsi.chooseLowRank(out.tdm, out.svd);
		out.reduced   = lsi.lowRankApprox(out.tdm, out.frdim, out.svd);
		out.ranking   = lsi.rankDocs(out.reduced.svd, out.sentences);
		out.important = out.ranking.filter((val, i)=>{return i<(length || out.norm)});
		out.summary   = "",

		//console.log("unsorted important", out.important);
		out.important = out.important.sort( (a, b)=>{
			//console.log("b content index", sentences.indexOf(b.content));
			//console.log("a content index", sentences.indexOf(a.content));
			return out.sentences.indexOf(a.content) - out.sentences.indexOf(b.content);
		} );
		//console.log("sorted important", out.important);

		for(var i = 0; i < out.important.length; i++){
			if(i>0) out.summary += " ";
			out.summary += out.important[i].content;
		}

		//console.log(out.reduced);
		//console.log(numeric.prettyPrint(out.reduced));
		return out;
	};

	lib.useCurrentTab = function(callback, ufunc, methodo){
		console.log("using current tab to do", methodo);
		var use_func = ufunc || function(x){return x};
		chrome.tabs.query(
			{currentWindow:true, active:true},
			function(tabs) {
				//console.log("for tabs, doing", callback, ufunc);
				chrome.tabs.executeScript(tabs[0].id, {file: "content_grab.js"}, function(cb){
					if(chrome.extension.lastError || cb === undefined){
						var errorMsg = chrome.extension.lastError.message;
				        var ret = {failed:true, msg:errorMsg};
						if (errorMsg == "Cannot access a chrome:// URL"){
				            ret.bad_url = true;
				        }
						callback(ret);
					}
				});

				if(methodo == "getReadableText"){
					//console.log("method is getReadableText");
					chrome.tabs.executeScript(tabs[0].id, {file: "lib/readabilitySAX/readabilitySAX.js"});
				}
				if(methodo == "getAPIResponse"){
					chrome.tabs.executeScript(tabs[0].id, {file: "loadAuthToken.js"});	
				}

				chrome.tabs.sendMessage(tabs[0].id, message={method: methodo},
					sendResponse=function(response) {
						//console.log("responding", response);
					    if(response.method==methodo){
				            content = response.data;
				            //console.log("got tab content", content)
				            callback( use_func(content) );
				        }
					}
				);
	    	}
	    );
	}

	lib.useCurrentTabText = function( callback, ufunc ){
		lib.useCurrentTab( callback, ufunc, "getText" );
	};

	lib.readablizeCurrent = function( callback ){
		//console.log("abusing current tab", callback);
		lib.useCurrentTab( callback, null, "getReadableText" );
	};

	lib.diffbotCurrent = function( callback ){
		lib.useCurrentTab( callback, null, "getAPIResponse" );
	};

	lib.summarizeCurrentTab = function( callback ){
		lib.useCurrentTabText( function(result){
			callback( lib.summarize(result) );
		});
	};

	lib.summarizeCurrentWithWorker = function( callback, length, dim ){
		lib.useCurrentTabText( function(result){
			lib.summarizeWithWorker.call( this, result, callback, length, dim );
		});
	};

	lib.summarizeWithWorker = function( alltext, callback, length, dim ){
		var time_elapsed = 0;
		var timer = setInterval(function(){time_elapsed ++; console.log("Time: ", time_elapsed);}, 1000);
		var sum_worker = new Worker("summary_worker.js");
		console.log("Starting worker.");
		sum_worker.onmessage = function(e){
			callback( e.data );
			sum_worker.terminate();
			sum_worker = undefined;
			clearInterval(timer);
			console.log("Worker completed work in", time_elapsed, "seconds");
		};
		sum_worker.postMessage( {text:alltext, summary_length:length||null, dimensions:dim||null} );
	};

})(summarizer);
