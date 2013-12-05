function getTrees(){
	var json = readJSON();
	console.log(json);
}
function readJSON(){
	var json;
	$.getJSON( "data/baumkataster.json").then( function( data ) {
		json = data;
	});
	return json;
}