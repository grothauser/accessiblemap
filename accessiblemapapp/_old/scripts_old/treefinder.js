function getTrees(){
	readJSON();
}
function treeCords(lon,lat){
	this.lon = lon;
	this.lat = lat;
}
function readJSON(){
	$.getJSON( "data/baumkataster.json").then( function(data){
			writeTrees(data);});
}
function writeTrees(data) {
	var trees = new Array();
	for(var i = 0; i < data.features.length; i++){
			treedata = data.features[i];
			trees.push(treedata.geometry.coordinates[0],treedata.geometry.coordinates[1]);
	}
	var node = new Array();
	node.push(8.5762736021507, 47.3979533221659);
	findTreesInStreet(trees, node);
}
function findTreesInStreet(data, streetNodes){
	var treesInStreet = new Array();
	for ( var i = 0; i < streetNodes.length; i++) {
		var index = jQuery.inArray( streetNodes[i], data);
		if(index != -1){
			treesInStreet.push(index);
			console.log(data[index]);
		}
	}
}