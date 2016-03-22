var summarizer = summarizer || {};

// from lsi.js
var lsi = lsi || {};
// using numeric.js from http://www.numericjs.com/
var numeric = numeric || {};
// using js implementation of Porter Stemmer from https://github.com/kristopolous/Porter-Stemmer
var stemmer = stemmer || {};

(function(lib){
	lib.summarize = function(doc, length, r_dim){
		var sentences = lsi.splitSentences(doc);
		var tdm = lsi.createTDM(sentences);
		var svd = numeric.svd(tdm);
		var norm = Math.log(lsi.frobeniusNormOne(svd.S));
		var frdim = r_dim || lsi.chooseLowRank(tdm, svd);
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
		out.string = "";
		for(var i = 0; i < important.length; i++){
			if(i>0) out.string += " ";
			out.string += important[i].content;
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

	lib.useCurrentTabText = function( callback, use_func ){
		chrome.tabs.executeScript(null, {file: "content_sum.js"});
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

})(summarizer);
