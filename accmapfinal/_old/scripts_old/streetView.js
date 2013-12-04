var compassHeading=0;
var lat,lon;
var street;
var elementsList = new Array();
var notFinished = true;
function getGPSLocation() {
	$("#log").append("asking for geolocation");
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
		$("#log").append("success");
		findNearbyStreets(lat,lon);
		
			}
	;
	function error(err) {
		$("#log").append("error");
		alert('ERROR(' + err.code + '): ' + err.message);
	}
	;
	navigator.geolocation.getCurrentPosition(success, error, options);
}
function getManualLocation(){
	$("#log").append("asking for geolocation");
	var latLonArr =$('#insertBox').val();
	console.log("entered " + latLonArr);
	var splitted = latLonArr.split(",");
	lat =parseFloat(splitted[0]);
	lon =parseFloat(splitted[1]);
	findNearbyStreets(lat,lon);

}

function getCity(streetName, bbox) {
	$
			.ajax({
				type : 'GET',
				url: "http://nominatim.openstreetmap.org/search?format=json&viewbox="+bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3]+"&q="+encodeURIComponent(streetName)+"&bounded=1&limit=100",
				dataType : 'jsonp',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
				},
				success : function(parameters) {
					console.log(parameters);
					$('#location').html("Ihr Standort: </br>" + parameters[0].display_name);
				},
			});
	
}
function findNearbyStreets(lat, lon) {
	$("#log").append("searching streets");
	$.ajax({
		type : 'GET',
		url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=" + lat
				+ "1&lng=" + lon + "&username=accessiblemap",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
			alert(parameters);
		},
		success : function(parameters) {
			console.log("success intersections from geonames");
			console.log(parameters);
			street = parameters.streetSegment[0];
			var radius =$('#insertRadiusBox').val();
			var bbox = getBbox(lat, lon, radius);
			getCity(street.name, bbox);
			findIntersections(parameters.streetSegment,street.name,lat,lon);
		},
	});
}

