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

function getRoute() {
	routeYOURSAPI(47.38339,8.534767,47.379943,8.537232);
	//routeOSRM(47.376434,8.53268,47.377375,8.529912);
}
function textElement(index, direction, distance, streetName, lat, lon, surface) {
	this.index = index;
	this.direction = direction;
	this.distance = distance;
	this.streetName = streetName;
	this.lat = lat;
	this.lon = lon;
	this.surface = surface;
}
// write the routing text
function writeRoute(selPoi) {
	console.log(selPoi);
	// sort by index
	wayPerCord.sort(function(a, b) {
		return a.index - b.index;
	});
	
	// create index values for route
	for ( var i = 0; i < cordsOfRoute.length + 2; i++) {
			indexValues.push(i);
	}

	// get the streetInfos
	$.each(cordsOfRoute, function(index, coordinate) {
		if ($.inArray(index, routedIndexes) == -1) {
			routedIndexes.push(index);
			var coordinate = cordsOfRoute[index];
			var nextCoordinate = cordsOfRoute[index + 1];
			var direction = null;

			// if it's the first point
			if (index == 0) {
				var angle;
				if (detectmob()) {
					checkCompass().done(function(alpha) {
						angle = alpha;
					});
				} else {
					angle = 0;
					var degreesToNext = calcBearing(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon);
					var startDirection = getClock(getHeading(angle, degreesToNext));
					var startDistance  = calcDistance(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon);
					textArray.push(new textElement(index, startDirection,startDistance));
				}
			}
			//if last point
			if (index == (cordsOfRoute.length - 1)) {
				textArray.push(new textElement(indexValues[cordsOfRoute.length]));
			}
			//if in the middle of the route
			else {
				var distRounded = Math.round(calcDistance(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon) * 1000);
				//distances.push(distRounded);
				var degreesToNext = calcBearing(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon);

				var buffer = calculateBuffer(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, streetWidth);
				var poisInStreetSegment = getPointsInBuffer(buffer, selPoi);

				// right & left streetside
				var sideBuffers = calculateSideBuffers(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, degreesToNext);

				// only find Points in Buffer
				var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], selPoi);
				poisInLeftStreetSegment.sort(function(a, b) {
					if (a.distance < b.distance)
						return -1;
					if (a.distance > b.distance)
						return 1;
					return 0;
				});

				var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], selPoi);
				poisInRightStreetSegment.sort(function(a, b) {
					if (a.distance < b.distance)
						return -1;
					if (a.distance > b.distance)
						return 1;
					return 0;
				});

				// if not secondlast
				if (index != (cordsOfRoute.length - 2)) {
					// get degrees from next to overnext node
					var overNextCoordinate = cordsOfRoute[index + 2];
					var degreesToOverNext = calcBearing(nextCoordinate.lat, nextCoordinate.lon, overNextCoordinate.lat, overNextCoordinate.lon);

					// get direction
					var deg = getHeading(degreesToNext,degreesToOverNext)
					direction = getDirectionForDegrees(deg);
					directions.push(direction);
				}
				// if secondlast
				else if (index == (cordsOfRoute.length - 2)){
					direction = "direkt vor Ihnen.";
					// fill common street information for text
					textArray.push(new textElement(index + 1, direction, distRounded, "Strasse", coordinate.lat, coordinate.lon, ""));

					// write selected POIs
					naviPois.push(writeSidePois( poisInStreetSegment, coordinate.lat, coordinate.lon, degreesToNext, distRounded))
					naviLeftPois.push(writeSidePois(poisInLeftStreetSegment, coordinate.lat, coordinate.lon, degreesToNext, distRounded));
					naviRightPois.push(writeSidePois(poisInRightStreetSegment, coordinate.lat, coordinate.lon, degreesToNext, distRounded));
		}
			}
		}
	});

	// enrich with Way-info
	$.each(cordsOfRoute, function(index, coordinate) {
		if (wayPerCord.length !== 0) {

			// check if continuously same wayId
			var way, nextWay, counter = 0, found = false;
			for ( var i = 0; i < wayPerCord.length; i++) {
				if (found == true)
					break;
				if (wayPerCord[i].index == index) {
					found = true;
					way = wayPerCord[i];
					if (i !== wayPerCord.length - 1) {
						if (wayPerCord[i + 1].index == (index + 1))
							nextWay = wayPerCord[i + 1];
						else
							nextWay = null;
					} else
						nextWay = null;
				} else 
					way = null;
			}

			// check if street has way info
			if ((way !== null) && (nextWay !== null) && (way.wayId == nextWay.wayId) &&
					(directions[index] == "geradeaus weiterlaufen.") ){
							textArray[index + 1].index = -1;
							if ($.inArray(index, modifiedDist) == -1) {
								changeDistAndIndex(index, index + 1);
								modifiedDist.push(index);

								changePoiAttributes(naviPois, index, index + 1);
								changePoiAttributes(naviLeftPois, index, index + 1);
								changePoiAttributes(naviRightPois, index, index + 1);
							}

				// set Indexes because of combined routes
				textArray[index + 1].distance = distances[index];
				for ( var i = 0; i < textArray.length; i++) {
					if (textArray[i].index !== -1) {
						textArray[i].index = indexValues[i];
					}
				}
				// get type of way
				textArray[index + 1].streetName = getTypeOfWay(way.tags);

				// get surface
				var surface = getSurface(way.tags.surface);
				if (surface != "-") {
					textArray[index + 1].surface = surface;
				}
			}
		}
	});
	sortArray(naviPois);
	sortArray(naviLeftPois);
	sortArray(naviRightPois);
	var finalArray = new Array();
	$.each(textArray, function(i, elem){
		if(elem.index != -1){
			finalArray.push(elem);
			
		}
	})
	writeToApp(finalArray);
	console.log(naviLeftPois);
}

