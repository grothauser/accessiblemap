var lat, lon;
var elementsList = new Array();
var alreadyPrinted = new Array();
var candidatesForManualSearch = new Array();
var streetViewContent = new Array();
var alreadyPrintedStreetView = new Array();
var locatedWayFirstNode;
var locatedWayLastNode;
var locatedWayId;
var locatedWay;
var wayCash = new Array();
var previousNodeId;
var nextNodeId;
var locationManual = false;


function getGPSLocation() {
	console.log('asking geolocation');
	var options = {
		enableHighAccuracy : true,
		timeout : 5000,
		maximumAge : 0
	};
	function success(pos) {
		var crd = pos.coords;
		lat = crd.latitude;
		lon = crd.longitude;
		
		locateStreet().done(function(foundWay){
			if(foundWay != ""){
				locatedWay = foundWay;
				writeActualLocation(foundWay);
			}
			else{
				$('#locationOutput').html("Ihr Standort konnte nicht bestimmt werden, bitte geben Sie ihn manuell ein.");
			}
		});
	}
	;
	function error(err) {
		alert('ERROR(' + err.code + '): ' + err.message);
	}
	;
	navigator.geolocation.getCurrentPosition(success, error, options);
}
function writeActualLocation(way){
	console.log(way);
	var typeOfWay = getTypeOfWay(way.tags);
	getAddressForLatLon().done(function(address){
		if(typeof address != "undefined"){
			$('#locationOutput').html(typeOfWay+", <br>"+ address.postcode + " " +address.city );
		}
		else{
			 $('#locationOutput').html("Ihr Standort konnte nicht bestimmt werden, bitte geben Sie ihn manuell ein.");
		}
	});
}
function way(name, wayId, nodes, tags, lat, lon){
	this.name = name;
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
	this.lat = lat;
	this.lon = lon;
}
function getManualLocation() {
	var streetInput = $('#street').val();
	var placeInput = $('#place').val();
	var plzInput = $('#plz').val();
	var numberInput = $('#number').val();
	console.log(streetInput +" "+ placeInput);
	getWayFromNominatim(streetInput, numberInput, plzInput, placeInput).done(
			function(data) {
				console.log(data);
				
				// if has only one match
				if (typeof data.address != "undefined") {
					$('#dialog').dialog('close');
					$('#locationOutput').html(data.address.road + " in " + data.address.city);
					locatedWayId = data.osm_id;
					lat = data.lat;
					lon = data.lon;
					locationManual = true;
				} else if (data.length > 1) {
					// has too many matches
					if (data.length > 5) {
						$('#dialog').dialog('close');
						$('#locationOutput').html("Die manuelle Suche hat zu viele Resultate erzielt, bitte genauere Angaben machen.");
					} else {
						// show candidates
						console.log("show candidates");
						$.mobile.changePage('#manualSelection', 'pop', false, true);

						var html = "<fieldset data-role=\"controlgroup\" data-mini=\"true\" id=\"locationResults\">";
						$.each(data, function(index, candidate) {
							if (candidate.osm_type == "way") {
								candidatesForManualSearch.push(candidate);
								html += "<input type=\"radio\" name=\"radioLocation\" id=\"radio-mini-" + index + "\" value=\""
										+ candidate.osm_id + "\" />" + "<label for=\"radio-mini-" + index + "\">" + candidate.display_name
										+ "</label>";
							}
						});

						$('#contentManualSelection').html(html + "</fieldset>");
						$('#contentManualSelection').trigger('create');
					}
				} else if (data == "") {
					$('#locationOutput').html("Die manuelle Suche hat kein Resultat erzielt");
					$('#dialog').dialog('close');
				}

			});

}

