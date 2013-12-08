var orientationContent = [];
var roadworks = [];
var OPDistance = 0.3;
var today;	
var lat, lon;

function enricheWays(route){
	orientationContent = [];
	var deferred = $.Deferred();
	var enrichedRoute = [];
	var selectedPois = getSelectedRoutingElements();
	getOrientationPoints(route, selectedPois, intersections).done(function(){
		$.each(route, function(index, coordinate){
			if(index <= (route.length-2)){
				var nextCoordinate = route[index + 1];
				var degreesToNext = calcBearing(coordinate.lat, coordinate.lon,	nextCoordinate.lat, nextCoordinate.lon);
				var sideBuffers = calculateSideBuffers(coordinate.lat, coordinate.lon, nextCoordinate.lat, nextCoordinate.lon, degreesToNext);
				
				var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], orientationContent, coordinate.lat,coordinate.lon, coordinate.distance);
				poisInLeftStreetSegment.sort(distanceSort);
				
				var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], orientationContent,  coordinate.lat,coordinate.lon, coordinate.distance);
				poisInRightStreetSegment.sort(distanceSort);
				
				if(typeof coordinate.way != "undefined") {
					enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, coordinate.lat,coordinate.lon,coordinate.way.tags, poisInLeftStreetSegment, poisInRightStreetSegment,coordinate.way));
				}else{
					enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, coordinate.lat,coordinate.lon, "", poisInLeftStreetSegment, poisInRightStreetSegment,""));
				}
			}
			else if(index === (route.length-1)){
				enrichedRoute.push(new finalElement(coordinate.distance, coordinate.direction, "", "", "",""));
				deferred.resolve(enrichedRoute);
			}
		});
	});
	return deferred;
}

function enrichStreetWay(locatedWay, intersections, warnings, locLat, locLon){
	lat = locLat;
	lon = locLon;
	var deferred = $.Deferred();
	var route = [];
	//get all street nodes as route
	$.each(locatedWay.way.nodes, function(index, node){
		if(index<locatedWay.way.nodes.length-1){
			var nextNode = locatedWay.way.nodes[index+1];
			var dist = calcDistance(node.x,  node.y, nextNode.x, nextNode.y);
			route.push(new tempEntry("", dist, node.x, node.y, "", locatedWay.way));
		}else{
			route.push(new tempEntry("", "", node.x, node.y, "",locatedWay.way));
		}
	})
	//get Date to test, if roadworks are actual
	today = new Date();
	var day = today.getDate();
	var month = today.getMonth()+1; //January is 0!
	today = today.getFullYear() + (month<10 ? '0' : '') + month + (day<10 ? '0' : '') + day;
	
	var enrichedRoute = [];
	roadworks = [];
	var selectedPois = getSelectedRoutingElements();
	if(selectedPois.length>0){
		getOrientationPoints(route, selectedPois, intersections).done(function(){
			var poisOnLeftSide = [];
			var poisOnRightSide = [];
			//add intersections if selected
			var bothSides = fillPoisInBothSides(selectedPois, intersections, "intersections");
			poisOnLeftSide = bothSides.concat(poisOnLeftSide);
			poisOnRightSide = bothSides.concat(poisOnRightSide);
	
			//add warnings
			bothSides = fillPoisInBothSides(selectedPois, warnings, "warnings");
			poisOnLeftSide = bothSides.concat(poisOnLeftSide);
			poisOnRightSide = bothSides.concat(poisOnRightSide);
	
			//add roadworks
			bothSides = fillPoisInBothSides(selectedPois, roadworks, "roadworks");
			poisOnLeftSide = bothSides.concat(poisOnLeftSide);
			poisOnRightSide = bothSides.concat(poisOnRightSide);
			
			//add other orientation points
			var routeDistances = getNodeDistances(locatedWay);
			var twoSides = getOrientationPointsInBuffers(routeDistances,locatedWay);
			poisOnLeftSide = twoSides[0].concat(poisOnLeftSide);
			poisOnRightSide = twoSides[1].concat(poisOnRightSide);
			
			//sort by distance
			poisOnLeftSide.sort(distanceSort);
			poisOnRightSide.sort(distanceSort);
			
			//delete doubles
			poisOnLeftSide = deleteDoubles(poisOnLeftSide)
			poisOnRightSide = deleteDoubles(poisOnRightSide);
			
			enrichedRoute.push(new finalElement("", "", locLat, locLon, locatedWay.way.tags, poisOnLeftSide, poisOnRightSide));
			
			deferred.resolve(enrichedRoute);
		});
	}else{
		deferred.resolve(enrichedRoute)
	}
	return deferred;
}

