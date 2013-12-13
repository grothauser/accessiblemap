function findTreeStreet(bbox) {
	var deferred = $.Deferred();
	var trees = [];
	$.ajax({
		type: 'GET',
		url : "../data/baumkataster.json",
		dataType: 'json',
		success : function(data) {
			$.each(data.features, function(index, geom){
				var lat = geom.geometry.coordinates[1];
				var lon = geom.geometry.coordinates[0];
				if((lat>bbox[1]) && (lon>bbox[0]) && (lat<bbox[3]) && (lon<bbox[2])){
					trees.push(new orientationEntry(lat, lon, "tree", geom.properties));
				}
			});
			deferred.resolve(trees);
		}	
	});	
	return deferred;
}