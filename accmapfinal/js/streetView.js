var lat, lon;
var candidatesForManualSearch = new Array();
var locatedWay, locatedWayId;
var locationManual = false;
var nodeCoords = [];
var compassHeading;
var streetViewContent = new Array();

function getGPSLocation() {
	console.log('asking geolocation');
	var options = {
		enableHighAccuracy : true,
		timeout : 5000,
		maximumAge : 0
	};
	function success(pos) {
		var crd = pos.coords;
		lat =47.22572;
		lon =  8.81880
	//	lat = crd.latitude;
	//	lon = crd.longitude;
		locatedLat = lat;
		locatedLon = lon;

		locateStreet().done(function(foundWay){
			if(foundWay != "undefined"){
				locatedWay = foundWay;
				writeActualLocation(foundWay);
			}
			else{
				$('#locationOutput').html("Ihr Standort konnte nicht bestimmt werden, bitte geben Sie ihn manuell ein.");
			}
		});
	};
	function error(err) {
		alert('ERROR(' + err.code + '): ' + err.message);
	};
	navigator.geolocation.getCurrentPosition(success, error, options);
}
function refreshStreetView(){
	$('#aroundLeft').html("");
	$('#aroundLeftDiv').html("");
	$('#aroundRight').html("");
	$('#aroundRightDiv').html("");
	getGPSLocation();
	var streetViewContent = [];
	getStreetView();
	
	
}
function writeActualLocation(way){
	getAddressForLatLon().done(function(address){
		console.log(way);
		if((typeof address != "undefined") && (typeof way.way != "undefined")){
			locationManual = false;
			$('#locationOutput').html(getTypeOfWay(way.way.tags)+", <br>"+ address.postcode + " " +address.city );
		}
		else{
			 $('#locationOutput').html("Ihr Standort konnte nicht bestimmt werden, bitte geben Sie ihn manuell ein.");
		}
	});
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
			deferred.resolve(parameters.address);
			
		},
	});
return deferred;
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
				
//				// if has only one match
				if ((data.length == 1) && (typeof data.address != "undefined")) {
					$('#dialog').dialog('close');
					console.log("only one result");
					$('#locationOutput').html(data.display_name);
					locatedWayId = data.osm_id;
					lat = data.lat;
					lon = data.lon;
					locatedLat = data.lat;
					locatedLon = data.lon;
					locationManual = true;
					getWayInfoOverpass(locatedWayId).done(function(wayData){
						locatedWay = wayData.elements[0];
						locationManual = true;
					});
				} 
				else{
					// has too many matches
					if (data.length > 10) {
						console.log
						$('#dialog').dialog('close');
						$('#locationOutput').html("Die manuelle Suche hat zu viele Resultate erzielt, bitte genauere Angaben machen.");
					} else if (data == "") {
						$('#locationOutput').html("Die manuelle Suche hat kein Resultat erzielt");
						$('#dialog').dialog('close');
					
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
				}
			});

}

function setManualLocation() {
	var wayId = $("input[name=radioLocation]:checked").val();
	$.each(candidatesForManualSearch, function(index, candidate) {
		if (candidate.osm_id == wayId) {
			lat = candidate.lat;
			lon = candidate.lon;
			locatedLat = lat;
			locatedLon = lon;
			locatedWayId = wayId;
			getWayInfoOverpass(locatedWayId).done(function(wayData){
				console.log(wayData);
				locatedWay = wayData.elements[0];
			
				$('#locationOutput').html(candidate.display_name);
				$.mobile.changePage($("#location"), "none");
				locationManual = true;
			});
			
		}
	});

}
function getWayFromNominatim(street, number, plz, place) {
	var wayResults = new Array();
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
					// if there is more than one result
					var result;
					if (parameters.length > 1) {
						$.each(parameters, function(index, data) {
							//only ways
							if((data.osm_type == "way") &&(data.class == "highway")){
							// if postalcode matches, take it
							if(typeof plz != "undefined"){
								if (data.address.postcode == plz) {
									wayResults.push(data);
									deferred.resolve(wayResults);
								} else if(data.address.city == place){
									wayResults.push(data);
									deferred.resolve(wayResults);
								}else{
									wayResults.push(data);
								}
							}
							}
							if(index == (parameters.length-1)){
								deferred.resolve(wayResults);
							}
						});
					} else if (parameters.length == 1) {
						deferred.resolve(wayResults);
					} else {
						deferred.resolve("");
					}
				},
			});
	return deferred;
}

