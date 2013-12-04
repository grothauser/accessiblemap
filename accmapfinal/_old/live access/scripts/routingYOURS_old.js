var waysOfRoute = new Array();
var cordsOfRoute = new Array();
var nodeOfWays = new Array();
var alreadyPrinted = new Array();
var selPoi = [];

function routeYOURSAPI() {
	var fromCoords = $('#from').val();
	var toCoords = $('#to').val();
	var fromLat = fromCoords.split(", ")[0];
	var fromLon = fromCoords.split(", ")[1];
	var toLat = toCoords.split(", ")[0];
	var toLon = toCoords.split(", ")[1];
	$.ajax({
		//url : "../js/proxy.php?url="
		url: "../scripts/proxy.php?url="
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
			$('#routeOutput').append("<h3>Route gefunden: </h3> <ul>");
			$('#routeOutput').append("<li id=0>1.</li>");
			interpreteYOURSRoute(data);
		},
	});
}
function coordWayMatch(index,wayId, lat, lon, node, tags) {
	this.index = index;
	this.wayId = wayId;
	this.lat = lat;
	this.lon = lon;
	this.node = node;
	this.tags = tags; 
}
function wayOfRoute(wayId, nodes) {
	this.wayId = wayId;
	this.nodes = nodes;
}
function interpreteYOURSRoute(data) {
	var lat, lon;
	fillCoordinates(data);
	//Elements selected in the form
	var selectedPoints = getSelectedRoutingElements(lat, lon);
	for ( var i = 0; i < cordsOfRoute.length; i++) {
		lat = cordsOfRoute[i].lat;
		lon = cordsOfRoute[i].lon;
		searchOverpassForCoords(lat, lon,'way["highway"= "steps|footway"]');
		searchOverpassForCoords(lat, lon,'way["highway"]["tunnel"= "yes"]');
		searchOverpassForCoords(lat, lon,'way["highway"]');
		searchOverpassForCoords(lat, lon,'way["highway"]["bridge"= "yes"]');
		
		//search orientation points for coordinates
		getOrientationPoints(lat,lon,selectedPoints);
	}	
}

function getSelectedRoutingElements(lat, lon){
	var selectedPOIs = new Array();
	$('#selectionRouting input:checked').each(function() {
		var name = $(this).attr('name');
		if(name == "tree")
			selectedPOIs.push("natural = "+name);
		else if(name = "transportStop"){
			selectedPOIs.push("railway = tram_stop");
			selectedPOIs.push("public_transport = stop_position");
			selectedPOIs.push("public_transport = platform");
			selectedPOIs.push("railway = platform");
		}else if(name = "transportStop"){
			selectedPOIs.push("highway = "+name);
		}
		else
			selectedPOIs.push("amenity = "+name);
	});
	return selectedPOIs;
}

function getOrientationPoints(lat,lon,selectedPoints){
	var position;
	isInZurich(lat, lon).done(function(bool){
		position = bool;
		$.each(selectedPoints, function(index, keyword) {
			if(keyword == "natural = tree"){
				if(!position)
					getLatLonOfPoi(lat, lon, keyword);
				else
					findTreeStreet(lat, lon);
			}else		
				getLatLonOfPoi(lat, lon, keyword);
		});
	});
}

function isInZurich(lat, lon){
	var multipolyCoords = [];
	var d = $.Deferred();
	$.ajax({
		url : "../data/export.json",
		success : function(data) {
			//Get Zurich City Polygon
			for (var i = 0; i < data.features[0].geometry.coordinates.length; i++) {
				var polyCoords = [];
				for (var a = 0; a < data.features[0].geometry.coordinates[i].length; a++) {
					for (var k = 0; k < data.features[0].geometry.coordinates[i][0].length; k++) {
						polyCoords.push(data.features[0].geometry.coordinates[i][0][k][1] + ", " + data.features[i].geometry.coordinates[a][0][k][0]);
					}
				}
				multipolyCoords.push(polyCoords);
			}
			var bool = pipTest(lat, lon, multipolyCoords);
			d.resolve(bool);
		}
	});
	return d;
}

function pipTest(lat, lon, multipolyCoords){
	var c = 0;
	for(var k=0; k<multipolyCoords.length; k++){
		var nvert = multipolyCoords[k].length;
		var vertx = []; var verty = [];
		for(var i=0; i<nvert; i++){
			vertx.push(multipolyCoords[k][i].split(", ")[0]);
			verty.push(multipolyCoords[k][i].split(", ")[1]);
		}
		var i, j;
		for (i=0, j=nvert-1; i<nvert; j=i++) {
			if (((verty[i]>lon) != (verty[j]>lon))&&(lat<(vertx[j]-vertx[i]) * (lon-verty[i]) / (verty[j]-verty[i]) + parseFloat(vertx[i]))){
				c = !c;
			}
		}
	}
	return c;
}

function getLatLonOfPoi(lat, lon, keyWord){
	var radius =$('#insertRadiusBoxRouting').val();
	var bbox = getBbox(lat, lon, radius);
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node["+keyWord+"]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			for(var i = 0; i<parameters.elements.length; i++){
				fillSelPoiArray(keyWord.split(" = ")[1], parameters.elements[i].lat,parameters.elements[i].lon, lat,lon);
			}
		},
	});
}

function fillSelPoiArray(keyword, selLat, selLon, lat, lon){
	distance = Math.round(calcDistance(lat, lon, selLat, selLon)*100);
	var match = new selPoiEntry(selLat, selLon, keyword, distance)
	var string = distance+","+keyword+","+selLat+","+selLon;
	if ($.inArray(string, selPoi) == -1) {
		selPoi.push(string);
	}
}

