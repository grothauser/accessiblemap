function distSegmentEntry(startlat,startlon,endLat,endLon,matchedLat,matchedLon,dist,wayId,way){
	this.startlat = startlat;
	this.startlon = startlon;
	this.endLat = endLat;
	this.endLon = endLon;
	this.matchedLat = matchedLat;
	this.matchedLon = matchedLon;
	this.dist = dist;
	this.wayId = wayId;
	this.way = way;
}
function wayVector(wayId, nodes, tags){
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
}
//used for calculation with coordinates
function point(x,y){
	this.x = x;
	this.y = y;
}
function tempEntry(direction, distance,  lat, lon, bearingtoNext, way) {
	this.direction = direction;
	this.distance = distance;
	this.lat = lat;
	this.lon = lon;
	this.bearingtoNext = bearingtoNext;
	this.way = way;
}
function orientationEntry(lat,lon,keyword, tags, distance){
	this.lat = lat;
	this.lon = lon;
	this.keyword = keyword;
	this.tags = tags;
	this.distance = distance;
}

function coordWayMatch(index,wayId, lat, lon,nodeId,tags) {
	this.index = index;
	this.wayId = wayId;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags; 
}

function wayOfRoute(wayId, nodes,tags) {
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
}
function way(name, wayId, nodes, tags, lat, lon){
	this.name = name;
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
	this.lat = lat;
	this.lon = lon;
}
function streetViewEntry(id,lat,lon,name, clock, distance, tags){
	this.id = id;
	this.lat = lat;
	this.lon = lon;
	this.name = name;
	this.clock = clock;
	this.distance = distance;
	this.tags = tags;
}
//coordinate of the route
function coordPair(lat, lon) {
	this.lat = lat;
	this.lon = lon;
}