function intersection(streetA, streetB, intersectionNode){
	this.streetA = streetA;
	this.streetB = streetB;
	this.intersectionNode = intersectionNode;
}

function streetViewEntry(id,lat,lon,name, clock, distance, tags){
	this.id = id;
	this.lat = lat;
	this.lon = lon;
	this.name = name;
	this.clock = clock;
	this.distance = distance;
	this.tags = tags;
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

	var startentry,endentry; 
	if(locationManual){
			//locatedWay is whole way
			console.log(locatedWay);
			getNodeInformation(locatedWay.nodes[0]).done(function(firstNode){
				getNodeInformation(locatedWay.nodes[locatedWay.nodes.length-1]).done(function(lastNode){
					var dist = calcDistance(firstNode.lat, firstNode.lon, lastNode.lat, lastNode.lon);
					startentry = new tempEntry("", dist,  firstNode.lat,  firstNode.lon, locatedWay);
					endentry  = new tempEntry("", "", lastNode.lat,  lastNode.lon, locatedWay);
					getStreetContent(startentry, endentry);
				});
			});
			
	}else{
			//located way is distsegmententry
			console.log(locatedWay);
			var dist = calcDistance( locatedWay.startlat,  locatedWay.startlon,locatedWay.endLat,  locatedWay.endLon);
			startentry = new tempEntry("", dist,  locatedWay.startlat,  locatedWay.startlon, locatedWay.way);
			endentry  = new tempEntry("", "",  locatedWay.endLat,  locatedWay.endLon, locatedWay.way);
			getStreetContent(startentry, endentry);
	}

}
function getStreetContent(startentry,endentry){
	var streetArray = new Array();
	streetArray.push(startentry);
	streetArray.push(endentry);
	
	enricheWays(streetArray).done(function(enrichedStreet){
		console.log(enrichedStreet);
		
		var selectedPois = getSelectedPois();
		console.log(selectedPois);
		var counter = selectedPois.length;
		if(detectmob()){
			console.log("on mobile");
			checkCompass().done(function(compval){
				if(selectedPois.length>0){
					$.each(selectedPois, function(index, poi){
						getPOIs(poi,compval).done(function(){
							counter--;
							if(counter==0){
								streetViewContent.sort(distanceSort);
								printPOIS("left");
								printPOIS("right");
								setListener();
								getSide(compval, startentry, endentry, "streetView");
								printOPS(enrichedStreet,compval);
							}
						});
					});
				}else{
					getSide(compval, startentry, endentry, "streetView");
				}
			});
		}else{
			console.log("not mobile");
			if(selectedPois.length>0){
				$.each(selectedPois, function(index, poi){
					getPOIs(poi,0).done(function(){
						counter--;
						if(counter==0){
							streetViewContent.sort(distanceSort);
							printPOIS("left");
							printPOIS("right");
							setListener();
							printOPS(enrichedStreet,0);
							getSide(0, startentry, endentry, "streetView");
						}
					});
				});	
			}else{
				getSide(0, startentry, endentry, "streetView");
			}
		}
	});
}
function printOPS(finalroute,compval){
	var segment = finalroute[0];
	var clock;
	$.each(segment.opsLeft, function(index, entry){
		clock = getClock(calcAll(entry.lat, entry.lon, locatedLat,locatedLon,compval));
		if((clock > 9)||(clock<3)) {
			$('#frontleftlist').append("<li> " + getKindOfPoi(entry.keyword) + " in " + Math.round(entry.distance*1000) + " Meter");
		}else{
			$('#backleftlist').append("<li> " + getKindOfPoi(entry.keyword) + " in " + Math.round(entry.distance*1000) + " Meter");
		}
		});
	$.each(segment.opsRight, function(index, entry){
		clock = getClock(calcAll(entry.lat, entry.lon, locatedLat,locatedLon,compval));
		if((clock > 9)||(clock<3)) {
			$('#frontrightlist').append("<li> " + getKindOfPoi(entry.keyword) + " in " + Math.round(entry.distance*1000) + " Meter");
		}else{
			$('#backrightlist').append("<li> " + getKindOfPoi(entry.keyword) + " in " + Math.round(entry.distance*1000) + " Meter");
		}
		});
	
}
function printPOIS(side){

	var radioname, htmlAround;
	if(side == "left"){
		radioname = "routeChoiceLeft";
		htmlAround = '<div data-role=\"fieldcontain\" id=\"aroundLeftDiv\"><fieldset data-role=\"controlgroup\" >';
	}
	else{
		radioname = "routeChoiceRight";
		htmlAround = '<div data-role=\"fieldcontain\" id=\"aroundRightDiv\"><fieldset data-role=\"controlgroup\" >';
	}
		$.each(streetViewContent, function(index, poi){
		var name = typeof poi.tags.name != "undefined" ? poi.tags.name : "";
		htmlAround = htmlAround.concat('<input type="radio" data-mini="true" class="radioelem"' +
				'name="'+radioname+'" id="'+poi.lat+","+poi.lon+'" value="' +poi.name.concat(" " +name)+' "  />' +
				'<label for="'+poi.lat+","+poi.lon+'"> ' +
				'<h3>'+poi.name+" "+name+" in "+poi.distance+" Meter auf "+poi.clock+" Uhr</h3> </label>");
	});
	htmlAround = htmlAround.concat("</fieldset></div>");
	if(side == "left"){
		$('#aroundLeft').html(htmlAround);
		$('#aroundLeft').trigger('create');
	}
	else{
		$('#aroundRight').html(htmlAround);
		$('#aroundRight').trigger('create');
	}
	//$('#aroundRight').html("");
}



