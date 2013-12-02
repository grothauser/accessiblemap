var orientationContent = new Array();
function enricheWays(route){
	var deferred = $.Deferred();
	var enrichedRoute = new Array();
	var selectedPois = getSelectedRoutingElements();
	getOrientationPoints(route, selectedPois).done(function(){
		$.each(route, function(index, coordinate){
			if(index <= (route.length-2)){
				var nextCoordinate = route[index + 1];
				var degreesToNext = calcBearing(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
				var sideBuffers = calculateSideBuffers(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, degreesToNext);
				
				var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], orientationContent, coordinate.lat,coordinate.lon, coordinate.distance);
				poisInLeftStreetSegment.sort(distanceSort);
				
				var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], orientationContent,  coordinate.lat,coordinate.lon, coordinate.distance);
				poisInRightStreetSegment.sort(distanceSort);
				
				console.log(poisInLeftStreetSegment);
				
				enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, coordinate.way.tags, poisInLeftStreetSegment, poisInRightStreetSegment));
			}
			else if(index == (route.length-1)){
				enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, "", "", ""));
				deferred.resolve(enrichedRoute);
			}
			
		});
	});
	return deferred;
	
}
function finalElement(distance,direction,tags,opsLeft, opsRight){
	this.distance = distance;
	this.direction = direction;
	this.tags = tags;
	this.opsLeft = opsLeft;
	this.opsRight = opsRight;
}
function orientationEntry(lat,lon,keyword, tags, distance){
	this.lat = lat;
	this.lon = lon;
	this.keyword = keyword;
	this.tags = tags;
	this.distance = distance;
}
function getOrientationPoints(route,selectedPoints){
	var deferred = $.Deferred();
	var counter = selectedPoints.length;
	console.log(route);
	var bbox = getMinMaxForRoute(route);
	console.log(bbox[1] + " "+ bbox[0] + " " + bbox[3] + " " + bbox[2]);
	isInZurich(route).done(function(bool){
		
		//for each selected point find the matching pois
		$.each(selectedPoints, function(i, keyword) {
			//if searching for trees
			if((keyword == "natural=tree") &&( bool) ){
				console.log("we are in zurich")
				findTreeStreet(bbox).done(function(data){
					counter--;
					console.log(data);
					orientationContent.push(new orientationEntry(data.lat, data.lon, keyword, data.tags));
					if(counter == 0){
						deferred.resolve("");
					}
				});
			}else{		
				console.log("searching for " + keyword);	
				getPoisForKeyWord(bbox, keyword).done(function(){
					counter--;
					if(counter == 0){
						deferred.resolve("");
					}
				});
			}
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
function orientationPoint(keyWord,tags,distance){
	this.keyWord = keyWord;
	this.tags = tags;
	this.distance = distance;
}

function getPointsInBuffer(buffer, selPoi, lat,lon, distance) {
	var nvert = buffer.coordinates[0].length;
	var vertx = [];
	var verty = [];
	for ( var i = 0; i < nvert; i++) {
		vertx.push(buffer.coordinates[0][i][0]);
		verty.push(buffer.coordinates[0][i][1]);
	}
	var testx, testy;
	var poisInStreetBuffer = [];
	for ( var k = 0; k < selPoi.length; k++) {
		testx = selPoi[k].lat;
		testy = selPoi[k].lon;
		var i, j, isInBuffer = false;
		for (i = 0, j = nvert - 1; i < nvert; j = i++) {
			if (((verty[i] > testy) != (verty[j] > testy))
					&& (testx < (vertx[j] - vertx[i]) * (testy - verty[i])
							/ (verty[j] - verty[i]) + vertx[i])) {
				isInBuffer = !isInBuffer;
			}
		}
		if (isInBuffer == true) {
			var distToPoi = calcDistance(lat,lon,selPoi[k].lat,selPoi[k].lon);
			if(distToPoi <= (distance) ){
				poisInStreetBuffer.push(new orientationEntry(selPoi[k].lat, selPoi[k].lon,selPoi[k].keyword,selPoi[k].tags,distToPoi));
			}
		}
	}
	return poisInStreetBuffer;
}

function getMinMaxForRoute(route){
	var bbox = new Array();
	var minLon = route[0].lon;
	var minLat = route[0].lat;
	var maxLon = route[0].lon;
	var maxLat = route[0].lat;
	for(var i=0; i<route.length; i++){
		if(route[i].lat < minLat){
			minLat = route[i].lat;
		}
		if(route[i].lat > maxLat){
			maxLat = route[i].lat;
		}
		if(route[i].lon < minLon){
			minLon =route[i].lon;
		}
		if(route[i].lon > maxLon){
			maxLon = route[i].lon;
		}
		if(i == (route.length-1)){
			bbox.push(minLon);
			bbox.push(minLat);
			bbox.push(maxLon);
			bbox.push(maxLat);
			return bbox;
		}	
	}
}