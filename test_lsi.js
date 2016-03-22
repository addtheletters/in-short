var lsi = lsi || {};

function test_ordunion(){
	var a1 = [1, 2, 3];
	var a2 = [3, 4, 6, 5, 1, 2, 6, 4];
	console.log(lsi.util.ordUnion(a1, a2));
	return lsi.util.ordUnion(a1, a2);
}

function test_tdm(){
	var docs = [
		"Cat ran over the shiddly bat wat mat",
		"Cat had the value of matrix n ranked as a banana",
		"lol singular values are made of cheese and banana pudding is delicious. Did I tell you the relations satisfied by the vectors are bad?",
		"r by r singular values matrix S, and a n by r concept-document vector matrix, D, which satisfy the following relations:",
		"banana S is a computed r by r diagonal matrix of decreasing singular values, and D is a computed n by r matrix of document vectors.",
		"banana and other undesirable artifacts of the original space of A. This reduced set of matrices is often denoted with a modified formula such as:",
		"To do the latter, you must first translate your query into the low-dimensional space. It is then intuitive the same transformation",
		"Note here that the inverse of the diagonal matrix may be found by inverting each nonzero value within the matrix."
	];
	return lsi.createTDM(docs);
}

function test_lwm(itdm){
	return lsi.getLocalWeights(itdm || test_tdm(), lsi.weight.local.log);
}

function test_gwm(itdm){
	return lsi.getGlobalWeights(itdm || test_tdm(), lsi.weight.global.gfi);
}

function test_svd(itdm){
	return numeric.svd(itdm || test_tdm());
}

function test_tdidf(itdm){
	var tdm    = itdm || test_tdm();
	var tf     = lsi.getLocalWeights(tdm);
	var idf    = lsi.getGlobalWeights(tdm, lsi.weight.global.inv_doc_freq);
	var tfidf  = lsi.getLocalWeights(tdm, lsi.weight.local.tfidf);
	//console.log(numeric.prettyPrint(tf));
	//console.log(numeric.prettyPrint(idf));
	return tfidf;
}

function test_rsvd(itdm){
	var tdm = itdm || test_tdm();
	var gw = lsi.getGlobalWeights(tdm);
	var lw = lsi.getLocalWeights(tdm);
	// console.log("global");
	// console.log(numeric.prettyPrint(gw));
	// console.log("local");
	// console.log(numeric.prettyPrint(lw));
	//return lsi.applyWeights( tdm );
	return lsi.lowRankApprox( lsi.applyWeights( test_tdm() ), Math.ceil( Math.log(test_norm()) ) );
}

function test_rank(itdm){
	var tdm = itdm || test_tdm();
	var decomp = test_rsvd(tdm).svd;
	var ret = lsi.rankDocs(decomp, tdm.DOCS);//lsi.rankTerms(decomp, tdm.TERMS, tdm.STEM_WORD_LOOKUP);
	return ret;
}

function test_norm(isvd){
	var svd = isvd || test_svd();
	var norm = lsi.frobeniusNormOne(svd.S);
	return norm;
}

var big_text = "r by r singular values matrix S, and a n by r concept-document vector matrix, D, which satisfy the following relations:"
		+"\n banana S is a computed r by r diagonal matrix of decreasing singular values, and D is a computed n by r matrix of document vectors."
		+" banana and other undesirable artifacts of the original space of A. This reduced set of matrices is often denoted with a modified formula such as:"
		+" To do the latter, you must first translate your query into the low-dimensional space. It is then intuitive the same transformation"
		+" Note here that the inverse of the diagonal matrix may be found by inverting each nonzero value within the matrix."
		+" Cat ran over the shiddly bat wat mat"
		+" Cat had the value of matrix n ranked as a banana"
		+" lol singular values are made of cheese and banana pudding is delicious. Did I tell you the relations satisfied by the vectors are bad?"
		+"\n HEY! HEY, LISTEN! I'm talking to you, here. Cat. Yes, you, you stupid reduced matrix of intuitive vector document length."
		+"\n Someone should give me an award for how relevant and precise these original sentences are."
		+"\n It's really a miracle that the singular values of these sentences wait that makes no matrix sense darn.";

function test_summary(){
	return summarizer.summarize(big_text);	
}

function test_tab_summary(){
	summarizer.summarizeCurrentTab( function( summary ){
		console.log("Summarized as: " + numeric.prettyPrint(summary));
		render( "Summarized as the following: " + numeric.prettyPrint(summary) );
		last_result = summary;
	});
}

function render(lsi_info_out){
	document.getElementById('lsi-status').textContent = lsi_info_out;
}

var last_result;
document.addEventListener('DOMContentLoaded', function() {
	var report  = "";
	// last_result = test_summary();//test_lwm();
	// console.log(numeric.prettyPrint(last_result));
	// report     += numeric.prettyPrint(last_result);
	// render(report);
	test_tab_summary();
});