function locateStreet(){
	var deferred = $.Deferred();
	searchOverpassForLocationCoords(lat, lon,'way["highway"]').done(function(matchingSegment){
		deferred.resolve(matchingSegment);
	});
	return deferred;
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
	console.log("prev: "+alat+", "+alon+" next: "+blat+", "+blon);
    var val = ((blon - alon)*(clat - alat)-(blat - alat)*(clon - alon));
    return val > 0;
}

function getSelectedPois() {
	var selectedPOIs = new Array();
	$("input[type=checkbox]").each(function() {
		var name = $(this).attr('name');
		var id = $(this).attr('id');
		var saved = localStorage.getItem( $(this).attr('id'));
		if(saved == "true"){
		
		if(name != "op"){
			selectedPOIs.push(id);
		}
		}
	});
	return selectedPOIs;
}

function getPOIs(keyWord,compassHeading) {
	var deferred = $.Deferred();
	var radius = localStorage.getItem("radius");
	if(radius === null){
		radius = 500;
		localStorage.setItem("radius","500");
	}
	var bbox = getBbox(lat, lon, radius);
	
	if(keyWord.indexOf("=")==-1){
		keyWord = "amenity="+keyWord;
		console.log(keyWord);
	}
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
			if(parameters.elements.length>0){
				$.each(parameters.elements, function(i, poi) {
					var distance = calcDistance(poi.lat, poi.lon, lat, lon);
						if (distance <= radius) {
							var name = getKindOfPoi(keyWord.split("=")[1]);
							distance = Math.round(1000 * distance);
							var clock = getClock(calcAll(poi.lat,poi.lon,lat,lon, compassHeading));
							var entry = new streetViewEntry(poi.id, poi.lat, poi.lon, name, clock,distance,poi.tags);
							streetViewContent.push(entry);
						}
						if(i == (parameters.elements.length-1)){
							console.log("done for " + keyWord);
							deferred.resolve();
						}
				});
			}else{
				deferred.resolve();
			}
		},
	});
	return deferred;
}
function alreadyFound(nodeid, found){
	var found = false;
	$.each(found, function(index, elem){
		if(elem.id == nodeid){
			found = true;
			return false;
		}
		if(index == (found.length-1)){
			return found;
		}
	});
	
}