function setManualLocation() {
	var wayId = $("input[name=radioLocation]:checked").val();
	$.each(candidatesForManualSearch, function(index, candidate) {
		if (candidate.osm_id == wayId) {
			lat = candidate.lat;
			lon = candidate.lon;
			locatedWayId = wayId;
			$('#locationOutput').html(candidate.display_name);
			$.mobile.changePage($("#location"), "none");
			locationManual = true;
		}
	});

}
function getWayFromNominatim(street, number, plz, place) {
	var deferred = $.Deferred();
	$
			.ajax({
				type : 'GET',
				url : "http://nominatim.openstreetmap.org/search?q=" + street + "+" + "," + "+" + place
						+ "+"+"switzerland&format=json&polygon=1&addressdetails=1",
				dataType : 'jsonp',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
				},
				success : function(parameters) {
					console.log(parameters);
					// if there is more than one result
					var result;
					if (parameters.length > 1) {
						$.each(parameters, function(index, data) {
							// if postalcode matches, take it
							if(typeof plz != "undefined"){
							if (data.address.postcode == plz) {
								deferred.resolve(data);
							} else {
								result = parameters;
							}
							}
						});
						deferred.resolve(parameters);
					} else if (parameters.length == 1) {
						deferred.resolve(parameters[0]);
					} else {
						deferred.resolve("");
					}
				},
			});
	return deferred;
}
function getAddressForLatLon() {
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://nominatim.openstreetmap.org/reverse?format=json&lat="+lat+"&lon="+lon+"&zoom=18&addressdetails=1",
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			console.log(parameters);
			deferred.resolve(parameters.address);
			
		},
	});
return deferred;
}
function intersection(streetA, streetB, intersectionNode){
	this.streetA = streetA;
	this.streetB = streetB;
	this.intersectionNode = intersectionNode;
}
function findIntersections(elements, street, lat, lon, compassHeading) {
	var deferred = $.Deferred();
	console.log("searching intersections" + street);
	var intersections = new Array();
	var startVal = 0;
	var isec;
	for ( var i = 0; i < elements.length; i++) {
		(function(i){
		if (elements[i].name == street) {
			startVal += 1;
			for ( var k = startVal; k < elements.length; k++) {
				isec = getIntersection(separateLineToArray(elements[i].line), separateLineToArray(elements[k].line));
				if (isec != -1) {
					var intersectionEntry = new intersection(elements[i].name, elements[k].name, isec);
					if (!(isAlreadyInIntersections(intersectionEntry, intersections))) {
						intersections.push(intersectionEntry);
						console.log(intersectionEntry);
						distance = calcDistance(getLon(isec), getLat(isec), lon, lat);
						distance = Math.round(1000 * parseFloat(distance.toFixed(4)));
						var clock = calcAll(getLon(isec), getLat(isec), lon, lat, compassHeading);
						var clockNumber = getClock(clock);
						if (intersectionEntry.streetA === street  ){
							// write intersection to html-page
							streetViewContent.push(new streetViewEntry(getLon(isec), getLat(isec),intersectionEntry.streetB + " mit " + street, clockNumber, distance));
						}else if (intersectionEntry.streetB === street) {
							// write intersection to html-page
							streetViewContent.push(new streetViewEntry(getLon(isec), getLat(isec),intersectionEntry.streetA + " mit " + street, clockNumber, distance));
						}
					}
				}
				if(k ==  (elements.length-1) ){
					deferred.resolve(streetViewContent);
				}
			}
		}
		
	})(i);
		
	}
	return deferred;
}
function streetViewEntry(lat,lon,name, clock, distance, tags){
	this.lat = lat;
	this.lon = lon;
	this.name = name;
	this.clock = clock;
	this.distance = distance;
	this.tags = tags;
}
function getIntersection(streetA, streetB) {
	var isec = -1;
	for ( var k = 0; k < streetA.length; k++) {
		if ($.inArray(streetA[k], streetB) !== -1) {
			isec = streetA[k];
		}
	}
	return isec;
}
function isAlreadyInIntersections(intersection, intersections) {
	for ( var i = 0; i < intersections.length; i++) {
		if (intersections[i].node == intersection.node) {
			return true;
		}
	}
	return false;
}
function intersection(streetA, streetB, node) {
	this.streetA = streetA;
	this.streetB = streetB;
	this.node = node;
}

