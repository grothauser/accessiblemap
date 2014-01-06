function searchOverpassForLocationCoords(lat, lon, keyWord) {
	var deferred = $.Deferred();
	var bbox = getBbox(lat, lon, "100");
	var ways = [];
	var nodes = [];
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
			$.each(overpassResult.elements, function(index, result){
				if(result.type == "way"){
					ways.push(result);
				}
				else{
					nodes.push(result);
				}
			});
			findWays(ways, nodes, lat, lon);
			var way = findMatchingWay(lat,lon);
			if(typeof way != "undefined"){
				deferred.resolve(way);
			}else{
				deferred.resolve("");
			}
		}
	});
	return deferred;
}

function getWayInfoOverpass(wayId){
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];way("
				+ wayId + ");out body; node(w); out skel;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(overpassResult) {
			console.error("error");
		},
		success : function(overpassResult) {
			var paths = [];
			var nodes = [];
			for(var i=0; i<overpassResult.elements.length; i++){
				if(overpassResult.elements[i].type == "way")
					paths.push(overpassResult.elements[i]);
				else
					nodes.push(overpassResult.elements[i]);
			}
			deferred.resolve(paths, nodes);
		},
	});
	return deferred;
}
//returns the nearest node for a given coordinate
function searchOverpassForNearestNode(bbox,keyWord) {
	var deferred = $.Deferred();
	var ways = [];
	var nodes = [];
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
			$.each(overpassResult.elements, function(index, result){
				if(result.type == "way"){
					ways.push(result);
				}
				else{
					nodes.push(result);
				}
			});
			deferred.resolve(ways,nodes);
			
			
		}
	});
	return deferred;
}

function getPoisForKeyWord(bbox, keyWord){
	var deferred = $.Deferred();
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node["+keyWord+"]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			if(parameters.elements.length > 0){
				$.each(parameters.elements, function(index, data){
					var entry = new orientationEntry(data.lat, data.lon, keyWord, data.tags);
					orientationContent.push(entry);
					if(index == (parameters.elements.length-1)){
						deferred.resolve("");
					}
				});
			}
			else{
				deferred.resolve("0");
			}
		},
	});
	return deferred;
}
function getNodeInformation(nodeId) {
	var deferred = $.Deferred();
	$
			.ajax({
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