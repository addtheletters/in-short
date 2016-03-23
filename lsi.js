var lsi = lsi || {};

// using numeric.js from http://www.numericjs.com/
var numeric = numeric || {};
// using js implementation of Porter Stemmer from https://github.com/kristopolous/Porter-Stemmer
var stemmer = stemmer || {};

(function(lib){

	lib.util = lib.util || {};

	lib.util.ordUnion = function(a1, a2) {
	    var ret = [];
	    var arr = a1.concat(a2);
	    var ind = arr.length;
	    var assoc = {};
	    while(ind--) {
	        var itm = arr[arr.length-1-ind];
	        if(!assoc[itm]) {
	            ret.push(itm);
	            assoc[itm] = true;
	        }
	    }
	    return ret;
	};

	lib.util.sum = function( arr, valueFunc ){
		valueFunc = valueFunc || ((item) => item || 0);
		var total = 0;
		for(var i = 0, n = arr.length; i < n; ++i ){
		    total += valueFunc(arr[i], i, arr);
		}
		return total;
	};

	lib.findTerms = function(text, dict){
		return lib.stemWords(
			text.match(/\S+/g),	// match non-whitespace
			dict
		); 
	};

	lib.stemWords = function(words, dict){
		var stems = [];
		var stem_dict = dict || {};
		for(var i = 0; i < words.length; i++){
			stems.push( stemmer(words[i]).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") ); // remove punctuation from stems
			if(!stem_dict[stems[i]] || stem_dict[stems[i]].length > words[i].length){
				stem_dict[stems[i]] = words[i];
				//console.log(words[i]);
			}
		}
		stems.dict = stem_dict;
		return stems;
	};

	lib.splitSentences = function(str){
		// /[^\.!\?]+[\.!\?$]+/g  // previous regex doing just pre-punctuation bits
		// matches sentences ended with normal punctuation, isolated parentheticals with no punctuation nearby,
		// independent lines lacking punctuation, and anything left before the end
		return str.match( /(\([^\(\)]+\))|([^\r\n.!?]+(([.!?]+"?'?)|$))/gim ).map( (stnce)=>( stnce.replace(/\s+/g, " ").trim()) ).filter( (val)=>(val) );
	};

	lib.weight = lib.weight || {};

	lib.weight.debug = function(){
		return 2;
	}

	lib.weight.binary = function(value){
		if(value){
			return 1;
		}
		return 0;
	};

	lib.weight.getCompositeFunc = function(local_func, global_func){
		return (tdm, row, col)=>(local_func(tdm, row, col) * global_func(tdm, row));
	};

	lib.weight.local = lib.weight.local || {};

	lib.weight.local.binary = function(tdm, row, col){
		return this.weight.binary(tdm[row][col]);
	};

	// frequency: how many times does this term appear in each document
	lib.weight.local.term_freq = function(tdm, row, col){
		return tdm[row][col] || 0;
	};

	// the most commonly used local weight adjustment
	lib.weight.local.log = function(tdm, row, col){
		return Math.log((tdm[row][col] || 0) + 1);
	};

	lib.weight.global = lib.weight.global || {};

	lib.weight.global.binary = function(tdm, row){
		return 1;
	};

	lib.weight.global.normal = function(tdm, row){
		return 1 / Math.sqrt( lib.util.sum(tdm[row], (count)=>((count * count) || 0) ) );
	};

	// global freqeuncy: how many times does this term appear in all documents
	lib.weight.global.gfi = function(tdm, row){
		return lib.util.sum( tdm[row] );
	};

	// document frequency: in how many documents does this term appear
	lib.weight.global.dfi = function(tdm, row){
		return lib.util.sum( tdm[row], lib.weight.binary );
	};

	// aka idf, inverse document frequency, name made longer to avoid accidents with dfi
	lib.weight.global.inv_doc_freq = function(tdm, row){
		//console.log("dfi", lib.weight.global.dfi(tdm, row));
		//console.log("num docs", tdm.COLS);
		return Math.log2(tdm.COLS / (1 + lib.weight.global.dfi(tdm, row)));
	};

	lib.weight.local.tfidf = lib.weight.getCompositeFunc(lib.weight.local.term_freq, lib.weight.global.inv_doc_freq);

	// the most commonly used global weight adjustment
	lib.weight.global.entropy = function(tdm, row) {
		var term_gfi = lib.weight.global.gfi(tdm, row);
		// console.log("term gfi", term_gfi);
		return 1 + lib.util.sum( tdm[row], (count)=>{
			// console.log("tfi", count);
			var p = (count || 0) / term_gfi;
			if(p == 0){
				return 0;
			}
			// console.log("p",p);
			// console.log("p log", Math.log(p));
			// console.log("num docs", tdm.COLS);
			// console.log("num docs log", Math.log(tdm.COLS));
			// when p is zero or infinity, this result becomes NaN, perhaps should be interpreted as infinity
			return p * Math.log(p) / Math.log( tdm.COLS );
		} );
	};

	lib.countTerms = function(terms){
		var count = {};
		for(var i = 0; i < terms.length; i++){
			if(typeof count[terms[i]] === "undefined"){
				count[terms[i]] = 0;
			}
			count[terms[i]] += 1;
		}
		return count;
	};

	// lib.weighTerms = function(terms, weight_func = lib.weight.term_freq){
	// 	var count = lib.countTerms(terms);
	// 	var weight = {};
	// 	for(var term in count){
	// 		if(!count.hasOwnProperty(term)) continue;
	// 		weight[term] = weight_func(count[term]);
	// 	}
	// 	return weight;
	// };

	lib.createTDM = function(docs) {
		var allterms = [];
		var tdm = [];
		var stem_dict = {};
		
		for(var col = 0; col < docs.length; col++){
			var tms = lib.findTerms(docs[col], stem_dict);
			docs[col].DOC_TERMS = tms;

			allterms = lib.util.ordUnion(allterms, tms);
			var count = lib.countTerms(tms);
			//var local_weight = lib.weighTerms(tms, lib.weight.log);
			//console.log("weight",local_weight);
			for(var row = 0; row < allterms.length; row++){
				if(typeof tdm[row] === "undefined"){
					tdm[row] = new Array( docs.length ).fill(0); // this is slow
				}
				tdm[row][col] = count[allterms[row]] || 0;
			}
		}

		tdm.ROWS = allterms.length; // number of terms
		tdm.COLS = docs.length;		// number of documents
		tdm.TERMS = allterms;		// attach the terms (yay javascript)
		tdm.DOCS = docs;			// attach the docs
		tdm.STEM_WORD_LOOKUP = stem_dict;
		//console.log(stem_dict);
		return tdm;
	};

	lib.getLocalWeights = function(tdm, weight_func = lib.weight.local.log){
		var lwm = [];
		for(var i = 0; i < tdm.ROWS; i++){
			lwm[i] = [];
			for(var j = 0; j < tdm.COLS; j++){
				lwm[i][j] = weight_func(tdm, i, j);
			}
		}
		return lwm;
	};

	lib.getGlobalWeights = function(tdm, weight_func = lib.weight.global.entropy){
		var weights = [];
		for(var i = 0; i < tdm.ROWS; i++){
			weights[i] = weight_func(tdm, i);
		}
		return weights;
	};

	lib.applyWeights = function(tdm, lwf = lib.weight.local.log, gwf = lib.weight.global.entropy){
		// console.log("local func is", lwf);
		// console.log("global func is", gwf);
		// console.log("composite func is", lib.weight.getCompositeFunc(lwf,gwf));
		// console.log("local weights after are", numeric.prettyPrint(lib.getLocalWeights(tdm, lib.weight.getCompositeFunc(lwf, gwf))));
		return lib.getLocalWeights(tdm, lib.weight.getCompositeFunc(lwf, gwf));
	};

	lib.chooseLowRank = function(tdm, svd){
		var norm = Math.log(lib.frobeniusNormOne(svd.S));
		return Math.max(norm, norm * Math.min(tdm.DOCS.length / 200, 5) );
	};

	lib.lowRankApprox = function(matrix, rank, svd){
		if(rank <= 0){
			console.log("rank for low rank approximation is invalid or zero");
			return;// new Array(rank).fill([]);	
		}
		var decomp = svd || numeric.svd( matrix );
		var reduced;
		decomp.Ut = numeric.transpose(decomp.U);
		decomp.Vt = numeric.transpose(decomp.V);
		var rsvd = {S:[], U:[], Ut:[], V:[], Vt:[]};
		if(rank >= decomp.S.length){
			console.log("rank is larger than original rank");
		}
		for(var i = 0; i < decomp.S.length && i < rank; i++){
			rsvd.S.push( decomp.S[i] );
			rsvd.Ut.push( decomp.Ut[i] );
			rsvd.Vt.push( decomp.Vt[i] );
		}
		rsvd.U = numeric.transpose(rsvd.Ut);
		rsvd.V = numeric.transpose(rsvd.Vt);
		// console.log("v transpose", numeric.prettyPrint(numeric.transpose(rsvd.V)));
		// console.log("s diagonal", numeric.prettyPrint(numeric.diag(rsvd.S)));
		// console.log("first product", numeric.prettyPrint(numeric.dot( numeric.diag(rsvd.S), numeric.transpose(rsvd.V) )));
		reduced = numeric.dot( rsvd.U, numeric.dot( numeric.diag(rsvd.S), rsvd.Vt ));
		reduced.svd = rsvd;
		//console.log("original", numeric.prettyPrint(decomp));
		//console.log("reduced", numeric.prettyPrint(rsvd));
		return reduced;
	};

	lib.identifyContent = function(to_id, contents){
		for(var i = 0; i < to_id.length; i++){
			to_id[i].content = contents[to_id[i].index];
		}
	};

	lib.frobeniusNormFunc = function(multiplier, sigma){
		return (k)=>Math.sqrt(lib.util.sum(multiplier[k], (val,i)=>( val * val * sigma[i] * sigma[i])));
	};

	lib.frobeniusNormOne = function(sigma){
		return Math.sqrt(lib.util.sum(sigma, (val)=>(val * val)));
	};

	// based on method outlined here:
	// http://www.kiv.zcu.cz/~jstein/publikace/isim2004.pdf
	lib.rankDocs = function(decomp, docs){
		return lib._globalRank(decomp, docs, lib.frobeniusNormFunc(decomp.V, decomp.S));		
	};

	lib.rankTerms = function(decomp, terms, sw_lookup){
		var gr = lib._globalRank(decomp, terms, lib.frobeniusNormFunc(decomp.U, decomp.S));
		if(sw_lookup){
			for(var i = 0; i < gr.length; i++){
				gr[i].original = sw_lookup[gr[i].content];
				//console.log(gr[i].content);
				//console.log(sw_lookup[gr[i].content]);
			}
		}
		return gr;
	};

	lib._globalRank = function(decomp, terms, val_func){
		var ranks = [];
		for(var k = 0; k < terms.length; k++){
			ranks.push( {
				val: val_func(k),//Math.sqrt( lib.util.sum(decomp.V[k], (val,i)=>( val * val * decomp.S[i] * decomp.S[i])) ),
				index:k,
				content:null
			} );
		}
		if(terms){
			lib.identifyContent(ranks, terms);
		}
		return ranks.sort((a,b)=>(a.val-b.val)).reverse();
	};

})(lsi);
