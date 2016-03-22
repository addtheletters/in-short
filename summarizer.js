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
		var reduced = lsi.lowRankApprox(tdm, r_dim || norm, svd);
		var ranking = lsi.rankDocs(reduced.svd, sentences);
		var important = ranking.filter((val, i)=>{return i<(length || norm)});
		var out = "";
		for(var i = 0; i < important.length; i++){
			if(i>0) out += " ";
			out += important[i].content;
		}
		console.log(reduced);
		console.log(numeric.prettyPrint(reduced));
		return out;
	};
})(summarizer);
