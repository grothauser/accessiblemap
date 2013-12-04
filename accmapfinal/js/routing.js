var routedIndexes = [];
var modifiedDist = [];
var directions = [];
var distances = [];
var indexValues = [];
var naviPois = [];
var naviLeftPois = [];
var naviRightPois = [];
var textArray = [];
var streetWidth = 0.01;
var destlat, destlon;
function refreshRoute(){
	console.log("refreshroute");
	getGPSLocation();
	getRoute(locatedLat, locatedLon, destlat+","+destlon);
	$( ".contentRoutingRight").empty();
	$( ".contentRouting").empty();
}
function getRoute(lat,lon,destinationCoords) {
	console.log("getting route");
	var destarr = destinationCoords.split(',');
	destlat = destarr[0];
	destlon = destarr[1];
	console.log(lat+","+lon+" to " + destlat + "," + destlon);
	//routeYOURSAPI(lat,lon,destlat,destlon);
	routeOSRM(lat,lon,destlat,destlon);
}
function textElement(index, direction, distance, streetName, lat, lon, surface, poisLeft, poisRight) {
	this.index = index;
	this.direction = direction;
	this.distance = distance;
	this.streetName = streetName;
	this.lat = lat;
	this.lon = lon;
	this.surface = surface;
	this.poisLeft = poisLeft;
	this.poisRight = poisRight;
}
// write the routing text
function writeRoute(cords) {
	console.log(cords);
	var tempRoute = [];
	var distance,direction,degreesToNext;

	//we need another step to get to the start of the route
	var nextCoordinate = cords[0];
	console.log(nextCoordinate);
	console.log("located at: " +locatedLat + "," + locatedLon)
	
	distance = calcDistance(locatedLat, locatedLon,	nextCoordinate.lat, nextCoordinate.lon);
		
	if(detectmob()){
			checkCompass().done(function(compassvalue){
				degreesToNext = calcCompassBearing(nextCoordinate.lat, nextCoordinate.lon,locatedLat, locatedLon, compassvalue);
				direction = getDirectionForDegrees(degreesToNext);
				tempRoute.push(new tempEntry(direction, distance,locatedLat, locatedLon,""));
			});
		}
		else{
			//calculate the bearing to the first step of the route
			degreesToNext = calcCompassBearing(nextCoordinate.lat, nextCoordinate.lon,locatedLat, locatedLon,  0);
			direction = getDirectionForDegrees(degreesToNext);
			console.log("degrees to next " +  locatedLat+","+ locatedLon +" to " + nextCoordinate.lat + ","+ nextCoordinate.lon+ " is : "+ degreesToNext + " means " + direction + " dist: "+distance);
			tempRoute.push(new tempEntry(direction, distance, locatedLat, locatedLon,""));
		}
	$.each(cords, function(index, coordinate) {
		if (index <= (cords.length - 2)) {
			nextCoordinate = cords[index + 1];
			degreesToNext = calcBearing(coordinate.lat, coordinate.lon,nextCoordinate.lat, nextCoordinate.lon);
			direction = getDirectionForDegrees(degreesToNext);
			distance = calcDistance(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
			var way = getWayMatchForCord(coordinate.lat, coordinate.lon);
			console.log("degrees to next " +  coordinate.lat+","+ coordinate.lon +" to " + nextCoordinate.lat + ","+ nextCoordinate.lon+ " is : "+ degreesToNext +" means " + direction + " dist: "+distance);
			
			if(typeof way != "undefined"){
				tempRoute.push(new tempEntry(direction, distance, 	coordinate.lat, coordinate.lon,way));
			}
			else{
				tempRoute.push(new tempEntry(direction, distance, 	coordinate.lat, coordinate.lon,""));
			}
		}else{
			tempRoute.push(new tempEntry("end", 0, 	coordinate.lat, coordinate.lon,""));
		}
	});
	console.log(tempRoute);
	var cleanedRoute = cleanRoute(tempRoute);
	console.log(cleanedRoute);
	enricheWays(cleanedRoute).done(function(enrichedRoute){
		writeApp(enrichedRoute, "left");
		writeApp(enrichedRoute, "right");
	});
	
}
function waymatch(wayId, tags){
	this.wayId = wayId;
	this.tags = tags;
}

function distanceSort(a,b){
	if (a.distance < b.distance)
		return -1;
	if (a.distance > b.distance)
		return 1;
	return 0;
}
function getWayMatchForCord(lat, lon) {
	var match;
	$.each(waysOfRoute, function(index, wayCordMatch) {
		if ((wayCordMatch.lat == lat) && (wayCordMatch.lon == lon)) {
			match = new waymatch(wayCordMatch.wayId, wayCordMatch.tags);
			return false;
		}
	});
	return match;
}

function cleanRoute(route) {
	var finalRoute = new Array();
	//worst case: o(n^2), could be o(n)
	for ( var index = 0; index < route.length; index++) {
			var routeStep = route[index];
			console.log(routeStep);
			// if not the last one
			if (index <= (route.length - 2) && (index > 0)) {
					//get the next step
					var nextStep = route[index + 1];
					var isSame = isTheSame(routeStep,nextStep);
					var distSum = routeStep.distance;
					//if next and this are the same
					if(isSame){
						// compare until not anymore the same direction and wayId
						var counter = index +1;
						while(isTheSame(routeStep, nextStep)){
							var temp = distSum;
							distSum = temp + nextStep.distance;
							counter= counter + 1;
							var nextStep = route[counter ];
							index++;
						}
						var finalDistance = Math.round(distSum*1000);
						finalRoute.push(new tempEntry(routeStep.direction,finalDistance,  routeStep.lat,routeStep.lon,routeStep.way));
						
					}
					else{
						var finalDistance = Math.round(distSum*1000);
						finalRoute.push(new tempEntry(routeStep.direction,finalDistance,  routeStep.lat,routeStep.lon,routeStep.way));
					}
			} else if(index != 0){
				finalRoute.push(new tempEntry(routeStep.direction,Math.round(routeStep.distance*1000),routeStep.lat, routeStep.lon,routeStep.way));
			}
		}
	return finalRoute;
}
function isTheSame(routeStep,nextStep){
	if((routeStep.direction == "geradeaus weiterlaufen.")&& (nextStep.direction == "geradeaus weiterlaufen.")
			&& (routeStep.way.wayId = nextStep.way.wayId)){
		return true;
	}else{
		return false;
	}
}

function tempEntry(direction, distance,  lat, lon, way) {
	this.direction = direction;
	this.distance = distance;
	this.lat = lat;
	this.lon = lon;
	this.way = way;
}

function writeApp(list, side) {
	console.log(list);
	var html = "<div data-role=\"collapsible-set\" data-theme=\"c\" data-content-theme=\"d\">";
	$.each(list,function(index, routeStep) {
			var indexIncr = (index + 1);
			//first step
			if (index == 0) {
					html = html.concat("<p class=\"firstRouteStep\">"+ indexIncr	+ ". Route beginnt in " + routeStep.distance +" Meter, Sie müssen " + routeStep.direction +" </p>");
					console.log( "Route beginnt in " + routeStep.distance +" Meter, Sie müssen " + routeStep.direction );
			} 
			//last step
			else if (index == (list.length - 1)) {
					html = html.concat("<p class=\"firstRouteStep\">"+ indexIncr+ ". Sie haben Ihr Ziel erreicht.</p>");
					if(side == "left"){
						$('#routingDirections').html(html + "</div>");
						$('#routingDirections').trigger('create');
						$('#contentRouting').trigger('create');
					}
					else{
						$('#routingDirectionsRight').html(html + "</div>");
						$('#contentRoutingRight').trigger('create');
					}
			} else {
					if(side == "left"){
					   getCollapsibleForTags(indexIncr, routeStep, routeStep.opsLeft).done(function(collapsible){
						   html = html.concat(collapsible);
						});
					}else{
						  getCollapsibleForTags(indexIncr, routeStep, routeStep.opsRight).done(function(collapsible){
							   html = html.concat(collapsible);
						});
					}
					
			}
			
	});

	
}
function getCollapsibleForTags(index,routestep, navipois){
	var deferred = $.Deferred();
	var typeOfWay = typeof routestep.tags != "undefined" ? getTypeOfWay(routestep.tags) : "Strasse";
	var collapsible = "<div data-role=\"collapsible\" data-mini=\"true\" class=\"routingcollapsible\" data-collapsed-icon=\"arrow-r\" data-iconpos=\"right\" data-expanded-icon=\"arrow-d\" id=\" "+ index + "\" >";
	var paragraph = "<p class=\"firstRouteStep\">";
	var head4;
	var result = "";
	if(navipois.length > 0){
		console.log("has navipois");
		head4 = "<h4> " + index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +"</h4>"; 
		collapsible = collapsible.concat(head4);
		$.each(navipois, function(i, poi){
			var distrounded = Math.round(poi.distance*1000);
			var poiname = getKindOfPoi(poi.keyword) != "Unbekannt" ?  getKindOfPoi(poi.keyword) : poi.keyword;
			paragraph = paragraph.concat( poiname + " nach " +distrounded + " Meter <br>");
			if(i == (navipois.length-1)){
				collapsible = collapsible.concat(paragraph);
			}
		});
		
	}
	if(typeof routestep.tags != "undefined" ){
		head4 = "<h4> " + index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +"</h4>"; 
		if(typeof routestep.tags.surface != "undefined"){
			var surface = getSurface(routestep.tags.surface);
			if(routestep.tags.surface !="paved"){
			if(collapsible.indexOf("h4") == -1){
				collapsible = collapsible.concat(head4);
			}
			paragraph = paragraph.concat("Belag: " + surface + "<br>");
			collapsible = collapsible.concat(paragraph);
			}
		}
		if(typeof routestep.tags.maxspeed != "undefined"){
			if(collapsible.indexOf("h4") == -1){
				collapsible = collapsible.concat(head4);
			}
			paragraph = paragraph.concat("Höchstgeschwindigkeit: " + routestep.tags.maxspeed + " kmh <br>");
			collapsible = collapsible.concat(paragraph);
		} 
	}
	if(paragraph != "<p class=\"firstRouteStep\">"){
		collapsible = collapsible.concat("</p></div>");
		deferred.resolve(collapsible);
	}else{
		deferred.resolve(paragraph.concat(index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +"</p>"));
	}
	return deferred;
}



function calculateBuffer(lat, lon, nextlat, nextlon, width) {
	var linestring = [];
	linestring.push([ lat, lon ], [ nextlat, nextlon ]);
	var geoInput = {
		type : "LineString",
		coordinates : linestring
	};

	var reader = new jsts.io.GeoJSONReader();
	var writer = new jsts.io.GeoJSONWriter();
	var geometry = reader.read(geoInput).buffer(width / 111.12);
	return writer.write(geometry);
}

function calculateSideBuffers(lat, lon, nextlat, nextlon, wayBearing) {
	var leftStartCoords = calculateCoordinates(lat, lon, (wayBearing - 90));
	var leftEndCoords = calculateCoordinates(nextlat, nextlon,
			(wayBearing - 90));
	var rightStartCoords = calculateCoordinates(lat, lon, (wayBearing + 90));
	var rightEndCoords = calculateCoordinates(nextlat, nextlon,
			(wayBearing + 90));

	var leftBuffer = calculateBuffer(leftStartCoords.lat, leftStartCoords.lon,
			leftEndCoords.lat, leftEndCoords.lon, (streetWidth / 2));
	var rightBuffer = calculateBuffer(rightStartCoords.lat,
			rightStartCoords.lon, rightEndCoords.lat, rightEndCoords.lon,
			(streetWidth / 2));
	var buffers = [ leftBuffer, rightBuffer ];
	return buffers;
}

function calculateCoordinates(lat, lon, bearing) {
	bearing = transformBearing(bearing);
	var rlon;
	var dif = streetWidth / 2 / 6371.01;
	var rlat1 = deg2rad(lat);
	var rlon1 = deg2rad(lon);
	var rbearing = deg2rad(bearing);
	var rlat = Math.asin(Math.sin(rlat1) * Math.cos(dif) + Math.cos(rlat1)* Math.sin(dif) * Math.cos(rbearing));
	
	if (Math.cos(rlat) == 0 || Math.abs(Math.cos(rlat)) < 0.000001)
		rlon = rlon1;
	else {
		rlon = ((rlon1- Math.asin(Math.sin(-rbearing) * Math.sin(dif)/ Math.cos(rlat)) + Math.PI) % (2 * Math.PI))- Math.PI;
	}
	return new coordPair(rad2deg(rlat), rad2deg(rlon));
}

function sortArray(array) {
	for ( var i = 0; i < array.length; i++) {
		array[i].sort(function(a, b) {
			if (a.distance < b.distance)
				return -1;
			if (a.distance > b.distance)
				return 1;
			return 0;
		});
	}
}