function getOrientationPointsInBuffers(routeDistances,locatedWay){
	var poisOnLeftSide = [];
	var poisOnRightSide = [];
	$.each(locatedWay.way.nodes, function(i, node){
		var distToLoc = routeDistances[i];
		//check if dist < 300 meter and not last node			
		if(distToLoc<OPDistance && i<(locatedWay.way.nodes.length-1)){
			var nextNode = locatedWay.way.nodes[i+1];
			var distToNext = calcDistance(node.x, node.y, nextNode.x, nextNode.y);
			var degreesToNext = calcBearing(node.x, node.y, nextNode.x, nextNode.y);
			var sideBuffers = calculateSideBuffers(node.x, node.y, nextNode.x, nextNode.y, degreesToNext);
			
			var poisInLeftStreetSegment = getPointsInBuffer(sideBuffers[0], orientationContent, lat, lon, OPDistance);
			poisOnLeftSide = poisOnLeftSide.concat(poisInLeftStreetSegment);
			
			var poisInRightStreetSegment = getPointsInBuffer(sideBuffers[1], orientationContent,  lat, lon, OPDistance);
			poisOnRightSide = poisOnRightSide.concat(poisInRightStreetSegment);
		}
	});
	var sides = [ poisOnLeftSide, poisOnRightSide ];
	return sides;
}

function fillPoisInBothSides(selPois, poiList, keyword){
	var poisOnBothSides = [];
	if($.inArray(keyword, selPois)!==-1){
		$.each(poiList, function(index, poi){
			var dist = calcDistance(lat, lon, poi.lat, poi.lon);
			poisOnBothSides.push(new orientationEntry(poi.lat, poi.lon, poi.keyword, poi.tags, dist));
		});
	}
	return poisOnBothSides;
}
function getNodeDistances(locatedWay){
	var distances = [];
	var distance = 0;
	var nodes = locatedWay.way.nodes;
	$.each( nodes, function(index, node){
		if(node.x===locatedWay.startlat && node.y===locatedWay.startlon){
			distance = calcDistance(node.x, node.y, locatedWay.matchedLat, locatedWay.matchedLon);
			distances.push(distance);
			for(var i=index; i>0; i--){
				distance += calcDistance(nodes[i].x, nodes[i].y, nodes[i-1].x, nodes[i-1].y);
				distances.push(distance);
			}
			distances.reverse();
			var distance = 0;
		}
		else if(node.x===locatedWay.endLat && node.y===locatedWay.endLon){
			distance = calcDistance(node.x, node.y, locatedWay.matchedLat, locatedWay.matchedLon);
			distances.push(distance);
			for(var i=index; i<locatedWay.way.nodes.length-1; i++){
				distance += calcDistance(nodes[i].x, nodes[i].y, nodes[i+1].x, nodes[i+1].y);
				distances.push(distance);
			}
		}
	});
	return distances;
}

function deleteDoubles(poiList){
	var cleanedList = [];
	if(poiList.length!=0){
		for(var index=0; index <poiList.length-1; index++){
			var nextPoi = poiList[index+1];
			if((poiList[index].lat!==nextPoi.lat) && (poiList[index]!==nextPoi.lon)){
				cleanedList.push(poiList[index]);
			}
		}
		cleanedList.push(poiList[poiList.length-1]);
	}
	return cleanedList;
}

