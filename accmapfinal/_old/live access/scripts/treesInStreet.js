function findTreeStreet(lat, lon, callback) {
	var deferred = $.Deferred();
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
			var streetCoords = parameters.streetSegment[0].line.split(",");
			getTreesFromJson(lat, lon,  parameters.streetSegment[0].name).done(function(){
				deferred.resolve();
			});
		},
	});
	return deferred;
}

function getTreesFromJson(lat, lon, streetname) {
	var deferred = $.Deferred();
	var treeCoords = [];
	readTreeFile().done(function(data) {
		var baumkataster = data.features;
		for ( var i = 0; i < baumkataster.length; i++) {
			treeCoords.push(baumkataster[i].geometry.coordinates[1]+", "+baumkataster[i].geometry.coordinates[0]);
		}
		var counter = 0;
		getTreesInBox(lat, lon, treeCoords, streetname, counter, function(counter){
			if(counter == 0){
				deferred.resolve();
			}
		});
	});
	return deferred;
}

function readTreeFile() {
	var deferred = $.Deferred();
	$.ajax({
		type: 'GET',
		url : "/data/baumkataster.json",
		dataType: 'json',
		success : function(data) {
			deferred.resolve(data);
		}
	});
	return deferred;
}

function getTreesInBox(lat, lon, treeCoords, streetname, counter, callback) {
	var bbox = getBbox(lat, lon, 0.05);
	for ( var i = 0; i < treeCoords.length; i++){
		var latLon = treeCoords[i].split(", ");
		if((latLon[0]>bbox[1]) && (latLon[1]>bbox[0]) && (latLon[0]<bbox[3]) && (latLon[1]<bbox[2])){
			var inBox = latLon;
			counter +=1;
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
							fillSelPoiArray("tree",latLon[0],latLon[1], lat, lon);
						}
						counter--;
						callback(counter);
					}
				});
			})(latLon);
		}
	}
}
