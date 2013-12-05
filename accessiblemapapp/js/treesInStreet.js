function findTreeStreet(bbox) {
	var deferred = $.Deferred();
	console.log(bbox);
	var trees = [];
	$.ajax({
		type: 'GET',
		url : "/data/baumkataster.json",
		dataType: 'json',
		success : function(data) {
			$.each(data.features, function(index, geom){
				var lat = geom.geometry.coordinates[1];
				var lon = geom.geometry.coordinates[0];
				if((lat>bbox[1]) && (lon>bbox[0]) && (lat<bbox[3]) && (lon<bbox[2])){
					if(parameters.streetSegment[0].name == streetname){
						trees.push(new orientationEntry(lat, lon, "tree"));
					}
				}
			});
			deferred.resolve(trees);
		}	
	});	
	return deferred;
}