function selPoiEntry(lat,lon,name, distance){
	this.lat = lat;
	this.lon = lon;
	this.name = name;
	this.distance = distance;
}

//Use Overpass API to search for footpathes. Results will be used to determine
//if pathes are bridges.
function searchOverpassForCoords(lat, lon, keyWord) {
	var bbox = getBbox(lat, lon, "0.1");

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
			interpreteOverpassResults(overpassResult, lat, lon);
		},
	});
}

function interpreteOverpassResults(overpassPaths, lat, lon) {
	// Check if node of street in surrounding field has same coordinates
	$.each(overpassPaths.elements, function(index, path) {
		matchPathToCoords(path, lat, lon);
	});
}

function matchPathToCoords(path, lat, lon) {
	// if from overpass, check if one of the nodes from the way matches the coordinates
	nodeOfWays.push(new wayOfRoute(path.id, path.nodes));
	$.each(path.nodes, function(index, node) {
		matchPathNodeToCoords(node, lat, lon, path.id, path.tags)
	});
};

function matchPathNodeToCoords(node, lat, lon, wayId, tags) {
	getNodeInformation(node).done(function(data) {
		var dist = calcDistance(data.lat, data.lon, lat, lon);
		var index = getIndexOfCordInRoute(lat, lon);
		// tolerance of 5m
		if (dist < 0.005) {
			var newWayMatch = new coordWayMatch(index,wayId, lat, lon,data.id,tags);
			if (!(alreadyInWays(newWayMatch))) {
				waysOfRoute.push(newWayMatch);
				checkRoute();
			}
		}
	});
};

function checkRoute() {
	// go trough all cords of the way
	for ( var i = 0; i < cordsOfRoute.length - 1 ; i++) {
		// get ways for cords
		var waysForCords = getWaysForCords(cordsOfRoute[i].lat, cordsOfRoute[i].lon); 
		// get ways for next cords
		if(i < (cordsOfRoute.length - 1)){
			var waysForNextCords = getWaysForCords(cordsOfRoute[i + 1].lat,cordsOfRoute[i + 1].lon);
			//maybe it is a continued road -> check for common ways with ways of cord before
			getCommonWays(waysForCords, waysForNextCords,cordsOfRoute[i].lat,cordsOfRoute[i].lon,cordsOfRoute[i+1].lat,cordsOfRoute[i+1].lon);
		}
	}
	writeRoute(selPoi);
}

function getWaysForCords(lat, lon) {
	var waysArray = [];
	for ( var j = 0; j < waysOfRoute.length; j++) {
		// find a way entry for the coordinates
		if (waysOfRoute[j].lat == lat) {
			if (waysOfRoute[j].lon == lon) {
				var index = getIndexOfCordInRoute(lat, lon);
				var match = new coordWayMatch(index,waysOfRoute[j].wayId,waysOfRoute[j].lat,waysOfRoute[j].lon ,waysOfRoute[j].node,waysOfRoute[j].tags);
				waysArray.push(match);
			}
		}
	}
	return waysArray;
}

function getCommonWays(waysForCords,waysForNextCords,lat,lon,nextLat,nextLon){
	// check if they have a way in common
	for ( var j = 0; j < waysForCords.length; j++) {
		// this way is in the array for the nextCords
		if(wayIsInArr(waysForCords[j], waysForNextCords)){	
			var index = getIndexOfCordInRoute(lat,lon);
			var match = new coordWayMatch(index,waysForCords[j].wayId,lat,lon,waysForCords[j].node, waysForCords[j].tags);
			if(!(cordHasMatch(match))){
				wayPerCord.push(match);
			}
		}
	}
}

function getIndexOfCordInRoute(lat,lon){
	for(var i = 0; i < cordsOfRoute.length; i++){
		if(cordsOfRoute[i].lat == lat){
			if(cordsOfRoute[i].lon == lon){
				return i;
			}
		}
	}
	return -1;
}
function wayIsInArr(way, array){
	for(var i = 0; i < array.length; i++){
		if(way.wayId == array[i].wayId){
			return true;
		}
	}
	return false;
}
function cordHasMatch(match){
	for(var i = 0; i < wayPerCord.length; i++){
		if(wayPerCord[i].lat == match.lat && wayPerCord[i].lon == match.lon){
			return true;
		}
	}
	return false;
}
function alreadyInWays(way) {
	for ( var i = 0; i < waysOfRoute.length; i++) {
		if (waysOfRoute[i] == way) {
			return true;
		}
	}
	return false;
}
function getNodesForWay(wayId) {
	for ( var i = 0; i < nodeOfWays.length; i++) {
		if (nodeOfWays[i].wayId == wayId) {
			return nodeOfWays[i].nodes;
		}
	}
}

function coordPair(lat, lon) {
	this.lat = lat;
	this.lon = lon;
}
function fillCoordinates(data) {
	for ( var i = 0; i < data.coordinates.length; i++) {
		cordsOfRoute.push(new coordPair(data.coordinates[i][1],	data.coordinates[i][0]));
		$('#routeOutput').append("<li id=\"" + (i+1)+ "\"></li>");
	}
}

function getNodeInformation(nodeId) {
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node("
				+ nodeId + ");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			deferred.resolve(parameters.elements[0]);
		},
	});
	return deferred;
}

function calculateDegrees(lat, lon, nextLat, nextLon, overNextLat, overNextLon){
	var degreesToNext = calcBearing(lat, lon, nextLat, nextLon);
	var degreesToOverNext = calcBearing(nextLat, nextLon,overNextLat, overNextLon, 0);
	var azimuth = degreesToOverNext - degreesToNext;
	if(azimuth < 0)
		return 360 + azimuth;
	else
		return azimuth;
}