function detectmob() { 
	 if( navigator.userAgent.match(/Android/i)
	 || navigator.userAgent.match(/webOS/i)
	 || navigator.userAgent.match(/iPhone/i)
	 || navigator.userAgent.match(/iPad/i)
	 || navigator.userAgent.match(/iPod/i)
	 || navigator.userAgent.match(/BlackBerry/i)
	 || navigator.userAgent.match(/Windows Phone/i)
	 ){
	    return true;
	  }
	 else {
	    return false;
	  }
	}
function getStreetView() {
	// detect if mobile (for compass availability)
	if(detectmob()){
	// check compass first
		checkCompass().done(function(compval){
			if(setManual){
				getStreetViewContent(way.nodes[0], way.nodes[way.nodes.length-1]);
			}else{
				getStreetViewContent(nextNodeId, previousNodeId, compval);
			}
		});
	}
	else{
		//if street was setted manually we don't know where exactly he stands
		if(setManual){
			getStreetViewContent(way.nodes[0], way.nodes[way.nodes.length-1]);
		}else{
			getStreetViewContent(nextNodeId, previousNodeId, 0);
		}
	}
}
function locateStreet(){
	var deferred = $.Deferred();
	findNearestNodes().done(function(nodesAround){
		getNearestNode(nodesAround).done(function(nearestNode){
			// if closest node is a crossing-node
			if(isIntersection(nearestNode)){
				// TODO: let user select on which street he stands
				console.log("standing at intersection");
			}else{
				getWaysForNode(nearestNode.nodeId).done(function(ways){
					console.log("nearest node is " + nearestNode.nodeId);
					 getWayInfoOverpass(ways[0].way.id).done(function(wayData){
						 locatedWay = ways[0].way;
						 
						 $.each(wayData.elements[0].nodes, function(index, node){
							 if(node == nearestNode.nodeId){
								 console.log("matched node " + node);
								 previousNodeId = wayData.elements[0].nodes[index-1];
								 nextNodeId =  wayData.elements[0].nodes[index+1];
								 
								 if((!(typeof previousNodeId == "undefined")) && (!(typeof nextNodeId == "undefined"))){
									 console.log("found prev and next node");
									 deferred.resolve(locatedWay);
									 return false;
								 }
								 // if matched node was the first of the road
								if(typeof previousNodeId == "undefined"){
										 console.log("is first node of road");
										 previousNodeId = node;
										 deferred.resolve(locatedWay);
										 return false;
								 }
								 // if matched node was the last of the road
								 if(nextNodeId == "undefined"){
										 console.log("is last node of road");
										 nextNodeId = node;
										 deferred.resolve(locatedWay);
										 return false;
								 }
							 }
							 if(index == (wayData.elements[0].nodes.length -1)){
								 console.log("done");
								 deferred.resolve("");
							 }
							 
						 });
						
						 });
				});
			}
		});
	});
	return deferred;
}
function getStreetViewContent(nextNodeId, previousNodeId, compassHeading){
		getNodeFromCash(nextNodeId).done(function(nextNodeData){
			getNodeFromCash(previousNodeId).done(function(prevNodeData){
				// calc the bearing to the prevous node
				var bearingPrevNode = calcBearing(lat, lon, prevNodeData.lat, prevNodeData.lon);
				// calc the bearing to the next node
				var bearingNextNode = calcBearing(lat, lon, nextNodeData.lat, nextNodeData.lon);
				
				if(bearingPrevNode < 0){
					var tmp = bearingPrevNode;
					bearingPrevNode = 360 - Math.abs( tmp);
				}
				if(bearingNextNode < 0){
					var tmp = bearingNextNode;
					bearingNextNode =  360 - Math.abs( tmp);
				}
				var diffToPrev = getHeadingDiff(compassHeading, bearingPrevNode);
				var diffToNext = getHeadingDiff(compassHeading, bearingNextNode);
				console.log("compass: " + compassHeading + " prev: (" + previousNodeId+ ")" +bearingPrevNode+ " next: (" + nextNodeId + ") " + bearingNextNode);
				
				var wayDirection = calcBearing(prevNodeData.lat, prevNodeData.lon, nextNodeData.lat, nextNodeData.lon);
//				console.log(wayDirection + " " + prevNodeData.lat + " ," + prevNodeData.lon + " " + nextNodeData.lat+","+ nextNodeData.lon);
			
		
			// if it is only for pedestrians we only have one side to
			// walk (the whole road)
			if(isForPedestrians(locatedWay.tags.highway)){
				console.log("on pedestrian way");
				//pedestrian area
				if(locatedWay.tags.area == "yes"){
					
				}else{
					var buffer = calculateBuffer(prevNodeData.lat, prevNodeData.lon, nextNodeData.lat, nextNodeData.lon);
					showPedestrianPath(buffer, compassHeading);
					}
			}
			// if is a normal road we have two sides to walk
			else{
							// am I standing left or right side of the street?
							console.log("on normal road");
								var left = isLeft(nextNodeData.lat, nextNodeData.lon,prevNodeData.lat, prevNodeData.lon,lat,lon);
								console.log(left + " nextnode " + diffToNext + " prevnode " + diffToPrev + " compass " + compassHeading);
								var buffers = calculateSideBuffers(prevNodeData.lat, prevNodeData.lon, nextNodeData.lat, nextNodeData.lon, wayDirection);
								
								if((!left)&& (diffToNext > diffToPrev)){
									// user walks on right side but
									// heading like left
									showLeftSide(buffers[1], compassHeading);
									console.log("on right side  -> walking left");
								}
								else if((!left) && (diffToNext < diffToPrev)){
									// user walks on right side and
									// heading like right
									showRightSide(buffers[1], compassHeading);
									console.log("on right side -> walking right");
								}
								else if(left && (diffToNext < diffToPrev)){
									// user walks on left side and
									// heading like left
									showLeftSide(buffers[0], compassHeading);
									console.log("on left side -> walking left");
								}
								else if(left && (diffToNext > diffToPrev)){
									// user walks on left side but
									// heading like right
									showRightSide(buffers[0], compassHeading);
									console.log("on left side -> walking right");
								}
							}
							});
						});
		 }
	
