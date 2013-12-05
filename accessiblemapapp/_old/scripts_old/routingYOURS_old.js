var waysOfRoute = new Array();
var cordsOfRoute = new Array();
var nodeOfWays = new Array();
var alreadyPrinted = new Array();
var selPoi = [];

// test: 47.225615,8.820604 müsste node: 59902164 sein (47.2256146, 8.8206042)
// 1502081799,289979475,59125785,59902171,59902166,59902164,
// 59902160,55410755,2025631767,291574748
function routeYOURSAPI() {
	var fromCoords = $('#from').val();
	var toCoords = $('#to').val();
	var fromLat = fromCoords.split(",")[0];
	var fromLon = fromCoords.split(",")[1];
	var toLat = toCoords.split(",")[0];
	var toLon = toCoords.split(",")[1];
	//startLat = fromLat;
	//startLon = fromLon;
	$.ajax({
		url : "../js/proxy.php?url="
					+ encodeURIComponent("http://www.yournavigation.org/api/1.0/gosmore.php?format=geojson&flat=" + fromLat
					+ "&flon=" + fromLon
					+ "&tlat=" + toLat
					+ "&tlon=" + toLon
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
	// fill routing Coordinates
	var lat;
	var lon;
	fillCoordinates(data).done(
		function() {
			//Elements selected in the form
			var selectedPoints = getSelectedRoutingElements();
			for ( var i = 0; i < cordsOfRoute.length; i++) {
				lat = cordsOfRoute[i].lat;
				lon = cordsOfRoute[i].lon;
				searchOverpassForCoords(lat, lon,"way[\"highway\"= \"steps\"]");
				searchOverpassForCoords(lat, lon,"way[\"highway\"= \"footway\"]");
				searchOverpassForCoords(lat, lon,"way[\"tunnel\"= \"yes\"]");
				searchOverpassForCoords(lat, lon,"way[\"highway\"]");
				searchOverpassForCoords(lat, lon,"way[\"bridge\"= \"yes\"]");
				//search orientation points for coordinates
				getOrientationPoints(lat,lon,selectedPoints);
			}
		}
	);
}
//Baustellen und Bäume in Zürich nur aus JSON
function getSelectedRoutingElements(){
	var selectedPOIs = new Array();
	$('#selectionRouting input:checked').each(function() {
		var name = $(this).attr('name');
		if(name == "tree"){
			selectedPOIs.push("natural = "+name);
		}
		else{
			selectedPOIs.push("amenity = "+name);
		}
	});
	return selectedPOIs;
}
function getOrientationPoints(lat,lon,selectedPoints){
	$.each(selectedPoints, function(index, keyWord) {
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
				getWayIdOfOrientationPoints(keyWord.split(" = ")[1], parameters);
			},
		});
	});
}

function getWayIdOfOrientationPoints(keyword, parameters){
	for(var i = 0; i<parameters.elements.length; i++){
		(function(i){
			$.ajax({
				type : 'GET',
				url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=" + parameters.elements[i].lat
					+ "1&lng=" + parameters.elements[i].lon + "&username=accessiblemap",
				dataType : 'json',
				jsonp : 'json_callback',
				error : function(data) {
					console.error("error");
				},
				success : function(data) {
					fillSelPoiArray(keyword+","+parameters.elements[i].id+","+data.streetSegment[0].wayId);
				}
			});
		})(i);
	}
}

function fillSelPoiArray(string){
	if ($.inArray(string, selPoi) == -1) {
		selPoi.push(string);
	}
}

function findNearestStreet(lat, lon) {
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=" + lat
				+ "1&lng=" + lon + "&username=accessiblemap",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			if (parameters.streetSegment[0].distance == 0) {
				// ..by checking if one node has nearly the lat and lon we searched for
				matchPathToCoords(parameters.streetSegment[0], lat, lon).done(
					function(resultBool) {
						deferred.resolve(resultBool);
					});

			} else {
				deferred.resolve(false);
			}

		},
	});
	return deferred;
}

var matchPathToCoords = function(path, lat, lon) {
	//console.log(path);
	var deferred = $.Deferred();

		// if it is from overpass, check if one of the nodes from the way
		// matches the coordinates
		nodeOfWays.push(new wayOfRoute(path.id, path.nodes));
		$.each(path.nodes, function(index, node) {
			matchPathNodeToCoords(node, lat, lon, path.id, path.name, path.tags).done(
					function(resultBool) {
						deferred.resolve(resultBool);
					})
		});
	return deferred;

};