function writeToApp(list){
	var html = "<div data-role=\"collapsible-set\" data-theme=\"c\" data-content-theme=\"d\">";
	//"<div data-role=\"collapsible\" data-mini=\"true\"  data-collapsed-icon=\"arrow-r\" data-expanded-icon=\"arrow-d\" id=\"1\">" +
//"<h4> hallo </h4> <p> test </p> </div> </div>";		
	var paragraph = "";
	$.each(list, function(index, text){
		
		var indexIncr = (index + 1);
		if(index == 0){
			html = html.concat("<p class=\"firstRouteStep\">" + indexIncr +". Route beginnt in Richtung " + text.direction + " Uhr </p>");
		}else{
			if(index == (list.length-1)){
				html = html.concat("<p class=\"firstRouteStep\">" + indexIncr +". Sie haben Ihr Ziel erreicht.</p>");
			}else{
				
				if(text.surface != "" ){
					paragraph = "<p class=\"streetInfo\">";
					paragraph = paragraph.concat("Belag: " + text.surface + " <br>") ;
					
				}
				if(naviLeftPois.length > 0){
					paragraph = paragraph.concat(naviLeftPois[index]);
				}
//				for ( var k = 0; k < naviLeftPois[index - 1].length; k++) {
//					console.log(naviLeftPois[index - 1][k]);
//					if (naviLeftPois[index - 1][k].distance == 0) {
//						paragraph = paragraph.concat(naviLeftPois[index - 1][k].keyword	+ " an dieser Kreuzung.");
//					} else
//						paragraph = paragraph.concat(naviLeftPois[index - 1][k].keyword
//												+ " in "
//												+ naviLeftPois[index - 1][k].distance
//												+ " Meter Entfernung auf "
//												+ naviLeftPois[index - 1][k].clock
//												+ " Uhr.");
//				}
				if(paragraph != ""){
					console.log("has info for step " + index);
					html = html.concat("<div data-role=\"collapsible\" data-mini=\"true\"  data-collapsed-icon=\"arrow-r\" data-expanded-icon=\"arrow-d\" id=\""+ indexIncr +"\">");
					html = html.concat("<h4>" + indexIncr +". " + text.streetName + " für " + text.distance + " Meter folgen, dann " + text.direction +"</h4>");
					html = html.concat(paragraph + "</p>");
				}
				else{
					html = html.concat("<p class=\"firstRouteStep\">" + indexIncr +". " + text.streetName + " für " + text.distance + " Meter folgen, dann " + text.direction +"</p>");
				}
				html = html.concat("</div>");
			}
		}
		 
	});

	$('#routingDirections').html(html+"</div>");
	$('#contentRouting').trigger('create');
}