function showPedestrianPath(buffer, compassHeading){
	var listPOIs = getSelectedElements();
	findPOIs(compassHeading, buffer, listPOIs).done(function(elements){
		printElements(elements);
	});
}
function showRightSide(buffer, compassHeading){
	var listPOIs = getSelectedElements();
	findPOIs(compassHeading, buffer, listPOIs);
}
function showLeftSide(buffer,compassHeading){
// findIntersections.done(function(intersections){
//		
// });
	var listPOIs = getSelectedElements();
	findPOIs(compassHeading, buffer, listPOIs);
	
}
function getHeadingDiff(compassHeading, bearingToNode){
	var diff;
	if(compassHeading > bearingToNode){
		diff = compassHeading - bearingToNode;
	}
	else if(compassHeading < bearingToNode){
		diff = bearingToNode- compassHeading;
	}
	return diff;
}
function isLeft(alat, alon, blat, blon, clat, clon){
    var val = ((blat - alat)*(clon - alon) - (blon - alon)*(clat - alat));
    return val > 0;
}
function getNodeFromCash(nodeId){
	var deferred = $.Deferred();
	$.each(wayCash, function(index, way){
		$.each(way.nodes, function(i, node){
			if(nodeId == node.nodeId){
				deferred.resolve(node);
			}
		});
	});
	return deferred;
}
function isForPedestrians(highway){
	console.log(highway);
	var isPedestrianWay = false;
	switch (highway){
	case "footway":
		isPedestrianWay = true;
		break;
	case "path":
		isPedestrianWay = true;
		break;
	case "steps":
		isPedestrianWay = true;
		break;
	case "pedestrian":
		isPedestrianWay = true;
		break;
	}
	return isPedestrianWay;
}
function isIntersection(node){
	getWaysForNode(node.nodeId).done(function(ways){
		return (ways.length > 1);
	});
	
}
function getWaysForNode(nodeId){
	var ways = new Array();
	var deferred = $.Deferred();
	$.each(wayCash, function(index, way){
		$.each(way.nodes, function(i, node){
			if(nodeId == node.nodeId){
				ways.push(way);
			}
			if(i == (way.nodes.length-1)){
				if(index == (wayCash.length-1)){
					deferred.resolve(ways);
				}
			}
		});
	});
return deferred;
}
function getNearestNode(nodesAround){
	var deferred = $.Deferred();
	var nearestNode;
	var smallestDist;
			$.each(nodesAround, function(index, node){
				if(index == 1){
					smallestDist = node.distance;
					nearestNode = node;
				}
				else{
					if(node.distance < smallestDist){
						smallestDist = node.distance;
						nearestNode = node;
					}
				}
				if(index == (nodesAround.length-1)){
					deferred.resolve( nearestNode);
				}			
				});
			return deferred;
}