function calcDistance(lat1, lon1, lat2, lon2) {
	 var R = 6371; 
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
function searchOverpass(lat, lon, keyWord) {
	var bbox = getBbox(lat, lon, "100");
	console.log(bbox);
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];"
				+ keyWord + "(" + bbox[1] + "," + bbox[0] + "," + bbox[3] + ","
				+ bbox[2] + ");out body; node(w); out skel;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		// Handle results over to determination
		success : function(overpassResult) {
			for(var i=0; i<overpassResult.elements.length; i++){
				if(overpassResult.elements[i].type == "way")
					allPaths.push(overpassResult.elements[i]);
				else
					allNodes.push(overpassResult.elements[i]);
			}
			deferred.resolve(overpassResult);
		},
	});
	return deferred;
}


//radius is in meters
function getBbox(lat, lon, radius) {
	var radiusX = radius/1000;
	var radiusY = radius/1000;
	
	var degreesOfRadiusX = (radiusX / 111.111);
	var degreesOfRadiusY = (radiusY / 111.111);
	
	var degreesOfLatY = degreesOfRadiusY * Math.cos(((lat * Math.PI)/180));
	
	//longitudes 
	var bbox = new Array();
	bbox.push(parseFloat(lon - degreesOfRadiusX));
	bbox.push(parseFloat(lat - degreesOfLatY));
	bbox.push(parseFloat(lon + degreesOfRadiusX));
	bbox.push(parseFloat(lat + degreesOfLatY));
	return bbox;
}
function distSegmentEntry(startlat,startlon,endLat,endLon,matchedLat,matchedLon,dist,wayId,way){
	this.startlat = startlat;
	this.startlon = startlon;
	this.endLat = endLat;
	this.endLon = endLon;
	this.matchedLat = matchedLat;
	this.matchedLon = matchedLon;
	this.dist = dist;
	this.wayId = wayId;
	this.way = way;
}

function wayVector(wayId, nodes, tags){
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
}
function point(x,y){
	this.x = x;
	this.y = y;
}

