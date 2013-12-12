var coords = [];
var allPaths = [];
var allNodes = [];
var allWaysWithNodeCoords = [];
var nodesOfRoute = [];
var minimumNodeDistance = 0.015;
var reversedRoute = false;
function getRouteOSRM(lat1, lon1,lat2, lon2, reverseroute) {
	reversedRoute = reverseroute;
	$.ajax({
		url: "js/proxy.php?url="+encodeURIComponent("http://routing.osm.ch/routed-foot/viaroute?loc="+lat1+","+lon1+"&loc="+lat2+","+lon2+"&output=gpx"),
		type: 'GET',
		dataType : 'xml',
		error : function(data) {
			console.error("error");
		},
		success : function(data) {
			extractCoordinates(data);
		},
	});
}
function extractCoordinates(data){
	coords = [];
	$(data).find('rtept').each(function(){
		coords.push(new coordPair($(this)[0].attributes[0].value , $(this)[0].attributes[1].value));
	});
	if(coords.length !== 0){
		checkCompass().done(function(compval){
			getSide(compval, coords[0], coords[1], "routing");
		});
		fillRouteWithOverpassData(coords);
	}
	else{
		$.mobile.changePage($("#routing"), "none");
		writeRoute(coords);
	}
	return coords;
}
function fillRouteWithOverpassData(routeCoords){
	allPaths = [];
	allNodes = [];
	allWaysWithNodeCoords = [];
	var bbox = getMinMaxForRoute(routeCoords);
	// go trough all coords of the route
	searchOverpassForNearestNode(bbox,'way["highway"]').done(function(allWays,allNodesResult){
		$.each(allWays, function(index, path){
			allPaths.push(path);
		});
		$.each(allNodesResult, function(index, node){
			allNodes.push(node);
		});
		searchNearestNodes();
		fillDataFromOSM();
		checkRouteOSRM();
		var wayVectors = [];
        $.each(allPaths, function(i, path){
    		var nodes = [];
    		//get all nodes of way
    		$.each(path.nodes, function(index, node){
    			//get node info but not for the last
    			var nodeInfo = getNodeInfo(node, allNodes);
    			nodes.push(new point(nodeInfo.lat, nodeInfo.lon));
    			//if all nodeinfo is here
    			if(nodes.length === path.nodes.length){
    				var wayVec = new wayVector(path.id, nodes, path.tags);
    				wayVectors.push(wayVec);
    			}
    		});
    	});
		writeRoute(coords, wayVectors);
	});
}
function searchNearestNodes(){
	nodesOfRoute = [];
	$.each(coords, function(i, coord){
	var nearestNode;
	var smallestDist;
	$.each(allNodes, function(index, node){
		var distance = calcDistance(node.lat,node.lon,coord.lat,coord.lon);
		if(index == 0){
			smallestDist = distance;
			nearestNode = node;
		}
		if(distance < smallestDist){
			smallestDist = distance;
			nearestNode = node;
		}
		if(index == (allNodes.length-1)){
			if(smallestDist <= minimumNodeDistance){
				nodesOfRoute.push(new coordPair(coord.lat, coord.lon,nearestNode.id));
			}
			else{
				nodesOfRoute.push(new coordPair(coord.lat, coord.lon,""));
			}
		}
		
	});
	});
}
function alreadyInWays(way){
	 var result = $.grep(allWaysWithNodeCoords, function(path){ return path.wayId == way.wayId; });
	 return result >=1;
}
function fillDataFromOSM() {
	// go trough all paths
	$.each(allPaths, function(index, way){
		if(!alreadyInWays(way)){
		var nodesOfWay = [];
		// go trough all nodes of way
		$.each(way.nodes, function(indexNodes, nodeId){
			// find a match in allnodes
			$.each(allNodes, function(indexAll, node){
				
				if(node.id == nodeId){
					var isAlreadyInNodes = $.grep(nodesOfWay, function(nodeinway){ return nodeinway.id == node.id; });
					if(isAlreadyInNodes.length<1){
						nodesOfWay.push(new coordPair(node.lat,node.lon,node.id));
					}
				}
				if((indexNodes == (way.nodes.length-1))&&(indexAll == (allNodes.length-1))) {
					var wayWithCoords = new wayOfRoute(way.id, nodesOfWay, way.tags);
					
					var isAlreadyIn = $.grep(allWaysWithNodeCoords, function(wayIn){ return wayIn.wayId == way.id; });
					if(isAlreadyIn.length<1){
						allWaysWithNodeCoords.push(wayWithCoords);
					}
					
				}
			});
			
		});
		}else{
			return false;
		}
	});
}
function checkRouteOSRM(){
	// nodesOfRoute contains the nearest node for a coordinate
	wayPerCord = [];
	$.each(coords, function(index, coord){
		var nearestNodesArr = $.grep(nodesOfRoute, function(node){ return ((node.lat == coord.lat) && (node.lon == coord.lon)); });
		var nearestNode = nearestNodesArr[0];
		if(index <= (coords.length - 2)){
			var nextcoord = coords[index+1];
			var nearestNodesNextCordArr = $.grep(nodesOfRoute, function(node){ return ((node.lat == nextcoord.lat) && (node.lon == nextcoord.lon)); });
			var nearestNodeNextCord = nearestNodesNextCordArr[0];
		}	
		//if first node is the same as the second we take the located way
		if((index == 0) && (nearestNode.id == nearestNodeNextCord.id)&& (!reversedRoute)){
			wayPerCord.push(new way(locatedWay.way.wayId, nearestNode.id,locatedWay.way.tags,coord.lat,coord.lon));
			
		}else if(nearestNode.id != ""){
			//if coord has a nearest node 
			if(nearestNodesArr.length == 1){
				
				var waysForNode = getWaysForNode(nearestNode.id);
				//if only one way for nearest node take it
				if(index <= (coords.length - 2)){
					if(waysForNode.length==1){
						wayPerCord.push(new way(waysForNode[0].wayId, nearestNode.id,waysForNode[0].tags,coord.lat, coord.lon));
					}else{
						var nextcoord = coords[index+1];
						var nearestNodesNextCordArr = $.grep(nodesOfRoute, function(node){ return ((node.lat == nextcoord.lat) && (node.lon == nextcoord.lon)); });
						var nearestNodeNextCord = nearestNodesNextCordArr[0];
						//get all ways for the next node
						
						var waysForNextNode = getWaysForNode(nearestNodeNextCord.id);
		
						if(nearestNode.id != nearestNodeNextCord.id){
							
							//if only one way for the next node take it
							if(waysForNextNode.length==1){
								wayPerCord.push(new way(waysForNextNode[0].wayId, nearestNode.id,waysForNextNode[0].tags,coord.lat, coord.lon));
							}else{
								//see which way they have in common
								$.each(waysForNode, function(i, wayOfNode){
									$.each(waysForNextNode, function(inode, wayOfNextNode){
										//takes the first common way both of the nodes have (possible issue if more ways contain the same two nodes)
										if(wayOfNextNode.wayId == wayOfNode.wayId){
											wayPerCord.push(new way(wayOfNode.wayId,nearestNode.id,wayOfNode.tags, coord.lat, coord.lon));
											return false;
										}
									});
								});
							}
						}else{
							if(index <= (coords.length-3)){
								// if the overnext node also has the same wayId, it is a continued road
								var overNextCord = coords[index+2];
								var nearestNodesOverNextArr = $.grep(nodesOfRoute, function(node){ return ((overNextCord.lat == node.lat) && (overNextCord.lon == node.lon)); });
								var overNextNode = nearestNodesOverNextArr[0];
								
								var waysForOverNextCord = getWaysForNode(overNextNode.id);
								
								$.each(waysForOverNextCord, function(i, wayOfOverNextNode){
									$.each(waysForNode, function(inode, wayOfNode){
										//takes the first common way both of the nodes have (possible issue if more ways contain the same two nodes)
										if(wayOfNode.wayId == wayOfOverNextNode.wayId){
											wayPerCord.push(new way(wayOfNode.wayId,nearestNode.id,wayOfNode.tags, coord.lat, coord.lon));
											return false;
										}
									});
		
								});
							}
						}
					}
				}
				else{
					//for the last node we look backwards
					var lastCord = coords[index-1];
					var nearestNodesLastNodeArr = $.grep(nodesOfRoute, function(node){ return ((lastCord.lat == node.lat) && (lastCord.lon == node.lon)); });
					var lastNode = nearestNodesLastNodeArr[0];
					
					var waysForLastCord = getWaysForNode(lastNode.id);
					$.each(waysForLastCord, function(i, wayOfLastNode){
						$.each(waysForNode, function(inode, wayOfNode){
							//takes the first common way both of the nodes have (possible issue if more ways contain the same two nodes)
							if(wayOfNode.wayId == wayOfLastNode.wayId){
								wayPerCord.push(new way(wayOfNode.wayId,nearestNode.id,wayOfNode.tags, coord.lat, coord.lon));
								return false;
							}
						});
					});
				
				}
			}
		}
	});
}

function getWaysForNode(nodeId) {
	var waysArray = [];
	$.each(allWaysWithNodeCoords, function(index, path){
		$.each(path.nodes, function(i, node){
			if(node.id == nodeId){
				var resultArr = $.grep(waysArray, function(way){ return way.wayId == path.wayId; });
				if(resultArr.length == 0){
					waysArray.push(path);
				}
			}
		});
	});
	return waysArray;
}

function wayIsInArr(way, array){
	for(var i = 0; i < array.length; i++){
		if(way.id == array[i].id){
			return true;
		}
	}
	return false;
}

function getWaysWithCommonNodes(node,waysForCoords,waysForNextCoords,lat,lon,nextNodeLat,nextNodeLon){
	var waysWithCommonNodes = [];

	// check all ways of first coordinate
	$.each(waysForCoords, function(index, way){
		// if one of their ways is also in ways for the next coordinate
		if(wayIsInArr(way, waysForNextCoords)){	
			var match = new coordWayMatch(way.wayId, lat, lon,node.id,way.tags);
				waysWithCommonNodes.push(match);
			}
	});
	return waysWithCommonNodes;
}