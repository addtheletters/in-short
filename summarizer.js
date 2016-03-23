var summarizer = summarizer || {};

// from lsi.js
var lsi = lsi || {};
// using numeric.js from http://www.numericjs.com/
var numeric = numeric || {};
// using js implementation of Porter Stemmer from https://github.com/kristopolous/Porter-Stemmer
var stemmer = stemmer || {};

(function(lib){

	lib.summarize = function(doc, length, dim){
		var sentences = lsi.splitSentences(doc);
		var tdm = lsi.createTDM(sentences);
		var svd = numeric.svd(tdm);
		var norm = Math.log(lsi.frobeniusNormOne(svd.S));
		var frdim = dim || lsi.chooseLowRank(tdm, svd);
		var reduced = lsi.lowRankApprox(tdm, frdim, svd);
		var ranking = lsi.rankDocs(reduced.svd, sentences);
		var important = ranking.filter((val, i)=>{return i<(length || norm)});
		console.log("unsorted important", important);
		important = important.sort( (a, b)=>{
			//console.log("b content index", sentences.indexOf(b.content));
			//console.log("a content index", sentences.indexOf(a.content));
			return sentences.indexOf(a.content) - sentences.indexOf(b.content);
		} );
		console.log("sorted important", important);

		var out = {};
		out.summary = "";
		for(var i = 0; i < important.length; i++){
			if(i>0) out.summary += " ";
			out.summary += important[i].content;
		}
		console.log(reduced);
		console.log(numeric.prettyPrint(reduced));

		out.sentences = sentences;
		out.tdm = tdm;
		out.norm = norm;
		out.reduced = reduced;
		out.ranking = ranking;
		out.original = doc;
		return out;
	};

	lib.useCurrentTabText = function( callback, ufunc ){
		var use_func = ufunc || function(x){return x};
		chrome.tabs.executeScript(null, {file: "content_grab.js"});
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendMessage(tab.id, message={method: "getText"}, sendResponse=function(response) {
			    if(response.method=="getText"){
		            alltext = response.data;
		            callback( use_func(alltext) );
		        }
			});
	    });
	};

	lib.summarizeCurrentTab = function( callback ){
		lib.useCurrentTabText( callback, lib.summarize );
	};

	lib.summarizeCurrentWithWorker = function( callback, length, dim ){
		lib.useCurrentTabText( function(result){
			lib.summarizeWithWorker.call( this, result, callback, length, dim );
		});
	}

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
