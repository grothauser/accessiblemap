var isZurich = new Array();
var waysOfRoute = new Array();
var cordsOfRoute = new Array();

function routeYOURSAPI(fromLat, fromLon,toLat, toLon) {
	$.ajax({
		url: "../js/proxy.php?url="
					+ encodeURIComponent("http://www.yournavigation.org/api/1.0/gosmore.php?format=geojson&" 
					+"flat="+ fromLat + "&flon=" + fromLon
					+ "&tlat=" + toLat + "&tlon=" + toLon
					+ "&v=foot&fast=0&layer=mapnik&instructions=1&lang=de"),
		type : 'GET',
		dataType : 'json',
		error : function(data) {
			console.error("error");
			console.log(data);
		},
		success : function(data) {
			console.log(data);
			interpreteYOURSRoute(data);
		},
	});
}

function interpreteYOURSRoute(data) {
		fillCoordinates(data);
		if(detectmob()){
			checkCompass().done(function(compval){
				getSide(compval, cordsOfRoute[0], cordsOfRoute[1], "routing");
			});
		}else{
			getSide(0, cordsOfRoute[0], cordsOfRoute[1], "routing");
		}
		console.log(cordsOfRoute);
		$.each(cordsOfRoute, function(indexCoord, coord){
			searchOverpassForCoords(coord,'way["highway"]').done(function(allPathsForCoord){
				var smallestDist;
				var nearestNode;
				//go trough all ways
				$.each(allPathsForCoord, function(indexPath, path){
					//go trough all nodes of path
					$.each(path.nodes, function(indexNodes, node){
						var dist = calcDistance(node.lat, node.lon, coord.lat, coord.lon);
						if(indexNodes == 0){
							smallestDist = dist;
							nearestNode = node;
						}else{
							if(smallestDist < dist){
								smallestDist = dist;
								nearestNode = node;
							}
						}
						if((indexNodes == (path.nodes.length-1)) && (indexPath == (allPathsForCoord.length-1))){
							var newWayMatch = new coordWayMatch(indexCoord,path.wayId, coord.lat, coord.lon,nearestNode.id,path.tags);
								waysOfRoute.push(newWayMatch);
								if(indexCoord == (cordsOfRoute.length-1)){
									checkRoute();
								}
						}
						
						
					});
					
				});
				
			
			});
			
	});
	
}
function alreadyInWays(way) {
	for ( var i = 0; i < waysOfRoute.length; i++) {
		if (waysOfRoute[i] == way) {
			return true;
		}
	}
	return false;
}
function searchOverpassForCoords(coord,keyWord) {
	var deferred = $.Deferred();
	var bbox = getBbox(coord.lat, coord.lon, 30);
	console.log("searching for " + coord.lat + "," + coord.lon);
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];"
				+ keyWord + "(" + bbox[1] + "," + bbox[0] + "," + bbox[3] + ","
				+ bbox[2] + ");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		// Handle results over to determination
		success : function(overpassResult) {
			var allPathsForCoord = new Array();
			$.each(overpassResult.elements, function(index, element){
				var allNodesOfWay = new Array();
					$.each(element.nodes, function(indexNodes, node){
						//get node lat,lon for all nodes of each way
						getNodeInformation(node).done(function(nodeData){
							allNodesOfWay.push(new coordPair(nodeData.lat, nodeData.lon, nodeData.id));
							if(indexNodes == (element.nodes.length-1)){
								allPathsForCoord.push(new wayOfRoute(element.id, allNodesOfWay,element.tags));
								if(index === (overpassResult.elements.length-1)){
									deferred.resolve(allPathsForCoord);
								}
								
							}
							
						});
						
						
					});
			
			});
			if(overpassResult.elements.length === 0){
				deferred.resolve(0);
			}
		}
	});
	return deferred;
}



function coordWayMatch(index,wayId, lat, lon,nodeId,tags) {
	this.index = index;
	this.wayId = wayId;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags; 
}
function wayOfRoute(wayId, nodes,tags) {
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
}




function getSelectedRoutingElements(){
	var selectedPOIs = new Array();
	$("input[type=checkbox]").each(function() {
		var name = $(this).attr('name');
		var id = $(this).attr('id');
		if(name == "op"){
			var saved = localStorage.getItem( $(this).attr('id'));
			if(saved == "true"){
				if(id == "transportStop"){
					selectedPOIs.push("railway = tram_stop");
					selectedPOIs.push("public_transport = stop_position");
					selectedPOIs.push("public_transport = platform");
					selectedPOIs.push("railway = platform");
				}
				else{
					selectedPOIs.push(id);
				}
			}
		}
	});
	return selectedPOIs;
}





