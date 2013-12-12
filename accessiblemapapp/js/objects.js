function distSegmentEntry(startlat,startlon,endLat,endLon,matchedLat,matchedLon,dist,wayId,way){
	this.startlat = startlat;
	this.startlon = startlon;
	this.endLat = endLat;
	this.endLon = endLon;
	this.matchedLat = matchedLat;
	this.matchedLon = matchedLon;
	this.distance = dist;
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

function wayOfRoute(wayId, nodes,tags) {
	this.wayId = wayId;
	this.nodes = nodes;
	this.tags = tags;
}
function way( wayId, tags, node, lat, lon){
	this.wayId = wayId;
	this.tags = tags;
	this.node = node;
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
function coordPair(lat, lon,id) {
	this.lat = lat;
	this.lon = lon;
	this.id = id;
}

function finalElement(distance,direction,lat,lon,tags,opsLeft, opsRight,way){
	this.distance = distance;
	this.direction = direction;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags;
	this.opsLeft = opsLeft;
	this.opsRight = opsRight;
	this.way = way;
}

function intersection(lat, lon, ways, keyword, wayIds) {
	this.lat = lat;
	this.lon = lon;
	//names
	this.tags = ways;
	this.keyword = keyword;
	this.wayIds = wayIds;
}
function roadworkEntry(lat, lon, wayId, tags){
	this.lat = lat;
	this.lon = lon;
	this.keyword = "roadwork";
	this.wayId = wayId;
	this.tags = tags;
}