var lsi = lsi || {};

function test_ordunion(){
	var a1 = [1, 2, 3];
	var a2 = [3, 4, 6, 5, 1, 2, 6, 4];
	console.log(lsi.util.ordUnion(a1, a2));
	return lsi.util.ordUnion(a1, a2);
}

function test_tdm(){
	var docs = [
		" r by r singular values matrix S, and a n by r concept-document vector matrix, D, which satisfy the following relations:",
		" S is a computed r by r diagonal matrix of decreasing singular values, and D is a computed n by r matrix of document vectors.",
		" and other undesirable artifacts of the original space of A. This reduced set of matrices is often denoted with a modified formula such as:"
	];
	return lsi.createTDM(docs);
}

function test_lwm(){
	return lsi.getLocalWeights(test_tdm(), lsi.weight.local.log);
}

function test_gwm(){
	return lsi.getGlobalWeights(test_tdm(), lsi.weight.global.gfi);
}

function test_svd(){
	return numeric.svd(test_tdm());
}

function test_tdidf(){
	var tdm    = test_tdm();
	var tf     = lsi.getLocalWeights(tdm);
	var idf    = lsi.getGlobalWeights(tdm, lsi.weight.global.inv_doc_freq);
	var tfidf  = lsi.getLocalWeights(tdm, lsi.weight.local.tfidf);
	console.log(numeric.prettyPrint(tf));
	console.log(numeric.prettyPrint(idf));
	return tfidf;
}

function render(lsi_info_out){
	document.getElementById('lsi-status').textContent = lsi_info_out;
}

document.addEventListener('DOMContentLoaded', function() {
	var report = "";
	var result = test_tdidf();//test_lwm();
	console.log(numeric.prettyPrint(result));
	report     += numeric.prettyPrint(result);
	render(report);
});