function findWays(opWays, opNodes, lat, lon){
	var wayVectors = new Array();
	$.each(opWays, function(i, overpassResult){
		var nodes = new Array();
		//get all nodes of way
		$.each(overpassResult.nodes, function(index, node){
			//get node info but not for the last
			var nodeInfo = getNodeInfo(node, opNodes);
			nodes.push(new point(nodeInfo.lat, nodeInfo.lon));
			//if all nodeinfo is here
			if(nodes.length === overpassResult.nodes.length){
				var wayVec = new wayVector(overpassResult.id, nodes, overpassResult.tags);
				wayVectors.push(wayVec);
			}
		});
	});
	return wayVectors;
	
}
function findMatchingWay(wayVectors,lat,lon){
	var deferred = $.Deferred();
	var pointA, segStart, segEnd; 
	var smallestDist;
	var nearestSegment;
	var candidates = new Array();
	var nextNode;
	$.each(wayVectors, function(index, wayVec){
		//for each wayVec.nodes
		if(wayVec.nodes.length > 1){
			$.each(wayVec.nodes, function(i, node){
				//until secondlast
				if(i < (wayVec.nodes.length-1)){
					nextNode = wayVec.nodes[i+1];
					pointA = new point(lat,lon);
					segStart = new point(node.x, node.y);
					segEnd = new point(nextNode.x, nextNode.y);
					var distToSegmentResult = distToSegment(pointA,segStart,segEnd);
//					console.log(distToSegmentResult + " for " + pointA.x + "," + pointA.y + " to seg with start: " + 
//							segStart.x + " ," + segStart.y + " and end " + 
//							segEnd.x + " ," + segEnd.y + " of way " + wayVec.wayId);
					if(index === 0){
						 smallestDist = distToSegmentResult;
						 nearestSegment = new distSegmentEntry(node.x, node.y,nextNode.x, nextNode.y,lat,lon, distToSegmentResult, wayVec.wayId, wayVec);
						 candidates.push(nearestSegment);
					}
					if(distToSegmentResult <= smallestDist){
							 smallestDist = distToSegmentResult;
							 nearestSegment = new distSegmentEntry(node.x, node.y,nextNode.x, nextNode.y,lat,lon, distToSegmentResult, wayVec.wayId, wayVec);
							 candidates.push(nearestSegment);
					}
				}
				if((i==( wayVec.nodes.length-1)) && (index == (wayVectors.length-1))){
					if(typeof nearestSegment != "undefined"){
						console.log(candidates);
						deferred.resolve(nearestSegment);
					}else{
						console.log("no nearestsegment found");
						deferred.resolve("undefined");
					}
				}
			});
		}else
			if(index == wayVectors.length-1){
				deferred.resolve();
			}
	});
	return deferred;
}
function getNodeInformation(nodeId) {
	var deferred = $.Deferred();
	$
			.ajax({
				type : 'GET',
				url : "http://overpass-api.de/api/interpreter?data=[out:json];node("
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

function getNodeInfo(nodeId, allNodes) {
	var resultNode;
	$.each(allNodes, function(index, node){
		if(nodeId === node.id){
			resultNode = node;
		}
	});
	return resultNode
}

function searchOverpassForLocationCoords(lat, lon, keyWord) {
	var deferred = $.Deferred();
	var bbox = getBbox(lat, lon, "50");
	var ways = [];
	var nodes = [];
	$.ajax({
		type : 'GET',
		url : "http://overpass-api.de/api/interpreter?data=[out:json];"
				+ keyWord + "(" + bbox[1] + "," + bbox[0] + "," + bbox[3] + ","
				+ bbox[2] + ");out body; node(w); out skel;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		// Handle results over to determination
		success : function(overpassResult) {
			$.each(overpassResult.elements, function(index, result){
				if(result.type == "way")
					ways.push(result);
				else
					nodes.push(result);
			});
			var wayVectors = findWays(ways, nodes, lat, lon);
			findMatchingWay(wayVectors,lat,lon).done(function(way){
				if(typeof way != "undefined"){
					findIntersections(wayVectors, way, lat, lon);
					getIsecWarnings(wayVectors);
					deferred.resolve(way);
				}else{
					console.log("kreugzungsnode");
					deferred.resolve("an kreuzung");
				}
			});			
		}
	});
	return deferred;
}

function sqr(x) { 
	return x * x 
}
function dist2(v, w) { 
	return sqr(v.x - w.x) + sqr(v.y - w.y) 
}
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0) return dist2(p, v);
  if (t > 1) return dist2(p, w);
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { 
	return Math.sqrt(distToSegmentSquared(p, v, w)); 
}
function getSide(compass, startPoint, endPoint, page){
	var startBearing = calcBearing(lat, lon, startPoint.lat, startPoint.lon);
	var endBearing = calcBearing(lat, lon, endPoint.lat, endPoint.lon);
	
	if(startBearing>(compass-90)&&startBearing<(compass+90)){
		var temp = startPoint;
		startPoint = endPoint;
		endPoint = temp;
	}
	
	var bool = isLeft(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon, lat, lon);
	console.log("isLeft = "+bool);
	
	if(page = "routing"){
		if(bool){
			$.mobile.changePage($("#routing"), "none");
		}else{
			//change to view on right side
			$.mobile.changePage($("#routingRight"), "none");
		}
	}else{
		if(bool){
			$.mobile.changePage($("#streetViewLeft"), "none");
		}else{
			//change to view on right side
			$.mobile.changePage($("#streetViewRight"), "none");
		}
	}
}

function findIntersections(wayVectors,street,lat,lon) {
	console.log("searching intersections " + wayVectors.length);
	console.log(street);
	var intersections = [];
	var isec;
	$.each(wayVectors, function(i, element){
		if(element.wayId!==street.wayId){
			isec = getIntersection(element.nodes,street);
			if (isec != -1) {
				var intersectionEntry = new intersection(element.wayId, street.wayId, isec);
				console.log("created intersection " + element.wayId +" "+ street.wayId);
				if (!(isAlreadyInIntersections(intersectionEntry, intersections))) {
					intersections.push(intersectionEntry);
				}
				else{
					console.log("already in");
					console.log(intersectionEntry);
					console.log(intersections)
				}
			}
		}
	});
	console.log(intersections);
}
function getIntersection(nodeArray, way) {
	var isec = -1;
	for ( var k = 0; k < nodeArray.length; k++) {
		if ((nodeArray[k].x === way.startlat) && (nodeArray[k].y === way.startlon)||(nodeArray[k].x === way.endLat) && (nodeArray[k].y === way.endLon)) {
			console.log(nodeArray[k]);
			isec = nodeArray[k];
		}
	}
	return isec;
}
function isAlreadyInIntersections(intersection, intersections) {
	for ( var i = 0; i < intersections.length; i++) {
		if ((intersections[i].node.x === intersection.node.x) && (intersections[i].node.x === intersection.node.x)) {
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

function getIsecWarnings(wayVectors){
	var warnings = [];
	$.each(wayVectors, function(index, way){
		for(var i=index+1; i<wayVectors.length; i++){
			var nextWay =  wayVectors[i];
			warnings.push(testOverlap(way, nextWay));
		}
	});
	if(warnings.length!==0){
		console.log(warnings);
		return warnings;
	}
}

function testOverlap(wayA, wayB){
	var warnings = [];
	console.log("test for intersection");
	console.log(wayA);
	console.log(wayB);
	for(var i=0; i<wayA.nodes.length-1; i++){
		for(var k=0;k<wayB.nodes.length-1; k++){
			var line1Start = wayA.nodes[i];
			var line1End = wayA.nodes[i+1];
			var line2Start = wayB.nodes[k];
			var line2End = wayB.nodes[k+1];
			
			console.log("getOverlaps");
			var warning = getOverlaps(line1Start.x,line1Start.y,line1End.x, line1End.y,line2Start.x,line2Start.y,line2End.x,line2End.y);
			if(warning!==null){
				console.log("gepusht");
				warnings.push(new intersection(wayA, wayB, warning));
			}
		}
	}
	console.log(warnings);
	return warnings;
}

function getOverlaps(x1,y1,x2,y2, x3,y3,x4,y4){
	var ux = x2-x1;
	var uy = y2-y1;
	var vx = x4-x3;
	var vy = y4-y3;
	var discriminant = ux*vy-uy*vx;
	
	if(discriminant!=0){
		var wx = x1-x3;
		var wy = y1-y3;
		var w2x = x2-x3;
		var w2y = y2-y3;
		var t0, t1;
		var numerator1 = vx*wy-vy*wx;
		var numerator2 = ux*wy-uy*wx;
		
		wy = numerator1/discriminant;
		wx = numerator2/discriminant;
		
		if((wy>0 && wy<1)&&(wx>0 && wx<1)){
			var isecX = (parseFloat(x1)+wy*ux);
			var isecY = (parseFloat(y1)+wy*uy);
			//console.log(x1+", "+y1+" "+x2+", "+y2+" "+x3+", "+y3+" "+x4+", "+y4);
			console.log("WARNING: intersection: "+isecX+", "+isecY);
			return new point(isecX, isecY);
		}
	}
	return null;
}
