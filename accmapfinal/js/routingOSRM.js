var coords = new Array();
function routeOSRM(lat1, lon1,lat2, lon2) {

	$.ajax({
		url: "../js/proxy.php?url="
			+ encodeURIComponent("http://routing.osm.ch/routed-foot/viaroute?loc="+lat1+","+lon1+"&loc="+lat2+","+lon2+"&output=gpx"),
		type: 'GET',
		dataType : 'xml',
		error : function(data) {
			console.error("error");
		},
		success : function(data) {
			$(data).find('rtept').each(function(){
				//console.log($(this));
				coords.push(new coordPair($(this)[0].attributes[0].value , $(this)[0].attributes[1].value));
			});
			console.log(coords);
			if(detectmob()){
				checkCompass().done(function(compval){
					getSide(compval, coords[0], coords[1], "routing");
				});
			}else{
				getSide(0, coords[0], coords[1], "routing");
			}
			interpreteOSRMRoute(coords);
		},
	});

}
function interpreteOSRMRoute(data){
	console.log("interpreting osrm route");
	$.each(data, function(indexCoord, coord){
		console.log(coord.lat + "," + coord.lon);
		searchOverpassForCoords(coord,'way["highway"]').done(function(allPathsForCoord){
			var smallestDist;
			var nearestNode;
			//go trough all ways
			$.each(allPathsForCoord, function(indexPath, path){
				//go trough all nodes of path
				$.each(path.nodes, function(indexNodes, node){
					var dist = calcDistance(node.lat, node.lon, coord.lat, coord.lon);
					if(indexNodes == 0){
						smallestDist = dist;
						nearestNode = node;
					}else{
						if(smallestDist < dist){
							smallestDist = dist;
							nearestNode = node;
						}
					}
					if((indexNodes == (path.nodes.length-1)) && (indexPath == (allPathsForCoord.length-1))){
						var newWayMatch = new coordWayMatch(indexCoord,path.wayId, coord.lat, coord.lon,nearestNode.id,path.tags);
							waysOfRoute.push(newWayMatch);
							if(indexCoord == (data.length-1)){
								checkRouteOSRM();
							}
					}
					
					
				});
				
			});
			
		
		});
	});
	
	
}

function checkRouteOSRM() {
	console.log("checkroute osrm");
	for ( var i = 0; i < (coords.length) ; i++) {
		if(i < (coords.length - 1)){
			var waysForCords = getWaysForCords(coords[i].lat, coords[i].lon); 
			var waysForNextCords = getWaysForCords(coords[i + 1].lat,coords[i + 1].lon);
			//maybe it's a continued road -> check for common ways with waysofcord before
			getCommonWays(waysForCords, waysForNextCords,coords[i].lat,coords[i].lon,coords[i+1].lat,coords[i+1].lon);
		}else{
			writeRoute(coords);
		}
		
	}
}
