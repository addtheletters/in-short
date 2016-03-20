var lsi = lsi || {};

// using numeric.js from http://www.numericjs.com/
var numeric = numeric || {};

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
		    total += valueFunc(arr[i]);
		}
		return total;
	};

	lib.findTerms = function(text){
		return text.match(/\S+/g); // match non-whitespace
	};

	lib.weight = lib.weight || {};

	lib.weight.binary = function(value){
		if(value){
			return 1;
		}
		return 0;
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

	lib.weight.local.tfidf = function(tdm, row, col){
		return lib.weight.local.term_freq(tdm, row, col) * lib.weight.global.inv_doc_freq(tdm, row);
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
		console.log("dfi", lib.weight.global.dfi(tdm, row));
		console.log("num docs", tdm.COLS);
		return Math.log2(tdm.COLS / (1 + lib.weight.global.dfi(tdm, row)));
	};

	// the most commonly used global weight adjustment
	lib.weight.global.entropy = function(tdm, row) {
		var term_gfi = lib.weight.global.gfi(tdm, row);
		return 1 + lib.util.sum( tdm[row], (count)=>{
			var p = (count || 0) / term_gfi;
			console.log("p",p);
			console.log("p log", Math.log(p));
			console.log("num docs", tdm.COLS);
			console.log("num docs log", Math.log(tdm.COLS));
			// when p is zero, this result becomes NaN, perhaps should be interpreted as infinity
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
		
		for(var col = 0; col < docs.length; col++){
			var tms = lib.findTerms(docs[col]);
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
		return tdm;
	};

	lib.getLocalWeights = function(tdm, weight_func = lib.weight.local.term_freq){
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

})(lsi);
