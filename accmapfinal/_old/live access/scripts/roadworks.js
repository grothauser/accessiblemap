function findRoadworks(lat, lon) {
	/*var lat = 47.37622989059941;
	var lon = 8.540372103452682;*/
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
			getRoadworksInBox(lat, lon, street.name)
			//getRoadworksFromJson(lat, lon, streetCoords, street.name);
		},
	});
}

function getRoadworksInBox(lat, lon, streetname) {
	var bbox = getBbox(lat, lon, 0.05);
	for(var i = 0; i < zueriRoadworks.length; i++) {
		for(var k = 0; k<zueriRoadworks[i].length; k++){
		var latLon = zueriRoadworks[i][k].split(",");
			if ((latLon[0] > bbox[1]) && (latLon[1] > bbox[0]) && (latLon[0] < bbox[3]) && (latLon[1] < bbox[2])) {
				var inBox = latLon;
				(function(latLon) {
					$.ajax({
						type : 'GET',
						url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat="+ latLon[0] + "1&lng=" + latLon[1] + "&username=accessiblemap",
						dataType : 'json',
						jsonp : 'json_callback',
						error : function(parameters) {
							console.error("error");
							alert(parameters);
						},
						success : function(parameters) {
							if (parameters.streetSegment[0].name == streetname) {
								fillSelPoiArray("constructionWork,"+latLon[0]+","+latLon[1]);
							}
						}
					});
				})(latLon);
			}
		}
	}
}

function getRoadworksFromJson(lat, lon, streetCoords, streetname) {
	var d = new Date();
	var month = d.getMonth()+1;
	var day = d.getDate();
	var actualDate = ""+d.getFullYear() +
	    (month<10 ? '0' : '') + month +
	    (day<10 ? '0' : '') + day;
	var roadworkCoords = [];
	readRoadworkFile(function(data) {
		console.log(data);
		var roadworks = data.features;
		for ( var i = 0; i < roadworks.length; i++) {
			if(roadworks[i].properties.Baubeginn<actualDate&&roadworks[i].properties.Bauende>actualDate){
				var polyCoords = [];
				if (roadworks[i].geometry.type == "Polygon") {
					for ( var k = 0; k < roadworks[i].geometry.coordinates[0].length; k++) {
						polyCoords.push(roadworks[i].geometry.coordinates[0][k][1] + ", " + roadworks[i].geometry.coordinates[0][k][0]);
					}
				} else {
					for ( var a = 0; a < roadworks[i].geometry.coordinates.length; a++) {
						for ( var k = 0; k < roadworks[i].geometry.coordinates[a][0].length; k++) {
							polyCoords.push(roadworks[i].geometry.coordinates[a][0][k][1] + ", " + roadworks[i].geometry.coordinates[a][0][k][0]);
						}
					}
				}
				roadworkCoords.push(polyCoords);
			}else{
				console.log(roadworks[i].properties.Baubeginn+">"+actualDate+" oder "+roadworks[i].properties.Bauende+"<"+actualDate);
			}
		}
		getRoadworksInBox(lat, lon, roadworkCoords, streetname);
	});
}

function readRoadworkFile(callback) {
	$.ajax({
		url : "/../data/tiefbaustelle.json",
		success : function(data) {
			callback(data);
		}
	});
}