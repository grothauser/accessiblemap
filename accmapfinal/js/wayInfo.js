var orientationContent = [];
function enricheWays(route, intersections){
	orientationContent = [];
	var deferred = $.Deferred();
	var enrichedRoute = [];
	var selectedPois = getSelectedRoutingElements();
	getOrientationPoints(route, selectedPois, intersections).done(function(){
		console.log(orientationContent);
		$.each(route, function(index, coordinate){
			if(index <= (route.length-2)){
				var nextCoordinate = route[index + 1];
				var degreesToNext = calcBearing(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
				var sideBuffers = calculateSideBuffers(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, degreesToNext);
				
				var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], orientationContent, coordinate.lat,coordinate.lon, coordinate.distance);
				poisInLeftStreetSegment.sort(distanceSort);
				
				var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], orientationContent,  coordinate.lat,coordinate.lon, coordinate.distance);
				poisInRightStreetSegment.sort(distanceSort);
				
				enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction,  coordinate.lat,coordinate.lon,coordinate.way.tags, poisInLeftStreetSegment, poisInRightStreetSegment,coordinate.way));
			}
			else if(index === (route.length-1)){
				enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, "", "", "",""));
				deferred.resolve(enrichedRoute);
			}
		});
	});
	return deferred;
}

function enrichStreetWay(route, intersections, warnings, locLat, locLon){
	var deferred = $.Deferred();
	var enrichedRoute = [];
	var selectedPois = getSelectedRoutingElements();
	getOrientationPoints(route, selectedPois, intersections).done(function(){
		var poisOnLeftSide = [];
		var poisOnRightSide = [];
		console.log(selectedPois);
		//add intersections if selected
		if($.inArray("intersections", selectedPois)!==-1){
			$.each(intersections, function(index, isec){
				var dist = calcDistance(locLat, locLon, isec.lat, isec.lon);
				poisOnLeftSide.push(new orientationEntry(isec.lat, isec.lon, isec.keyword, isec.tags, dist));
				poisOnRightSide.push(new orientationEntry(isec.lat, isec.lon, isec.keyword, isec.tags, dist));
			});
		}
		//add warnings
		if($.inArray("overlapwarnings", selectedPois)!==-1){
			$.each(warnings, function(index, warn){
				var dist = calcDistance(locLat, locLon, warn.lat, warn.lon);
				poisOnLeftSide.push(new orientationEntry(warn.lat, warn.lon, warn.keyword, warn.tags, dist));
				poisOnRightSide.push(new orientationEntry(warn.lat, warn.lon, warn.keyword, warn.tags, dist));
			});
		}
		var degreesToNext = calcBearing(route[0].lat, route[0].lon,	route[1].lat, route[1].lon);
		var sideBuffers = calculateSideBuffers(route[0].lat, route[0].lon, route[1].lat, route[1].lon, degreesToNext);
		
		var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], orientationContent, locLat, locLon, 300);
		poisInLeftStreetSegment = poisOnLeftSide.concat(poisInLeftStreetSegment);
		poisInLeftStreetSegment.sort(distanceSort);
		
		var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], orientationContent,  locLat, locLon, 300);
		poisInRightStreetSegment = poisOnRightSide.concat(poisInRightStreetSegment);
		poisInRightStreetSegment.sort(distanceSort);
		
		enrichedRoute.push(new finalElement("", "", locLat, locLon, route[0].way.tags, poisInLeftStreetSegment, poisInRightStreetSegment));
		deferred.resolve(enrichedRoute);
	});
	return deferred;
}
function finalElement(distance,direction,lat,lon,tags,opsLeft, opsRight,way){
	this.distance = distance;
	this.direction = direction;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags;
	this.opsLeft = opsLeft;
	this.opsRight = opsRight;
	this.way = way;
}

function getOrientationPoints(route,selectedPoints, intersections){
	var deferred = $.Deferred();
	var counter = selectedPoints.length;
	var bbox = getMinMaxForRoute(route);

	isInZurich(route).done(function(bool){
		//for each selected point find the matching pois
		$.each(selectedPoints, function(i, keyword) {
			//if searching for trees
			if((keyword == "natural=tree") &&( bool) ){
				findTreeStreet(bbox).done(function(data){
					counter--;
					orientationContent.push(new orientationEntry(data.lat, data.lon, keyword, data.tags));
					if(counter === 0){
						deferred.resolve();
					}
				});
			}//Geändert
			else if(keyword == "roadworks"){
				getRoadworks(route).done(function(){
					counter--;
					if(counter === 0){
						deferred.resolve();
					}
				});
			}
			else{		
				getPoisForKeyWord(bbox, keyword).done(function(){
					counter--;
					if(counter === 0){
						deferred.resolve();
					}
				});
			}
		});
	});
	return deferred;
}

function getRoadworks(route){
	var deferred = $.Deferred();
	$.each(route, function(index, coord){
		console.log(coord.way.wayId);
		$.ajax({
			url: 'http://trobdb.hsr.ch/getTrafficObstruction?osmid='+coord.way.wayId,
			type : 'GET',
			dataType : 'jsonp',
			error : function(data) {
				console.error("error");
				deferred.resolve();
			},
			success : function(data) {
				console.log(data);
				var entry = new orientationEntry(data.lat, data.lon, keyWord, data.tags);
				orientationContent.push(entry);
				deferred.resolve();
			},
		});
	});
	return deferred;
}

function isInZurich(route){
	var zuricharray = new Array();
	var multipolyCoords = [];
	var d = $.Deferred();
	$.ajax({
		url : "\data\\export.json",
		success : function(data) {
			//Get Zurich City Polygon
			for (var i = 0; i < data.features[0].geometry.coordinates.length; i++) {
				var polyCoords = [];
				for (var a = 0; a < data.features[0].geometry.coordinates[i].length; a++) {
					for (var k = 0; k < data.features[0].geometry.coordinates[i][0].length; k++) {
						polyCoords.push(new coordPair(data.features[0].geometry.coordinates[i][0][k][1], data.features[i].geometry.coordinates[a][0][k][0]));
					}
				}
				multipolyCoords.push(polyCoords);
			}
			//check for each segment if it is in zurich
			$.each(route, function(index, coordinate){
				console.log(coordinate.lat + "," + coordinate.lon + " in zurich: " + isPip(coordinate.lat, coordinate.lon, multipolyCoords));
				zuricharray.push(isPip(coordinate.lat, coordinate.lon, multipolyCoords));
				if(zuricharray.length === route.length){
					d.resolve(isPip(coordinate.lat, coordinate.lon, multipolyCoords));
				}
			});
		}
	});
	return d;
}
function getPoisForKeyWord(bbox, keyWord){
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node["+keyWord+"]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			if(parameters.elements.length > 0){
				$.each(parameters.elements, function(index, data){
					var entry = new orientationEntry(data.lat, data.lon, keyWord, data.tags);
					orientationContent.push(entry);
					if(index == (parameters.elements.length-1)){
						deferred.resolve("");
					}
				});
			}
			else{
				deferred.resolve("0");
			}
		},
	});
	return deferred;
}
function orientationEntry(lat,lon,keyword, tags, distance){
	this.lat = lat;
	this.lon = lon;
	this.keyword = keyword;
	this.tags = tags;
	this.distance = distance;
}

