var destlat, destlon;
var routeStart, routeEnd;
var reverseroute = false;
var meterRounder = 1000;
var rounding = 0.0005;

function refreshRoute(){
	getGPSLocation().done(function(){
		getRoute(locatedLat, locatedLon, destlat,destlon, reverseroute);
		$( "#routingDirectionsRight").empty();
		$( "#routingDirections").empty();
	});
}

function reverseRoute(){
	$( "#routingDirectionsRight").empty();
	$( "#routingDirections").empty();
	
	var oldTitle = $('#titleroutingleft').text();
	var oldfrom = oldTitle.split('nach');
	var newTitle = "Route von " + oldfrom[1] + " nach " + oldfrom[0].split('von')[1];
	
	$('#titleroutingleft').text(newTitle);
	$('#titleroutingright').text(newTitle);
	$('#locationOutput').text(oldfrom[1]); 
	
	locatedLat = routeEnd.x;
	locatedLon = routeEnd.y;
	destlat = routeStart.x;
	destlon = routeStart.y;
	reverseroute = true;

	getRoute(routeEnd.x, routeEnd.y,routeStart.x, routeStart.y, reverseroute);
}
function getRoute(lat,lon,destlat, destlon, reverseroute) {
		
	routeStart = new point(lat,lon);
	routeEnd = new point(destlat,destlon);
	
	locatedLat = routeStart.x;
	locatedLon = routeStart.y;
	
	getRouteOSRM(lat,lon,destlat,destlon, reverseroute);
}
function writeHTMLButtons(){
	$('#routingviewright').html('<a href="#" data-icon="refresh" onClick="refreshRoute();"  data-role="button" >Route aktualisieren</a>'+
			'<a href="#" data-icon="back" onClick="reverseRoute();" data-role="button" >Route umkehren</a>'+
				'<div class="ui-bar-c"  ><div class="ui-grid-a"><div class="ui-block-a"><h3>Rechte Strassenseite</h3></div>'+
				'<div class="ui-block-b"><a href="#routing" data-icon="arrow-l" data-role="button" data-mini="true">zeige linke Seite</a>'+
			'</div></div>');
	$('#routingviewleft').html('<a href="#" data-icon="refresh" onClick="refreshRoute();"  data-role="button" >Route aktualisieren</a>'+
			'<a href="#" data-icon="back" onClick="reverseRoute();" data-role="button" >Route umkehren</a>'+
				'<div class="ui-bar-c"  ><div class="ui-grid-a"><div class="ui-block-a"><h3>Linke Strassenseite</h3></div>'+
				'<div class="ui-block-b"><a href="#routingRight" data-icon="arrow-r" data-role="button" data-mini="true">zeige rechte Seite</a>'+
			'</div></div>');
}
// write the routing text
function writeRoute(cords, wayVectors) {
	writeHTMLButtons();
	var tempRoute = [];
	var distance,direction,degreesToNext;
	var degreesToOverNext, azimuth;

	var nextCoordinate = cords[0];
	var overNextCoordinate = cords[1];
	distance = calcDistance(routeStart.x, routeStart.y,	nextCoordinate.lat, nextCoordinate.lon);
	
	//we need another step to get to the start of the route
	//if we're on a mobile device we have a compass
	checkCompass().done(function(compassvalue){
		if(distance >= rounding){
			degreesFromStart = calcCompassBearing(nextCoordinate.lat, nextCoordinate.lon,locatedLat, locatedLon,compassvalue);
			degreesToNext = normaliseBearing(calcBearing(locatedLat, locatedLon, nextCoordinate.lat, nextCoordinate.lon));
			degreesToOverNext =normaliseBearing(calcBearing(nextCoordinate.lat, nextCoordinate.lon,overNextCoordinate.lat, overNextCoordinate.lon));
			
			azimuth = getAzimuth(degreesToNext,degreesToOverNext);
			direction = getDirectionForDegrees(degreesFromStart) + ", " + getDirectionForDegrees(azimuth)+".";
		}else{
			degreesToNext = calcCompassBearing(overNextCoordinate.lat, overNextCoordinate.lon,locatedLat, locatedLon, compassvalue);
			direction = getDirectionForDegrees(degreesToNext);
		}
		tempRoute.push(new tempEntry(direction, distance, locatedLat, locatedLon,degreesToNext,""));

		//rest of the route
		$.each(cords, function(index, coordinate) {
			if (index < (cords.length - 2)) {
				nextCoordinate = cords[index + 1];
				degreesToNext = calcBearing(coordinate.lat, coordinate.lon,nextCoordinate.lat, nextCoordinate.lon);
				
				overNextCoordinate =  cords[index + 2];
				degreesToOverNext = calcBearing(nextCoordinate.lat, nextCoordinate.lon,overNextCoordinate.lat, overNextCoordinate.lon, 0);
				azimuth = getAzimuth(degreesToNext,degreesToOverNext);
				
				direction = getDirectionForDegrees(azimuth);
				distance = calcDistance(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
				
				var way = getWayMatchForCord(coordinate.lat, coordinate.lon);
				
				if(typeof way != "undefined"){
					tempRoute.push(new tempEntry(direction, distance, coordinate.lat, coordinate.lon,degreesToNext,way));
				}
				else{
					tempRoute.push(new tempEntry(direction, distance, coordinate.lat, coordinate.lon,degreesToNext,""));
				}
			}else if(index == (cords.length-2)){
				nextCoordinate = cords[index + 1];
				degreesToNext = normaliseBearing(calcBearing(coordinate.lat, coordinate.lon,nextCoordinate.lat, nextCoordinate.lon));
				degreesToOverNext = normaliseBearing(calcBearing(nextCoordinate.lat, nextCoordinate.lon, destlat, destlon));
				distance = calcDistance(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
				
				azimuth = getAzimuth(degreesToNext, degreesToOverNext);
				direction = getDirectionForDegrees(azimuth);
				
				var way = getWayMatchForCord(coordinate.lat, coordinate.lon);
				tempRoute.push(new tempEntry(direction, distance, coordinate.lat, coordinate.lon,degreesToNext,way));
			}
			else{
				tempRoute.push(new tempEntry("end", 0, 	coordinate.lat, coordinate.lon,"",""));
			}
		});
		var cleanedRoute = cleanRoute(tempRoute);
		var warnings = getIsecWarnings(wayVectors);
		enricheWays(cleanedRoute, warnings).done(function(enrichedRoute){
			writeApp(enrichedRoute, "left");
			writeApp(enrichedRoute, "right");
		});
	});
}

function getWayMatchForCord(lat, lon) {
	var match;
	$.each(wayPerCord, function(index, wayCordMatch) {
		if ((wayCordMatch.lat == lat) && (wayCordMatch.lon == lon)) {
			match = new way(wayCordMatch.wayId, wayCordMatch.tags);
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
			// if not the last one
			if (index <= (route.length - 2) && (index > 0)) {
					//get the next step
					var nextStep = route[index + 1];
					var distSum = routeStep.distance;
					//if next and this are the same
					if(isTheSame(routeStep,nextStep)){
						// compare until not anymore the same direction and wayId
						var counter = index +1;
						var preStep = routeStep;
						while(isTheSame(preStep, nextStep)){
							var temp = distSum;
							distSum = temp + nextStep.distance;
							counter= counter + 1;
							preStep = nextStep;
							nextStep = route[counter];
							index++;
						}
						var finalDistance = Math.round(distSum*meterRounder);
						finalRoute.push(new tempEntry(preStep.direction,finalDistance, routeStep.lat,routeStep.lon,preStep.bearingtoNext,routeStep.way));
					}
					else{
						var finalDistance = Math.round(distSum*meterRounder);
						finalRoute.push(new tempEntry(routeStep.direction,finalDistance, routeStep.lat,routeStep.lon,routeStep.bearingtoNext,routeStep.way));
					}
			} else if(index !== 0){
				finalRoute.push(new tempEntry(routeStep.direction,Math.round(routeStep.distance*meterRounder),routeStep.lat, routeStep.lon,routeStep.bearingtoNext,routeStep.way));
			}else{
				finalRoute.push(new tempEntry(routeStep.direction,Math.round(routeStep.distance*meterRounder),routeStep.lat, routeStep.lon,routeStep.bearingtoNext,routeStep.way));
				
			}
		}
	return finalRoute;
}
function isTheSame(routeStep,nextStep){
	if((typeof routeStep.way !== "undefined") && (routeStep.way != "") && (routeStep.direction === "geradeaus weiterlaufen")&& (typeof nextStep.way != "undefined") &&( nextStep.way !="")&&(routeStep.way.wayId === nextStep.way.wayId)){
			return true;
		
	}else{
		return false;
	}
}

function writeApp(list, side) {
	var degreesOfRoute = [];
	var html = '<div data-role="collapsible-set" data-theme="c" data-content-theme="d">';	
	$.each(list,function(index, routeStep) {
		var indexIncr = (index + 1);
		
		//first step
		if (index === 0) {
			if(routeStep.distance !== 0){
				var directionsplit = routeStep.direction.split(',');
				html = html.concat('<p class="firstRouteStep">'+ indexIncr	+ ". Sie müssen " +directionsplit[0]+ ". Laufen Sie " + routeStep.distance +" Meter, dann "+directionsplit[1]+'</p>');
			}else{
				var direction = routeStep.direction.charAt(0).toUpperCase()+ routeStep.direction.slice(1);
				html = html.concat('<p class="firstRouteStep">'+ indexIncr	+ ". "+direction+'</p>');
			}
				
		} 
		//last step
		else if (index === (list.length - 1)) {
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
			degreesOfRoute.push(calcBearing(routeStep.lat, routeStep.lon, list[indexIncr].lat, list[indexIncr].lon));
			if(side == "left"){
			   getCollapsibleForTags(indexIncr, routeStep, routeStep.opsLeft, degreesOfRoute[index-1]).done(function(collapsible){
				   html = html.concat(collapsible);
				});
			}else{
				  getCollapsibleForTags(indexIncr, routeStep, routeStep.opsRight, degreesOfRoute[index-1]).done(function(collapsible){
					   html = html.concat(collapsible);
				});
			}
		}
	});
}
function getCollapsibleForTags(index,routestep, navipois, degreesToNext){
	var deferred = $.Deferred();
	var typeOfWay = typeof routestep.tags != "undefined" ? getTypeOfWay(routestep.tags) : "Strasse";
	var collapsible = '<div data-role="collapsible" data-mini="true" class="routingcollapsible" data-collapsed-icon="arrow-r" data-iconpos="right" data-expanded-icon="arrow-d" id=" '+ index + '" >';
	var paragraph = "<p class=\"firstRouteStep\">";
	var head4;
	var result = "";
	if(navipois.length > 0){
		head4 = "<h4> " + index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +".</h4>"; 
		collapsible = collapsible.concat(head4);
		$.each(navipois, function(i, poi){
			var clock = getClock(calcCompassBearing(poi.lat, poi.lon,routestep.lat, routestep.lon, normaliseBearing(degreesToNext)));
			if((clock > 9)||(clock<3)) {
				var distrounded = Math.round(poi.distance*meterRounder);
				var poiname = getKindOfPoi(poi.keyword) != "Unbekannt" ?  getKindOfPoi(poi.keyword) : poi.keyword;
				paragraph = paragraph.concat( poiname + " nach " +distrounded + " Meter <br>");
			}
		});
	}
	if(typeof routestep.tags != "undefined" ){
		head4 = "<h4> " + index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +".</h4>"; 
		if(typeof routestep.tags.surface != "undefined"){
			var surface = getSurface(routestep.tags.surface);
			if(surface !=="-"){
				if(collapsible.indexOf("h4") == -1){
					collapsible = collapsible.concat(head4);
				}
				paragraph = paragraph.concat("Belag: " + surface + "<br>");
			}
		}
		if(typeof routestep.tags.maxspeed != "undefined"){
			if(collapsible.indexOf("h4") == -1){
				collapsible = collapsible.concat(head4);
			}
			paragraph = paragraph.concat("Höchstgeschwindigkeit: " + routestep.tags.maxspeed + " km/h <br>");
		} 
	}
	collapsible = collapsible.concat(paragraph);
	if(paragraph != "<p class=\"firstRouteStep\">"){
		collapsible = collapsible.concat("</p></div>");
		deferred.resolve(collapsible);
	}else{
		deferred.resolve(paragraph.concat(index + ". " + typeOfWay + " für " + routestep.distance + " Meter folgen, dann " + routestep.direction +".</h4>"));
	}
	return deferred;
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