var matchPathNodeToCoords = function(node, lat, lon, wayId, name, tags) {
	var deferred = $.Deferred();
	getNodeInformation(node).done(
			function(data) {
				var dist = calcDistance(data.lat, data.lon, lat, lon);
				var index = getIndexOfCordInRoute(lat, lon);
				// tolerance of 5m
				if (dist < 0.005) {
					var newWayMatch = new coordWayMatch(index,wayId, lat, lon,data.id,tags);
					if (!(alreadyInWays(newWayMatch))) {
						insertWay(newWayMatch);
						/*var foundLi = $('li:contains("' + lat + "," + lon		+ '")');
						foundLi.append("<br> nearest way   is " + wayId + " from node: "+ data.id +"<br>");*/
						checkRoute();
						deferred.resolve(true);
					}
				} else {
					deferred.resolve(false);
				}
			});
	
	return deferred;
};
function insertWay(newWayMatch){
	waysOfRoute.push(newWayMatch);
}
function getWaysForCords(lat, lon) {
	var deferred = $.Deferred();
	var waysArray = new Array();
	for ( var j = 0; j < waysOfRoute.length; j++) {
		(function(j){
		// find a way entry for the cordinates
		//console.log(waysOfRoute[j]);
		if (waysOfRoute[j].lat == lat) {
			if (waysOfRoute[j].lon == lon) {
				var index = getIndexOfCordInRoute(lat, lon);
				var match = new coordWayMatch(index,waysOfRoute[j].wayId,waysOfRoute[j].lat,waysOfRoute[j].lon ,waysOfRoute[j].node,waysOfRoute[j].tags);
				waysArray.push(match);
			}
		}
		if(j == (waysOfRoute.length-1)){
			deferred.resolve(waysArray);
		}
		})(j);
	}
	return deferred;
}
function checkRoute() {
	// go trough all cords of the way
	for ( var i = 0; i < cordsOfRoute.length - 1 ; i++) {
		// get ways for cords
		(function(i) {
			getWaysForCords(cordsOfRoute[i].lat, cordsOfRoute[i].lon).done(function(ways){
				var waysForCords = ways;
				// get ways for next cords
				if(i < (cordsOfRoute.length - 1)){
				getWaysForCords(cordsOfRoute[i + 1].lat,cordsOfRoute[i + 1].lon).done(function(waysSecond){
					var waysForNextCords = waysSecond;
					//maybe it is a continued road -> check for common ways with ways of cord before
					getCommonWays(waysForCords, waysForNextCords,cordsOfRoute[i].lat,cordsOfRoute[i].lon).done(function(result){
						
					});
				});
				}
			});
			if(i==(cordsOfRoute.length-2)){
				if(wayPerCord.length > 0){
					writeRoute(selPoi);
				}
			}
		})(i);
	}
}

function getCommonWays(waysForCords,waysForNextCords,lat,lon){
	var deferred = $.Deferred();
	var found = false;
	// check if the have a way in common
	for ( var j = 0; j < waysForCords.length; j++) {
		(function(j){
			// this way is in the array for the nextCords
			if(wayIsInArr(waysForCords[j], waysForNextCords)){	
				var index = getIndexOfCordInRoute(lat,lon);
				var match = new coordWayMatch(index,waysForCords[j].wayId,lat,lon,waysForCords[j].node, waysForCords[j].tags);
				if(!(cordHasMatch(match))){
					wayPerCord.push(match);
				}
				found = true;	
			}
			if(j == (waysForCords.length-1)){
				deferred.resolve(found);
			}
		})(j);
	}
	return deferred;
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
		if ((waysOfRoute[i].lat == way.lat) && (waysOfRoute[i].lon == way.lon)
				&& (waysOfRoute[i].node == way.node)
				&& (waysOfRoute[i].wayId == way.wayId)) {
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
// checks if the next cordPair has the same node if one of their ways
function alreadyInWaysOfRoute(data) {
	for ( var i = 0; i < waysOfRoute.length; i++) {
		if (waysOfRoute[i].node == data.node
				&& waysOfRoute[i].wayId == data.wayId) {
			return true;
		}
	}
	return false;
}
/*function getStreetName(directionsString) {
	var index = directionsString.indexOf('strasse');
	var streetName = "";
	if (index != -1) {
		var substringStr = directionsString.substring(0, index);
		var lastBlank = substringStr.lastIndexOf(' ');
		streetName = substringStr.substring(lastBlank + 1) + "strasse";
	}
	return streetName;
}*/

function coordPair(lat, lon, id) {
	this.lat = lat;
	this.lon = lon;
	this.id = id;
}
function fillCoordinates(data) {
	var deferred = $.Deferred();
	for ( var i = 0; i < data.coordinates.length; i++) {
		cordsOfRoute.push(new coordPair(data.coordinates[i][1],	data.coordinates[i][0]));
		$('#routeOutput').append(
				"<li id=\"" + i+ "\">" + (i + 1)+".</li>");
		if (i == (data.coordinates.length - 1)) {
			deferred.resolve();
			return deferred;
		}
	}
}

var interpreteOverpassResults = function(overpassPaths, lat, lon) {
	// alle strassen im umfeld - prüfen ob ein node davon die gesuchten
	// koordinaten hat
	$.each(overpassPaths.elements, function(index, path) {
		matchPathToCoords(path, lat, lon);
	});
};

// Use Overpass API to search for footpathes. Results will be used to determine
// if pathes aer bridges.
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

function getNodeInformation(nodeId) {
	var deferred = $.Deferred();
	$
			.ajax({
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
function getStreetDataOverpass(wayId) {
	var deferred = $.Deferred();
	$
			.ajax({
				type : 'GET',
				url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];way("
						+ wayId + ");out;",
				dataType : 'json',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
				},
				success : function(parameters) {
					// console.log(parameters.elements[0]);
					deferred.resolve(parameters.elements[0]);
				},
			});
	return deferred;
}