function nodeCandidate(nodeId,lat,lon,distance,wayId){
	this.nodeId = nodeId;
	this.lat = lat;
	this.lon = lon;
	this.distance = distance;
	this.wayId = wayId;
}
function cashedWay(nodes, way){
	this.nodes = nodes;
	this.way = way;
}
function findNearestNodes(){
	var deferred = $.Deferred();
	var nearestNode;
	var smallestDist;
	var nodeCandidates = new Array();
	searchOverpassForNodes(lat, lon,'way["highway"]').done(function(result){
		$.each(result.elements, function(index, candidate){
			var nodesForWay = new Array();
			$.each(candidate.nodes, function(i, node){
				// get node information
				getNodeInformation(node).done(function(data) {
					// calc the distance to the actual position
					var dist = calcDistance(data.lat, data.lon, lat, lon);
					var nodecand = new nodeCandidate(data.id,data.lat,data.lon,dist,candidate.id);
					nodeCandidates.push(nodecand);
					nodesForWay.push(nodecand);
					if(i == (candidate.nodes.length-1)){
						var cashed = new cashedWay(nodesForWay, candidate);
						wayCash.push(cashed);
						if(index == (result.elements.length-1)){
							deferred.resolve(nodeCandidates);
						}
					}
				});
	});
		});
	});
	return deferred;
}
function findStreetAndIntersections(compval){
	var compassHeading = compval == 0 ? 0 : compval;
	// find nearbystreets
	findNearbyStreets(lat, lon, false).done(function(streets){
		// get intersections
		findIntersections(streets, streets[0].name, lat, lon, compassHeading).done(function(intersections){
			$.each(intersections, function ( index, intersection){
				writeElementToHTML("intersection" ,intersection);
			});
		});
		
	});
}
function findPOIs(compassHeading, buffer, selectedPOIs){
	var deferred = $.Deferred();
	$.each(selectedPOIs, function(index, poi){
		getPOIs(poi).done(function(elements){
				var poisInStreetSegment = getPointsInBuffer(buffer, elements);
				console.log("points in buffer");
				console.log(poisInStreetSegment);
				
// poisInLeftStreetSegment.sort(function (a,b){
// if (a.distance < b.distance) return -1;
// if (a.distance > b.distance) return 1;
// return 0;
// });
			// insertToTypeGroup(element.type);
				// writeElementToHTML(poi, element);
			});
			
	// });
	});
}
function writeElementToHTML(type,element){
	if($.inArray(element, alreadyPrintedStreetView)==-1){
		var typeStr = type;
		alreadyPrintedStreetView.push(element);
	
		// check if is On right side or left side of the street
		if(isOnLeftSideOfStreet(element.lat, element.lon)){
			
		}else if(isOnRightSideOfStreet(element.lat, element.lon)){
			
		}
		if(type ==="intersection"){
			typeStr = "Kreuzung: ";
		}
		else if(type == "amenity = restaurant"){
			typeStr = "Restaurant: ";
		}
		else if(type == "highway=bus_stop"){
			typeStr = "Bushaltestelle: ";
			console.log("bushaltestelle");
			console.log(element);
			
		}
			
		if((element.clock >= 9) && (element.clock <= 12)){
			$('#inFront').append("<p>" + typeStr + " " + element.name + " in " + element.distance + "m auf " + element.clock + " Uhr </p>");
		}
		if(element.clock <= 3){
			$('#inFront').append("<p>" + typeStr + " " + element.name + " in " + element.distance + "m auf " + element.clock + " Uhr </p>");
		}
		else if((element.clock > 3) && (element.clock < 9)){
			$('#inBack').append("<p>" + typeStr + " " + element.name + " in " + element.distance + "m auf " + element.clock + " Uhr </p>");
			
		}
	}
		
}



