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

	lib.findTerms = function(text){
		return text.match(/\S+/g); // match non-whitespace
	};

	lib.weight = lib.weight || {};

	lib.weight.binary = function(tdm, row, col){
		if(tdm[row][col]){
			return 1;
		}
		return 0;
	};

	lib.weight.term_freq = function(tdm, row, col){
		return tdm[row][col] || 0;
	};

	lib.weight.log = function(tdm, row, col){
		return Math.log((tdm[row][col] || 0) + 1);
	};

	lib.weight.normal = function(tdm, row, col){
		
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
		
		for(var i = 0; i < docs.length; i++){
			var tms = lib.findTerms(docs[i]);
			allterms = lib.util.ordUnion(allterms, tms);
			var count = lib.countTerms(tms);
			//var local_weight = lib.weighTerms(tms, lib.weight.log);
			//console.log("weight",local_weight);

			for(var j = 0; j < tms.length; j++){
				var row = allterms.indexOf(tms[j]);
				if(typeof tdm[row] === "undefined"){
					tdm[row] = [];
				}
				tdm[row][i] = count[tms[j]]
			}
		}

		tdm.MAT_ROWS = allterms.length;
		tdm.MAT_COLS = docs.length;
		return tdm;
	};

	lib.getWeights = function(tdm, weight_func = lib.weight.term_freq){
		var lwm = []
		for(var i = 0; i < tdm.MAT_ROWS; i++){
			lwm[i] = [];
			for(var j = 0; j < tdm.MAT_COLS; j++){
				lwm[i][j] = weight_func(tdm, i, j);
			}
		}
		return lwm;
	};

})(lsi);
