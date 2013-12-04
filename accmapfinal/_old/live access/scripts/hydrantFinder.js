function getHydrant(){
	var hydrants = new Array();
	var bbox = getBbox(lat, lon, "3");
	console.log(bbox[0] +"," + bbox[1]+"," + bbox[2]+"," + bbox[3]);
	$
	.ajax({
		type : 'GET',
		url: "http://nominatim.openstreetmap.org/search?format=json&viewbox="+bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3]+"&q=fire_hydrant%20near["+lat+"," + lon+"]&bounded=1&limit=100",
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			console.log('hydranten');
			for(var i = 0; i < parameters.length; i++){
				var hyd = new Hydrant(parameters[i].lat, parameters[i].lon,parameters[i].display_name,Math.round(calcDistance(parameters[i].lat, parameters[i].lon, lat,lon)*1000)/1000);
				hydrants.push(hyd);
			}
			writeHydrants(hydrants);
		},
	});
}

function writeHydrants(hydrants){
	return hydrants;
}