function getCollapsible(keyword, text) {
	return "<div data-role=\"collapsible\" data-mini=\"true\"  data-collapsed-icon=\"arrow-r\" data-collapsed=\"false\" data-expanded-icon=\"arrow-d\"><h4> "
			+ keyword + " </h4> <p>" + text + "</p></div>";
}
function getSelectedElements() {
	var selectedPOIs = new Array();
	$('#selection input:checked').each(function() {
		var name = $(this).attr('id');
		if (name == "tree") {
			// trees need to be in the street not in a radius around it
			selectedPOIs.push("natural = tree");
		} else if (name.indexOf('=') > 0) {
			selectedPOIs.push(name);
		} else {
			selectedPOIs.push("amenity = " + name);
		}
	});
	return selectedPOIs;
}

function getPOIs(keyWord) {
	console.log(keyWord);
	var deferred = $.Deferred();
	var foundPOIs = new Array();
	var radius;
	var radiusFromStorage = localStorage.getItem("radius");
	if(radiusFromStorage === null){
		radius = 0.5;
		localStorage.setItem("radius","500");
	}
	else{
		radius =  localStorage.getItem("radius")/1000;
	}
	console.log(radius);
	var bbox = getBbox(lat, lon, radius);
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[" + keyWord + "](" + bbox[1] + "," + bbox[0] + ","
				+ bbox[3] + "," + bbox[2] + ");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			console.log(parameters);
			$.each(parameters.elements, function(i, poi) {

				// if poi is not already in list
				if (!(alreadyInPOIS(poi.id, keyWord))) {
					var distance = calcDistance(poi.lat, poi.lon, lat, lon);
					console.log("found " + parameters.elements.length + " " + keyWord + " dist " + distance);
					// if poi is in radius
					if (distance <= radius) {
						var clock = getClock(calcAll(poi.lat,poi.lon,lat,lon));
						distance = Math.round(1000 * parseFloat(distance.toFixed(4)));
						var name = typeof poi.tags.name == "undefined" ? keyWord : poi.tags.name;
						var entry = new streetViewEntry(poi.lat, poi.lon, name, clock,distance,poi.tags );
						console.log(entry);
						foundPOIs.push(entry);
					}
				}
				if(i==(parameters.elements.length-1)){
					deferred.resolve(foundPOIs);
				}
			});
		},

	});
	return deferred;
}
function alreadyInPOIS(nodeId, keyWord) {
	for ( var i = 0; i < elementsList.length; i++) {
		if (elementsList[i].nodeId == nodeId && elementsList[i].type == keyWord) {
			return true;
		}
	}
	return false;
}
function getSearchString(keyWord) {
	var searchString = "";
	switch (keyWord) {
	case "bench":
		console.log("bench");
		searchString = "amenity = bench";
		break;
	case "restaurant":
		searchString = "amenity = restaurant";
		break;
	case "tree":
		searchString = "natural = tree";
		break;
	}
	return searchString;
}
function getBbox(lat, lon, radius) {
	var earthRadius = 6371;
	var maxLat = lat + rad2deg(radius / earthRadius);
	var minLat = lat - rad2deg(radius / earthRadius);
	var maxLon = lon + rad2deg(radius / earthRadius / Math.cos(deg2rad(lat)));
	var minLon = lon - rad2deg(radius / earthRadius / Math.cos(deg2rad(lat)));

	var bbox = new Array();
	bbox.push(parseFloat(minLon));
	bbox.push(parseFloat(minLat));
	bbox.push(parseFloat(maxLon));
	bbox.push(parseFloat(maxLat));
	return bbox;
}
function showAlpha(alpha) {
	compassHeading = alpha;
	return alpha;
}
function getLon(node) {
	return node.split(" ")[0];
}
function getLat(node) {
	return node.split(" ")[1];
}

