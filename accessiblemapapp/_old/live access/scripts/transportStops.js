function findTransportStops(lat, lon) {
	/*var lat = 47.37603554167182;
	var lon =  8.539444059133528;*/
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
			var street = parameters.streetSegment[0];
			var streetCoords = street.line.split(",");
			getStopsInBox(lat, lon, street.name)
			//getStopsFromJson(lat, lon, streetCoords, street.name);
		},
	});
}

function convertCoords(swissCoords){
	var y = (swissCoords[0]- 600000) / 1000000;
	var x = (swissCoords[1]- 200000) / 1000000;
	
	var lat = (16.9023892 + (3.238272 * x))	- (0.270978 * Math.pow(y, 2)) - (0.002528 * Math.pow(x, 2))	- (0.0447 * Math.pow(y, 2) * x)	- (0.0140 * Math.pow(x, 3));
	lat = (lat * 100) / 36;
	
	var lon = (2.6779094 + (4.728982 * y) + (0.791484 * y * x) + (0.1306 * y * Math.pow(x, 2))) - (0.0436 * Math.pow(y, 3));
	lon = (lon * 100) / 36;
	
	return lat+", "+lon;
}

function getStopsInBox(lat, lon, streetname) {
	var bbox = getBbox(lat, lon, 0.05);
	for ( var i = 0; i < zueriStops.length; i++){
		var latLon = zueriStops[i].split(",");
		if((latLon[0]>bbox[1]) && (latLon[1]>bbox[0]) && (latLon[0]<bbox[3]) && (latLon[1]<bbox[2])){
			var inBox = latLon;
			(function(latLon){
			$.ajax({
				type : 'GET',
				url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=" + latLon[0]
						+ "1&lng=" + latLon[1] + "&username=accessiblemap",
				dataType : 'json',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
					alert(parameters);
				},
				success : function(parameters) {
					if(parameters.streetSegment[0].name == streetname){
						fillSelPoiArray("transportStop,"+latLon[0]+","+latLon[1]);
						console.log("bla");
					}
				},
			});
			})(latLon);
		}
	}
}

function getStopsFromJson(lat, lon, streetCoords, streetname) {
	var stopCoords = new Array();
	readStopsFile(function(data) {
		var haltestellen = data.features;
		for ( var i = 0; i < haltestellen.length; i++) {
			stopCoords.push(convertCoords(haltestellen[i].geometry.coordinates));
		}
		getStopsInBox(lat, lon, stopCoords, streetname);
	});
}

function readStopsFile(callback) {
	$.ajax({
		url : "/live access/data/haltestelle.json",
		success : function(data) {
			callback(data);
		}
	});
}