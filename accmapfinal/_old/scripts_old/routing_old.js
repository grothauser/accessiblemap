var routedIndexes = new Array();
var extendedIndexes = new Array();
var directions = new Array();
var typeOfWays = new Array();
var distances = new Array();

function getRoute() {
	localStorage.setItem("key", "wert");
	var item = localStorage.getItem("key");
	var service = $('input[name=routingService]:checked', '#coordinates').val();
	if (service == 'osm-ch') {
		routeOSRMAPI();
	} else if (service == 'zurich') {
		routeZurich();
	} else {
		routeYOURSAPI();
	}
}
// write the routing text
function writeRoute(selPoi) {

	// calc distances and directions
	$.each(cordsOfRoute, function(index, coordinate) {

		// if not already written
		if ($.inArray(index, routedIndexes) == -1) {
			routedIndexes.push(index);
			var element = $('#' + index);
			// if it's not the last point
			if (index != (cordsOfRoute.length - 1)) {

				// get next coordinate
				var nextCoordinate = cordsOfRoute[index + 1];

				// calculate the distance
				var dist = calcDistance(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon);

				// round on 4 digits
				var distRounded = Math.round(dist * 1000);
				distances[index] = distRounded;

				// get degrees to next node
				var degreesToNext = calcBearing(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, 0);
				
				//if not secondlast
				if(index != (cordsOfRoute.length - 2)){
				
					// get degrees from next to overnext node
					var overNextCoordinate = cordsOfRoute[index + 2];
					var degreesToOverNext = calcBearing(nextCoordinate.lat, nextCoordinate.lon,overNextCoordinate.lat, overNextCoordinate.lon, 0);
					
					//get direction
					var azimuth = degreesToOverNext - degreesToNext;
					var direction,deg;
					if(azimuth < 0)
						deg = 360 + azimuth;
					else
						deg = azimuth;
					direction = getDirectionForDegrees(deg);
				}
				//if secondlast
				else if(index == (cordsOfRoute.length - 2))
					direction = "direkt vor Ihnen.";
				
				element.append("Strasse für " + distRounded + "m folgen");
				element.append(", dann " + direction);

			} else if(index == (cordsOfRoute.length-1)) {
				element.append(" Sie haben Ihr Ziel erreicht.");
			}
		}
	});

	// get the streetInfos
	$.each(wayPerCord, function(index, way) {

		if ($.inArray(index, extendedIndexes) == -1) {
			extendedIndexes.push(index);
			var streetElement = $('#' + way.index);

			//get type of way
			typeOfWay = getTypeOfWay(way.tags.highway);

			//if other than street -> change text
			if (typeOfWay != "Strasse") {
				
				//check for bridges
				var bridge = typeof way.tags.bridge != "undefined" ? way.tags.bridge : "no";

				if (bridge != "no") {
					var oldText = streetElement.text();
					var newText = oldText.replace("Strasse", "Brücke");
					streetElement.text(newText);
				}
				
				//check for tunnels
				var tunnel = typeof way.tags.tunnel != "undefined" ? way.tags.tunnel : "no";

				if (tunnel != "no") {
					var oldText = streetElement.text();
					var newText = oldText.replace("Strasse", "Tunnel");
					streetElement.text(newText);
				}

				//if just a street 
				if((bridge =="no" )&& (tunnel == "no")){
					var oldText = streetElement.text();
					var newText = oldText.replace("Strasse", typeOfWay);
					streetElement.text(newText);
				}
				
			} else {
				//get streetname, if defined
				var name = typeof way.tags.name != "undefined" ? way.tags.name : "-";

				if (name != "-") {
					var oldText = streetElement.text();
					var newText = oldText.replace("Strasse", name);
					streetElement.text(newText);
				}
			}
			
			//get surface
			var surface = getSurface(way.tags.surface);
			if (surface != "-") {
				streetElement.append("<br> Belag: " + surface);
			}
			
			var orientPoint = fillSelPoiInfo(selPoi, way.wayId);
			console.log("orientPoint");
			console.log(orientPoint);
			for(var i=0;i<orientPoint.length; i++)
				streetElement.append("<br> "+orientPoint[i].split(",")[0]+": "+orientPoint[i].split(",")[1])
		}
	});
}
function calcBearing(lat1,lon1,lat2,lon2){
	//source : http://www.movable-type.co.uk/scripts/latlong.html
		var lat1 = deg2rad(lat1);
		var lat2 = deg2rad(lat2);
		var dLat = deg2rad(lat2-lat1);
		var dLon = deg2rad(lon2-lon1);
		var y = Math.sin(dLon) * Math.cos(lat2);
		var x = Math.cos(lat1)*Math.sin(lat2) -
		        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
		var brng = rad2deg(Math.atan2(y, x));
		return brng;
}
function getSurface(surface) {
	var type = "-";
	switch (surface) {
	case "dirt":
	case "earth":
	case "ground":
		type = "unbefestigte Strasse";
		break;
	case "asphalt":
		type = "Asphalt";
		break;
	case "sett":
		type = "Behauenes Steinpflaster";
		break;
	case "cobblestone":
		type = "Pflasterstein";
		break;
	case "concrete":
		type = "Beton";
		break;
	case "unpaved":
		type = "ohne Strassenbelag";
		break;
	case "fine_gravel":
		type = "Splitt oder Kies";
		break;
	case "grass":
		type = "Wiese";
		break;
	case "gravel":
		type = "Schotter";
		break;
	case "grass_paver":
		type = "Rasengittersteine";
		break;
	case "ice":
		type = "führt übers Eis";
		break;
	case "metal":
		type = "Metall";
		break;
	case "mud":
		type = "Schlamm";
		break;
	case "pebblestone":
		type = "loser Kies";
		break;
	case "sand":
		type = "Sand";
		break;
	case "wood":
		type = "Holz";
		break;
	default:
		type = "-";
		break;
	}
	return type;
}
function getTypeOfWay(highway) {
	var type = "Strasse";
	switch (highway) {
	case "steps":
		type = "Treppe";
		break;
	case "residential":
		type = "Strasse";
		break;
	case "footway":
		type = "Fussweg";
		break;
	default:
		type = "Strasse";
		break;
	}
	return type;
}
function getDirectionForDegrees(deg) {
	if ((deg > 22.5) && (deg < 57.5)) {
		return "leicht rechts abbiegen. ";
	} else if ((deg >= 57.5) && (deg < 112.5)) {
		return "rechts abbiegen.";
	} else if ((deg >= 112.5) && (deg < 180)) {
		return "scharf rechts abbiegen.";
	} else if (deg == 180) {
		return "umdrehen.";
	} else if ((deg > 180) && (deg < 247.5)) {
		return "scharf links abbiegen.";
	} else if ((deg >= 247.5) && (deg < 292.5)) {
		return "links abbiegen.";
	} else if ((deg >= 292.5) && (deg < 337.5)) {
		return "leicht links abbiegen.";
	} else if ((deg >= 337.5) || (deg < 22.5)) {
		return "gerade aus weiterlaufen.";
	}

	else {
		console.log(deg);
		return "";
	}

}
function getCoordWayMatch(lat, lon) {
	var deferred = $.Deferred();
	$.each(wayPerCord, function(i, way) {
		if (way.lat == lat) {
			if (way.lon == lon) {
				deferred.resolve(way);
			}

		} else if (i == (wayPerCord.length - 1)) {
			deferred.resolve("");
		}
	});
	return deferred;
}

function fillSelPoiInfo(array, wayId){
	var selPoint = [];
	for(var i=0; i<array.length; i++){
		if(selPoi[i].split(",")[2]== wayId)
			selPoint.push(array[i]);
	}
	return selPoint;
}