function getClock(degrees) {
	var clockNumber = 0;
	if (degrees < 0) {
		console.log("error");
	} else if (degrees >= 0 && degrees < 15) {
		clockNumber = 12;
	} else if (degrees >= 15 && degrees < 45) {
		clockNumber = 1;
	} else if (degrees >= 45 && degrees < 75) {
		clockNumber = 2;
	} else if (degrees >= 75 && degrees < 105) {
		clockNumber = 3;
	} else if (degrees >= 105 && degrees < 135) {
		clockNumber = 4;
	} else if (degrees >= 135 && degrees < 165) {
		clockNumber = 5;
	} else if (degrees >= 165 && degrees < 195) {
		clockNumber = 6;
	} else if (degrees >= 195 && degrees < 225) {
		clockNumber = 7;
	} else if (degrees >= 225 && degrees < 255) {
		clockNumber = 8;
	} else if (degrees >= 255 && degrees < 285) {
		clockNumber = 9;
	} else if (degrees >= 285 && degrees < 315) {
		clockNumber = 10;
	} else if (degrees >= 315 && degrees < 345) {
		clockNumber = 11;
	} else if (degrees >= 345 && degrees < 360) {
		clockNumber = 12;
	}
	return clockNumber;
}
function deg2rad(a) {
	return a * 0.017453292519943295;
}

function rad2deg(a) {
	return a *( 180 / Math.PI);
}

function frac(a) {
	return (a - Math.floor(a));
}
function calcDistance(lat1, lon1, lat2, lon2) {
	 var R = 6371; // km
	 var dLat = deg2rad(lat2-lat1);
	 var dLon = deg2rad(lon2-lon1);
	 var lat1 = deg2rad(lat1);
	 var lat2 = deg2rad(lat2);

	 var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	         Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	 var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	 var d = R * c;
	 return d;
}
function calcAll(X1, Y1, X2, Y2, compassHeading) {
	var azimCompassHeading = 0;
	var dx = X1 - X2;
	var dy = Y1 - Y2;
	var azi = 0;
	var PI = Math.PI;
	if (dx == 0) {
		if (dy > 0) {
			azi = 0;
		} else if (dy < 0) {
			azi = 2 * PI;
		} else if (dy == 0) {
			console.log("Fehler: Start- und Endpunkt identisch");
		}
	} else if (dy == 0) {
		if (dx > 0) {
			azi = PI / 2;
		}
		if (dx < 0) {
			azi = 3 / (2 * PI);
		}
	} else {
		azi = Math.atan(Math.abs(dx / dy));
		if (dx > 0) {
			if (dy < 0) {
				azi = PI - azi;
			}
		} else if (dx < 0) {
			if (dy > 0) {
				azi = 2 * PI - azi;
			} else if (dy < 0) {
				azi = azi + PI;
			}
		}
	}
	// azimuth in degrees
	azi = azi * (180 / PI);
	// if compassHeading greater than target-azimuth
	if (compassHeading > azi) {
		var temp = azi - compassHeading;
		azimCompassHeading = 360 + temp;
		// if compassHeading is exactly north
	} else if (compassHeading == 0) {
		azimCompassHeading = azi;
	}
	// if compassHeading smaller than target-azimuth
	else {
		azimCompassHeading = azi - compassHeading;
	}
	return azimCompassHeading;
}
function getWayInfoOverpass(wayId){
		var deferred = $.Deferred();
		$.ajax({
			type : 'GET',
			url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];way("
					+ wayId + ");out;",
			dataType : 'json',
			jsonp : 'json_callback',
			error : function(parameters) {
				console.error("error");
			},
			success : function(parameters) {
				deferred.resolve(parameters);
			},
		});
		return deferred;

}
function searchOverpassForNodes(lat, lon, keyWord) {
	var bbox = getBbox(lat, lon, "0.1");
	console.log(bbox);
	var deferred = $.Deferred();
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
			deferred.resolve(overpassResult);
		},
	});
	return deferred;
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