function isPip(lat, lon, multipolyCoords){
	var isInPolygon = false;
	for(var k=0; k<multipolyCoords.length; k++){
		var nvert = multipolyCoords[k].length;
		var vertx = []; var verty = [];
		for(var i=0; i<nvert; i++){
			vertx.push(multipolyCoords[k][i].lat);
			verty.push(multipolyCoords[k][i].lon);
		}
		var i, j;
		for (i=0, j=nvert-1; i<nvert; j=i++) {
			if (((verty[i]>lon) != (verty[j]>lon))&&(lat<(vertx[j]-vertx[i]) * (lon-verty[i]) / (verty[j]-verty[i]) + parseFloat(vertx[i]))){
				isInPolygon = !isInPolygon;
			}
		}
	}
	return isInPolygon;
}


function checkRoute() {
	for ( var i = 0; i < (cordsOfRoute.length) ; i++) {
		if(i < (cordsOfRoute.length - 1)){
			var waysForCords = getWaysForCords(cordsOfRoute[i].lat, cordsOfRoute[i].lon); 
			var waysForNextCords = getWaysForCords(cordsOfRoute[i + 1].lat,cordsOfRoute[i + 1].lon);
			//maybe it's a continued road -> check for common ways with waysofcord before
			getCommonWays(waysForCords, waysForNextCords,cordsOfRoute[i].lat,cordsOfRoute[i].lon,cordsOfRoute[i+1].lat,cordsOfRoute[i+1].lon);
		}else{
			writeRoute(cordsOfRoute);
		}
		
	}
}

function getWaysForCords(lat, lon) {
	var waysArray = [];
	for ( var j = 0; j < waysOfRoute.length; j++) {
		// find a way entry for the coordinates
		if ((waysOfRoute[j].lat == lat) && (waysOfRoute[j].lon == lon)) {
				var index = getIndexOfCordInRoute(lat, lon);
				var match = new coordWayMatch(index,waysOfRoute[j].wayId,waysOfRoute[j].lat,waysOfRoute[j].lon ,waysOfRoute[j].node,waysOfRoute[j].tags);
				waysArray.push(match);
		}
	}
	return waysArray;
}
function wayIsInArr(way, array){
	for(var i = 0; i < array.length; i++){
		if(way.wayId == array[i].wayId){
			return true;
		}
	}
	return false;
}

function cordHasMatch( match){
	var result = false;
	for(var i = 0; i < wayPerCord.length; i++){
		if((wayPerCord[i].lat == match.lat )&& (wayPerCord[i].lon == match.lon)){
			result = true;
		}
	}
	return result;
}

function getCommonWays(waysForCords,waysForNextCords,lat,lon,nextLat,nextLon){
	for ( var j = 0; j < waysForCords.length; j++) {
		if(wayIsInArr(waysForCords[j], waysForNextCords)){	
			var index = getIndexOfCordInRoute(lat,lon);
			var match = new coordWayMatch(index,waysForCords[j].wayId,lat,lon,waysForCords[j].node, waysForCords[j].tags);
			console.log(match);
			wayPerCord.push(match);
		}
		
	}
}

function getWayForCords(lat, lon) {
var way;
	$.each(wayPerCord, function(index, matchingSegment){
		// find a way entry for the coordinates
		if( (matchingSegment.matchedLat == lat) && (matchingSegment.matchedLon == lon)) {
				var index = getIndexOfCordInRoute(lat, lon);
				var match = new coordWayMatch(index,matchingSegment.wayId,matchingSegment.matchedLat,matchingSegment.matchedLon ,matchingSegment.tags);
				waysArray.push(match);
			}
	});
	return way;
}

function getIndexOfCordInRoute(lat,lon){
for(var i = 0; i < cordsOfRoute.length; i++){
	if((cordsOfRoute[i].lat == lat) && (cordsOfRoute[i].lon == lon)){
			return i;
		}
	}

}

function getCommonWays(waysForCords,waysForNextCords,lat,lon,nextLat,nextLon){
	// check if they have a way in common
	for ( var j = 0; j < waysForCords.length; j++) {
		// this way is in the array for the nextCords
		if(wayIsInArr(waysForCords[j], waysForNextCords)){	
			var index = getIndexOfCordInRoute(lat,lon);
			var match = new coordWayMatch(index,waysForCords[j].wayId,lat,lon,waysForCords[j].node, waysForCords[j].tags);
			if(!(cordHasMatch(wayPerCord, match))){
				wayPerCord.push(match);
			}
		}
		
	}
}

function coordPair(lat, lon, id) {
	this.lat = lat;
	this.lon = lon;
	this.id = id;
}
function fillCoordinates(data) {
	for ( var i = 0; i < data.coordinates.length; i++) {
		cordsOfRoute.push(new coordPair(data.coordinates[i][1],	data.coordinates[i][0]));
	}
}