function writeHTML(){
	for ( var i = 0; i < textArray.length; i++) {
		var actual = textArray[i];
		if (i == 0)
			$('#' + i).append(
					(actual.index + 1) + ". Route beginnt in Richtung "
							+ textArray[i].direction + " Uhr.");
		else if (i == textArray.length - 1) {
			$('#' + i).append("Sie haben Ihr Ziel erreicht");
		} else {
			if (actual.index !== -1) {
				// if route endpoint not on node
				if (actual.distance !== 0) {
					$('#' + i).append(
							(actual.index + 1) + ". " + actual.streetName + " "
									+ actual.distance + " Meter folgen, dann "
									+ actual.direction);
					if (actual.surface !== "") {
						$('#' + i).append("</br> Belag: " + actual.surface);
					}
					if (naviPois[i - 1].length > 0) {
						$('#' + i).append("</br> Orientierungspunkte:");
						for ( var k = 0; k < naviPois[i - 1].length; k++) {
							if (naviPois[i - 1][k].distance == 0) {
								$('#' + i).append(
										" " + naviPois[i - 1][k].keyword
												+ " an dieser Kreuzung.");
							} else
								$('#' + i).append(
										" " + naviPois[i - 1][k].keyword
												+ " in "
												+ naviPois[i - 1][k].distance
												+ " Meter Entfernung auf "
												+ naviPois[i - 1][k].clock
												+ " Uhr.");
						}
					}
					if (naviLeftPois[i - 1].length > 0) {
						$('#' + i).append("</br> links:");
						for ( var k = 0; k < naviLeftPois[i - 1].length; k++) {
							if (naviLeftPois[i - 1][k].distance == 0) {
								$('#' + i).append(
										" " + naviLeftPois[i - 1][k].keyword
												+ " an dieser Kreuzung.");
							} else
								$('#' + i)
										.append(
												" "
														+ naviLeftPois[i - 1][k].keyword
														+ " in "
														+ naviLeftPois[i - 1][k].distance
														+ " Meter Entfernung auf "
														+ naviLeftPois[i - 1][k].clock
														+ " Uhr.");
						}
					}
					if (naviRightPois[i - 1].length > 0) {
						$('#' + i).append("</br> rechts:");
						for ( var k = 0; k < naviRightPois[i - 1].length; k++) {
							if (naviRightPois[i - 1][k].distance == 0) {
								$('#' + i).append(
										" " + naviRightPois[i - 1][k].keyword
												+ " an dieser Kreuzung.");
							} else
								$('#' + i)
										.append(
												" "
														+ naviRightPois[i - 1][k].keyword
														+ " in "
														+ naviRightPois[i - 1][k].distance
														+ " Meter Entfernung auf "
														+ naviRightPois[i - 1][k].clock
														+ " Uhr.");
						}
					}
				} else
					$('#' + i).remove();
			} else
				$('#' + i).remove();
		}
	}
}



function calcBearing(lat1, lon1, lat2, lon2) {
	// source : http://www.movable-type.co.uk/scripts/latlong.html
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);
	var dLat = deg2rad(lat2 - lat1);
	var dLon = deg2rad(lon2 - lon1);
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)
			* Math.cos(dLon);
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
	}
	return type;
}

function getTypeOfWay(wayTags) {
	var type;
	switch (wayTags.highway) {
	case "steps":
		type = "Treppe";
		break;
	case "footway":
	case "path":
	case "pedestrian":
		type = "Fussweg";
		break;
	default:
		type = "Strasse";
	}

	// if other than default -> change text
	if (type != "Strasse") {
		// check for bridges
		var bridge = typeof wayTags.bridge != "undefined" ? wayTags.bridge
				: "no";
		if (bridge != "no") {
			return "Brücke";
		}
		// check for tunnels
		var tunnel = typeof wayTags.tunnel != "undefined" ? wayTags.tunnel
				: "no";
		if (tunnel != "no") {
			return "Tunnel";
		}
		// if none of the above
		if ((bridge == "no") && (tunnel == "no")) {
			return type;
		}
	} else {
		// get streetname, if defined
		var name = typeof wayTags.name != "undefined" ? wayTags.name : "-";
		if (name != "-") {
			return name;
		} else
			return type;
	}
}

function getKindOfPoi(string) {
	switch (string) {
	case "tree":
		return "Baum";
	case "bench":
		return "Sitzbank";
	case "fountain":
		return "Brunnen";
	case "waste_disposal":
		return "Container";
	case "traffic_signals":
		return "Lichtsignal";
	case "waste_basket":
		return "Abfalleimer";
	case "crossing":
		return "Fussgängerstreifen";
	case "hydrant":
		return "Hydrant";
	case "constructionWork":
		return "Baustelle";
	case "platform":
		return "Haltestelle (Platform)"
	case "stop_position":
	case "tram_stop":
	case "platform":
		return "Haltestelle";
	default:
		return "Unbekannt";
	}
}