function getOrientationPoints(route,selectedPoints, intersections){
	var deferred = $.Deferred();
	var counter = selectedPoints.length;
	var bbox = getMinMaxForRoute(route);

	isInZurich(route).done(function(bool){
		//for each selected point find the matching pois
		$.each(selectedPoints, function(i, keyword) {
			//if searching for trees
			if((keyword == "natural=tree") &&( bool) ){
				findTreeStreet(bbox).done(function(data){
					counter--;
					$.each(data, function(k, tree){
						orientationContent.push(new orientationEntry(tree.lat, tree.lon, keyword, tree.tags));
					});
					if(counter === 0){
						deferred.resolve();
					}
				});
			}
			else if(keyword == "roadworks"){
				getRoadworks(route).done(function(){
					counter--;
					if(counter === 0){
						deferred.resolve();
					}
				});
			}
			else{		
				getPoisForKeyWord(bbox, keyword).done(function(){
					counter--;
					if(counter === 0){
						deferred.resolve();
					}
				});
			}
		});
	});
	return deferred;
}

function getRoadworks(route){
	var deferred = $.Deferred();
	var counter = route.length;
	$.each(route, function(index, coord){
		if(coord.way !== "" && typeof coord.way !== "undefined" && typeof coord.way.wayId !== "undefined"){
			$.ajax({
				url: "proxy.php?url="
					+ encodeURIComponent('http://trobdb.hsr.ch/getTrafficObstruction?osmid='+coord.way.wayId),
				type : 'GET',
				dataType : 'json',
				error : function(data) {
					console.error("error");
					deferred.resolve();
				},
				success : function(data) {
					data = data.features;
					$.each(data, function(index, roadwork){
						var startDate = roadwork.properties.traffic_obstruction_start.split(" ")[0];
						var tempString = startDate.split("-");
						startDate = tempString[0]+tempString[1]+tempString[2];
						var endDate = roadwork.properties.traffic_obstruction_end.split(" ")[0];
						var tempString = endDate.split("-");
						endDate = tempString[0]+tempString[1]+tempString[2];
						
						//test if roadwork is in process
						if(startDate<today && endDate>today){
							var nearestNode = findNearestRoadworkNode(coord, roadwork.geometry.coordinates);
							var entry = new orientationEntry(nearestNode[1], nearestNode[0], "roadwork", roadwork.properties);
							if(roadworks.length===0){
								roadworks.push(entry);
							}
							//don't push duplicates
							$.each(roadworks, function(i, rw){
								if(!(entry.lat === rw.lat)&&!(entry.lon === rw.lon)){
									roadworks.push(entry);
								}
							});
						}
					});
					counter--;
					if(counter === 0){
						deferred.resolve();
					}
				},
			});
		}else{
			counter--;
			if(counter === 0){
				deferred.resolve();				
			}
		}
	});
	return deferred;
}

function findNearestRoadworkNode(coord, polyPoints){
	var distance;
	var  minPoint = polyPoints[0];
	var min = calcDistance(coord.lat, coord.lon, polyPoints[0].lat, polyPoints[0].lon);
	$.each(polyPoints, function(index, point){
		distance = calcDistance(coord.lat, coord.lon, point.lat, point.lon);
		if(distance<min){
			min = distance;
			minPoint = point;
		}
	});
	return minPoint;
}

var bigdummy = new Object();
function isInZurich(route){
	var zuricharray = new Array();
	var multipolyCoords = [];
	var d = $.Deferred();
	$.ajax({
		url : "data/export.json",
		dataType: "json",
		success : function(data) {
			bigdummy = data;
			//Get Zurich City Polygon
			for (var i = 0; i < data.features[0].geometry.coordinates.length; i++) {
				var polyCoords = [];
				for (var a = 0; a < data.features[0].geometry.coordinates[i].length; a++) {
					for (var k = 0; k < data.features[0].geometry.coordinates[i][0].length; k++) {
						polyCoords.push(new coordPair(data.features[0].geometry.coordinates[i][0][k][1], data.features[i].geometry.coordinates[a][0][k][0]));
					}
				}
				multipolyCoords.push(polyCoords);
			}
			//check for each segment if it is in zurich
			$.each(route, function(index, coordinate){
				zuricharray.push(isPip(coordinate.lat, coordinate.lon, multipolyCoords));
				if(zuricharray.length === route.length){
					d.resolve(isPip(coordinate.lat, coordinate.lon, multipolyCoords));
				}
			});
		}
	});
	return d;
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
function orientationEntry(lat,lon,keyword, tags, distance){
	this.lat = lat;
	this.lon = lon;
	this.keyword = keyword;
	this.tags = tags;
	this.distance = distance;
}