var nodeCoord = new Array();
var nodeIDs = new Array();
function getNodeHighways() {
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	nodeIDs.push(12345);
	console.log("node Ids");
	$.when(getCoordinatesOfNodes()).then(onSuccess, onFailure);
}



function onSuccess(){
	nodeCoord.push(parameters.elements[0].lat);
	nodeCoord.push(parameters.elements[0].lon);
	console.log(nodeCoord[0]);
}

function onFailure(){
	console.error("error Coordinates: "+parameters);
	console.log(parameters);
}