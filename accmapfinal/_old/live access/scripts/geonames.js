var locatedStreet;
var locatedLat;
var locatedLon;
var compassHeading=0;

// 1. get GPS Location
//function getGPSLocation() {
//	console.log('asking geolocation');
//	var options = {
//		enableHighAccuracy : true,
//		timeout : 5000,
//		maximumAge : 0
//	};
//	function success(pos) {
//		var crd = pos.coords;
//		findNextIntersectionGeoNames(crd.latitude, crd.longitude);
//	}
//	;
//	function error(err) {
//		alert('ERROR(' + err.code + '): ' + err.message);
//	}
//	;
//	navigator.geolocation.getCurrentPosition(success, error, options);
//}
//function fake() {
//	var latLonArr =$('#insertBox').val();
//	compassHeading = 0;
//	var splitted = latLonArr.split(",");
//	findNextIntersectionGeoNames(splitted[0],splitted[1]);
//}
function findNextIntersectionGeoNames(lat, lon) {
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
			getCity(lat, lon, parameters);
		
		},
	});
}
function getCity(lat, lon, parametersGeonames) {
		$
				.ajax({
					type : 'GET',
					url : "http://open.mapquestapi.com/nominatim/v1/reverse?format=json&lat="
							+ lat + "&lon=" + lon + "&zoom=18&addressdetails=1",
					dataType : 'jsonp',
					jsonp : 'json_callback',
					error : function(parameters) {
						console.error("error");
					},
					success : function(parameters) {
						console.log(parameters);
						var street = parameters.address.road == undefined? parameters.address.footway :parameters.address.road;  
						console.log("locatedStreet " + street);
						$('#location').html( street +
								", " +
								parameters.address.city+ 
								" <br> lat: " + locatedLat + " " +
								"lon:" + locatedLon);
						//findIntersections(parametersGeonames.streetSegment);
					},
				});
		
}
function findIntersections(elements) {
	var intersections = new Array();
	var startVal = 0;
	var isec;
	for ( var i = 0; i < elements.length; i++) {
		console.log(elements[i].name + " vs " + locatedStreet);
		if (elements[i].name == locatedStreet) {
			startVal += 1;
			for ( var k = startVal; k < elements.length; k++) {
				isec = getIntersection(separateLineToArray(elements[i].line),separateLineToArray(elements[k].line));
				if (isec != -1) {
					var intersectionEntry = new intersection(elements[i].name,elements[k].name, isec);
					console.log("created intersection " + elements[i].name +	elements[k].name + isec);
					if (!(isAlreadyInIntersections(intersectionEntry, intersections))) {
						intersections.push(intersectionEntry);
					}
					else{
						console.log("already in");
					}
				}
			}
		} else {
			console.log("not found for " + elements[i].name + " with "
					+ locatedStreet);
		}
	}
	writeIntersections(intersections);
}
function isAlreadyInIntersections(intersection, intersections) {
	for ( var i = 0; i < intersections.length; i++) {
		if (intersections[i].node == intersection.node) {
			return true;
		}
	}
	return false;
}
function writeIntersections(intersections) {
	var node;
	var intersectionshtml = $('#intersectionsfwd');
	intersectionshtml.innerHTML = "";
	if (intersections.length == 0) {
		intersectionshtml.innerHTML = 'keine Kreuzungen gefunden';
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
			if (entry.streetA == locatedStreet) {
				distance = calcDistance(getLon(node), 
						getLat(node), 
						locatedLon,
						locatedLat);
				clock = calcAll(getLon(node), 
						getLat(node), 
						locatedLon, 
						locatedLat,
						compassHeading);
				clockNumber = getClock(clock);
			insertHTML(entry,clockNumber,distance);
		}
		});
	}
function insertHTML(intersection, clockNumber, distance) {
	var nameOfStreetA = intersection.streetA;
	var nameOfStreetB = intersection.streetB;
	var node = intersection.node;
	console.log(node);
	$('#intersectionsfwd').append( 
				nameOfStreetA + ", "+ 
				nameOfStreetB + " in " + 
				distance + "km auf " + 
				clockNumber	+ " Uhr (" + getLat(node) + "," + getLon(node) + ") <br>");
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
	var r0 = 6371.0, a = deg2rad(90 - lat1), b = deg2rad(90 - lat2), gamma = deg2rad(Math
			.abs(lon2 - lon1)), c = Math.acos(Math.cos(a) * Math.cos(b)
			+ Math.sin(a) * Math.sin(b) * Math.cos(gamma)), kc = c * r0, kc = Math
			.round(1000 * kc) / 1000;
	return kc;
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
function intersection(streetA, streetB, node) {
	this.streetA = streetA;
	this.streetB = streetB;
	this.node = node;
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
function showAlpha(alpha) {
	compassHeading = alpha;
	document.getElementById('compassHeading').innerHTML = alpha;
	return alpha;
}
function checkCompass() {
	var alpha = 0;
	if (window.DeviceOrientationEvent) {
		document.getElementById('compassAvalibale').innerHTML = 'Kompass verfügbar';
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
	} else {
		output.appendChild(document.createTextNode("compass läuft nicht"));
	}
}
