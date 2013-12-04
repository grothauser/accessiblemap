var isZurich = new Array();
var waysOfRoute = new Array();
var cordsOfRoute = new Array();

function routeYOURSAPI(fromLat, fromLon,toLat, toLon) {
	$.ajax({
		url: "../js/proxy.php?url="
					+ encodeURIComponent("http://www.yournavigation.org/api/1.0/gosmore.php?format=geojson&" 
					+"flat="+ fromLat + "&flon=" + fromLon
					+ "&tlat=" + toLat + "&tlon=" + toLon
					+ "&v=foot&fast=0&layer=mapnik&instructions=1&lang=de"),
		type : 'GET',
		dataType : 'json',
		error : function(data) {
			console.error("error");
			console.log(data);
		},
		success : function(data) {
			console.log(data);
			interpreteYOURSRoute(data);
		},
	});
}

function interpreteYOURSRoute(data) {
		fillCoordinates(data);
		if(detectmob()){
			checkCompass().done(function(compval){
				getSide(compval, cordsOfRoute[0], cordsOfRoute[1], "routing");
			});
		}else{
			getSide(0, cordsOfRoute[0], cordsOfRoute[1], "routing");
		}
		console.log(cordsOfRoute);
		$.each(cordsOfRoute, function(indexCoord, coord){
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
								if(indexCoord == (cordsOfRoute.length-1)){
									checkRoute();
								}
						}
						
						
					});
					
				});
				
			
			});
			
	});
	
}

function fillCoordinates(data) {
	for ( var i = 0; i < data.coordinates.length; i++) {
		cordsOfRoute.push(new coordPair(data.coordinates[i][1],	data.coordinates[i][0]));
	}
}

function checkRoute() {
	for ( var i = 0; i < (cordsOfRoute.length) ; i++) {
		if(i < (cordsOfRoute.length - 1)){
			var waysForCords = getWaysForCords(cordsOfRoute[i].lat, cordsOfRoute[i].lon); 
			var waysForNextCords = getWaysForCords(cordsOfRoute[i + 1].lat,cordsOfRoute[i + 1].lon);
			//maybe it's a continued road -> check for common ways with waysofcord before
			getCommonWays(waysForCords, waysForNextCords,cordsOfRoute[i].lat,cordsOfRoute[i].lon,cordsOfRoute[i+1].lat,cordsOfRoute[i+1].lon);
		}else{
			writeRoute(cordsOfRoute);
		}
		
	}
}

