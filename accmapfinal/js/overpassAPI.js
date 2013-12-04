function searchOverpassForLocationCoords(lat, lon, keyWord) {
	var deferred = $.Deferred();
	var bbox = getBbox(lat, lon, "100");
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
				if(result.type == "way"){
					ways.push(result);
				}
				else{
					nodes.push(result);
				}
			});
			findWays(ways, nodes, lat, lon);
			var way = findMatchingWay(lat,lon)
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
function searchOverpassForCoords(coord,keyWord) {
	var deferred = $.Deferred();
	var bbox = getBbox(coord.lat, coord.lon, 30);
	console.log("searching for " + coord.lat + "," + coord.lon);
	$.ajax({
		type : 'GET',
		url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];"
				+ keyWord + "(" + bbox[1] + "," + bbox[0] + "," + bbox[3] + ","
				+ bbox[2] + ");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		// Handle results over to determination
		success : function(overpassResult) {
			var allPathsForCoord = new Array();
			$.each(overpassResult.elements, function(index, element){
				var allNodesOfWay = new Array();
					$.each(element.nodes, function(indexNodes, node){
						//get node lat,lon for all nodes of each way
						getNodeInformation(node).done(function(nodeData){
							allNodesOfWay.push(new coordPair(nodeData.lat, nodeData.lon, nodeData.id));
							if(indexNodes == (element.nodes.length-1)){
								allPathsForCoord.push(new wayOfRoute(element.id, allNodesOfWay,element.tags));
								if(index === (overpassResult.elements.length-1)){
									deferred.resolve(allPathsForCoord);
								}
								
							}
							
						});
						
						
					});
			
			});
			if(overpassResult.elements.length === 0){
				deferred.resolve(0);
			}
		}
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