function getDirectionForDegrees(deg) {
	if ((deg >= 22.5) && (deg < 57.5)) {
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
		return "geradeaus weiterlaufen.";
	} else {
		console.log(deg);
		return "";
	}
}

function getHeading(alpha, beta) {
	var azimuth = beta - alpha;
	var deg;
	if (azimuth < 0)
		return (360 + azimuth);
	else
		return azimuth;
}

function getCoordWayMatch(lat, lon) {
	var deferred = $.Deferred();
	$.each(wayPerCord, function(i, way) {
		if (way.lat == lat) {
			if (way.lon == lon)
				deferred.resolve(way);
		} else if (i == (wayPerCord.length - 1))
			deferred.resolve("");
	});
	return deferred;
}

function transformBearing(bearing) {
	if (bearing < 0)
		return 360 + bearing;
	if (bearing > 360)
		return bearing - 360;
	return bearing;
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
	var leftEndCoords = calculateCoordinates(nextlat, nextlon, (wayBearing - 90));
	var rightStartCoords = calculateCoordinates(lat, lon, (wayBearing + 90));
	var rightEndCoords = calculateCoordinates(nextlat, nextlon, (wayBearing + 90));

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
	var rlat = Math.asin(Math.sin(rlat1) * Math.cos(dif) + Math.cos(rlat1)
			* Math.sin(dif) * Math.cos(rbearing));

	if (Math.cos(rlat) == 0 || Math.abs(Math.cos(rlat)) < 0.000001)
		rlon = rlon1;
	else {
		rlon = ((rlon1
				- Math
						.asin(Math.sin(rbearing) * Math.sin(dif)
								/ Math.cos(rlat)) + Math.PI) % (2 * Math.PI))
				- Math.PI;
	}
	return new coordPair(rad2deg(rlat), rad2deg(rlon));
}

function getPointsInBuffer(buffer, selPoi) {
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
		var i, j, c = 0;
		for (i = 0, j = nvert - 1; i < nvert; j = i++) {
			if (((verty[i] > testy) != (verty[j] > testy))
					&& (testx < (vertx[j] - vertx[i]) * (testy - verty[i])
							/ (verty[j] - verty[i]) + vertx[i])) {
				c = !c;
			}
		}
		if (c == true) {
			poisInStreetBuffer.push(selPoi[k]);
		}
	}
	return poisInStreetBuffer;
}

function writeSidePois(poiArray, lat, lon, bearing, dist, index) {
	var naviPois = [];
	for ( var i = 0; i < poiArray.length; i++) {
		var keyword = poiArray[i].name;
		var selLat = poiArray[i].lat;
		var selLon = poiArray[i].lon;

		var clock = getClock(transformBearing(calcBearing(lat, lon, selLat,
				selLon)
				- bearing));
		if (clock >= 4 && clock <= 8)
			break;
		var distance = Math
				.round(calcDistance(lat, lon, selLat, selLon) * 1000);

		// Don't write if not in Waylength
		if (distance > dist)
			break;
		else {
			naviPois.push(new naviPoi(getKindOfPoi(keyword), clock, distance,
					selLat, selLon));
		}
	}
	return naviPois;
}

function naviPoi(keyword, clock, distance, lat, lon) {
	this.keyword = keyword;
	this.clock = clock;
	this.distance = distance;
	this.lat = lat;
	this.lon = lon;
}

function changeDistAndIndex(index, nextIndex) {
	// add distances up
	distances[index + 1] = distances[index] + distances[index + 1];
	// adjust Index
	for ( var i = index + 2; i < indexValues.length; i++) {
		indexValues[i] = indexValues[i] - 1;
	}
}

function changePoiAttributes(pois, index, nextIndex) {
	// add distances up for POIs
	var sourceLat, sourceLon;
	for ( var j = 0; j < pois[nextIndex].length; j++) {
		pois[nextIndex][j].distance += distances[index];
		for ( var i = index; i >= 0; i--) {
			if (indexValues[i] != -1) {
				sourceLat = cordsOfRoute[indexValues[i + 1]].lat;
				sourceLon = cordsOfRoute[indexValues[i + 1]].lon;
			}
		}
		var newClock = getClock(transformBearing(calcBearing(sourceLat,
				sourceLon, pois[nextIndex][j].lat, pois[nextIndex][j].lon)));
		pois[nextIndex][j].clock = newClock;
	}
	// move POIs to next way
	for ( var k = 0; k < pois[index].length; k++) {
		pois[nextIndex].push(pois[index][k]);
	}
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