function findIntersections(elements,street,lat,lon) {
	$("#log").append("searching intersections" + elements.length);
console.log("searching intersections" + elements.length);
var intersections = new Array();
var startVal = 0;
var isec;
for ( var i = 0; i < elements.length; i++) {
	console.log(elements[i].name + " vs " + street);
	if (elements[i].name == street) {
		startVal += 1;
		for ( var k = startVal; k < elements.length; k++) {
			isec = getIntersection(separateLineToArray(elements[i].line),separateLineToArray(elements[k].line));
			if (isec != -1) {
				var intersectionEntry = new intersection(elements[i].name,elements[k].name, isec);
				//console.log("created intersection " + elements[i].name +	elements[k].name + isec);
				if (!(isAlreadyInIntersections(intersectionEntry, intersections))) {
					intersections.push(intersectionEntry);
				}
				else{
					console.log("already in");
				}
			}
		}
}
writeIntersections(intersections,street,lat,lon);
}
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
function separateLineToArray(line) {
	var arr = line.split(",");
	return arr;
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

function writeIntersections(intersections,street,lat,lon) {
var node;
if (intersections.length == 0) {
	console.log('keine Kreuzungen gefunden');
} else {
	intersections.sort(function(a, b) {
		if (a instanceof intersection && b instanceof intersection) {
			if (a.distance > b.distance) {
				return 1;
			} else if (a.distance == b.distance) {
				return 0;
			} else {
				return -1;
			}
		}
	});
	checkCompass();
}
	intersections.forEach(function(entry){
		node = entry.node;
		if (entry.streetA == street) {
			distance = calcDistance(getLon(node), 
					getLat(node), 
					lon,
					lat);
			clock = calcAll(getLon(node), 
					getLat(node), 
					lon, 
					lat,
					compassHeading);
			clockNumber = getClock(clock);
		console.log(entry.StreetA + " mit "+ street +","+clockNumber+","+distance);
	}
	});
}
function getStreetView(){
	var listPOIs = getSelectedElements();
	getElements(listPOIs);
}
function sortElements(){
	elementsList.sort(function(a, b) {
		if (a instanceof element && b instanceof element) {
			if (a.distance > b.distance) {
				return 1;
			} else if (a.distance == b.distance) {
				return 0;
			} else {
				return -1;
			}
		}
	});
	
}
function writeList(){
	sortElements();
       
	$('#output').html("<h5> In dieser Strasse </h5>");
	$('#output').append("<table><tr><th scope=\"col\">Was</th><th scope=\"col\">Wie weit</th><th scope=\"col\">Lat</th><th scope=\"col\">Lon</th></tr>");
	for(var i = 0; i < elementsList.length; i++){
		$('#output').append("<tr><td>"+elementsList[i].type + " ( " + elementsList[i].nodeId + " )</td><td>"  + elementsList[i].distance + " km </br></td><td>"+ elementsList[i].lat +"</td><td>" +  elementsList[i].lon+"</td></tr>");
	}
}
function getSelectedElements(){
	var selectedPOIs = new Array();
	$('#selection input:checked').each(function() {
		var name = $(this).attr('name');
		if(name == "tree"){
			selectedPOIs.push("natural = "+name);
		}else{
		selectedPOIs.push("amenity = "+name);
		}
	});
	console.log(selectedPOIs);
	return selectedPOIs;
}
function getElements(list){
	var streetNodesArray = separateLineToArray(street.line); 
	
	//output from geonames looks like 8.8319362 47.2369028
	var streetNodes = new Array();
	for(var x = 0; x < streetNodesArray.length; x++){
		streetNodes.push(changeCords(streetNodesArray[x]));
	}
	for(var j = 0; j < streetNodes.length; j++){
	for(var i = 0; i < list.length; i++){
		getPOIs(streetNodes[j][0],streetNodes[j][1],list[i]);
	}
	}

}
function changeCords(nodeString){
	var arr = nodeString.split(" ");
	arr.reverse();
	return arr;
}
function element(nodeId,lat,lon,type,distance){
	this.lat = lat;
	this.lon = lon;
	this.type = type;
	this.distance = distance;
	this.nodeId = nodeId;
}
function getPOIs(nodeLat,nodeLon,keyWord) {
	var radius =$('#insertRadiusBox').val();
	var bbox = getBbox(nodeLat, nodeLon, radius);
		$
			.ajax({
				type : 'GET',
				url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node["+keyWord+"]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
			//	url: "http://nominatim.openstreetmap.org/search?format=json&viewbox="+bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3]+"&q="+keyWord+"&bounded=1&limit=100",
				dataType : 'json',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
				},
				success : function(parameters) {
					console.log("found " +parameters.elements.length + " " + keyWord);
					for(var i = 0; i < parameters.elements.length; i++){
						if(!(alreadyInPOIS(parameters.elements[i].id, keyWord))){
						var distance = /*Math.round(*/calcDistance(parameters.elements[i].lat, parameters.elements[i].lon, lat,lon);/*1000)/1000*/;
						console.log(keyWord +" found in distance "+ calcDistance(parameters.elements[i].lat, parameters.elements[i].lon, nodeLat,nodeLon) + " to node " + nodeLat + "," + nodeLon);
						var poi = new element(
								parameters.elements[i].id,
								parameters.elements[i].lat, 
								parameters.elements[i].lon,
								keyWord,
								//getPhrase(keyWord,"de"),
								distance);
						elementsList.push(poi);
					
						}
					}
					writeList();
					$('#output').append("</table>");
				},
			});
		
}
function getPhrase(keyWord,code){
	return lang.de.tree;
	
}
function alreadyInPOIS(nodeId, keyWord){
	for ( var i = 0; i < elementsList.length; i++) {
		if (elementsList[i].nodeId == nodeId && elementsList[i].type == keyWord) {
			return true;
		}
	}
	return false;
}
function getSearchString(keyWord){
	var searchString = "";
	switch(keyWord){
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
	console.log("searchstring = " + searchString);
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
function checkCompass() {
	var alpha = 0;
	if (window.DeviceOrientationEvent) {
		window.addEventListener('deviceorientation', function(event) {
			//iOs
			if (event.webkitCompassHeading) {
				alpha = event.webkitCompassHeading;
			}
			//non iOS
			else {
				webkitAlpha = event.alpha;
				alpha = webkitAlpha;
				if (!window.chrome) {
					alpha = webkitAlpha - 270;
				}
			}
			alpha = event.alpha;
			showAlpha(alpha);
		}, false);
	} 
}
function getLon(node) {
	return node.split(" ")[0];
}
function getLat(node) {
	return node.split(" ")[1];
}

function getClock(degrees) {
	var clockNumber = degrees;
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
	return a * Math.PI / 180;
}

function rad2deg(a) {
	return a * 180 / Math.PI;
}

function frac(a) {
	return (a - Math.floor(a));
}
function calcDistance(lat1, lon1, lat2, lon2) {
//	var r0 = 6371.0, a = deg2rad(90 - lat1), b = deg2rad(90 - lat2), gamma = deg2rad(Math
//			.abs(lon2 - lon1)), c = Math.acos(Math.cos(a) * Math.cos(b)
//			+ Math.sin(a) * Math.sin(b) * Math.cos(gamma)), kc = c * r0, kc = Math
//			.round(1000 * kc) / 1000;
//	return kc;
	var r0 = 6371.0;
	var dLat = deg2rad(lat2 - lat1);
	var dLon = deg2rad(lon2-lon2);
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = r0 * c;
	var timesten = Math.round(1000*parseFloat(d.toFixed(4)) * 10.0)/1000;
	return	timesten;
	//return M;
}
function calcAll(X1, Y1, X2, Y2, deviceCompassHeading) {
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
	//azimuth in degrees
	azi = azi * (180 / PI);
	//if compassHeading greater than target-azimuth
	if (compassHeading > azi) {
		var temp = azi - compassHeading;
		azimCompassHeading = 360 + temp;
		//if compassHeading is exactly north
	} else if (compassHeading == 0) {
		azimCompassHeading = azi;
	}
	//if compassHeading smaller than target-azimuth
	else {
		azimCompassHeading = azi - compassHeading;
	}
	return azimCompassHeading;
}
