var streetWidth = 0.008;

function squareDistance(s, e) { 
    return Math.pow((s.x - e.x),2) + Math.pow((s.y - e.y),2); 
}
function distanceToSegmentSquared(p, s, e) {
	var squareDist = squareDistance(s, e);
	if (squareDist == 0) return squareDistance(p, s);
	var t = ((p.x - s.x) * (e.x - s.x) + (p.y - s.y) * (e.y - s.y)) / squareDist;
	if (t < 0) return squareDistance(p, s);
	if (t > 1) return squareDistance(p, e);
	return squareDistance(p, { x: s.x + t * (e.x - s.x),
                	  y: s.y + t * (e.y - s.y) });
}

//input: point p, point s and point e  where s and e are start and end of segment 
//output: distance between segment and point p
function distToSegment(p, s, e) { 
    return Math.sqrt(distanceToSegmentSquared(p, s, e)); 
}

function deg2rad(a) {
	return a * 0.017453292519943295;
}
function rad2deg(a) {
	return a *( 180 / Math.PI);
}

function normaliseBearing(degrees){
	return (degrees + 360)%360;
}
function calcBearing(lat1, lon1, lat2, lon2) {
	// source : http://www.movable-type.co.uk/scripts/latlong.html
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);
	var dLon = deg2rad(lon2 - lon1);
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)
			* Math.cos(dLon);
	var brng = rad2deg(Math.atan2(y, x));
	return brng;
}

function getAzimuth(degreesToNext,degreesToOverNext){
	var azimuth = degreesToOverNext - degreesToNext;
	return normaliseBearing(azimuth);
}
	
//output: bearing in degrees to a point. input: compassheading and two points
function calcCompassBearing(destlat, destlon, startlat, startlon, compassHeading) {
	var destinationBearing = normaliseBearing(calcBearing(startlat,startlon,destlat,destlon));
	if(destinationBearing > compassHeading){
		return normaliseBearing(destinationBearing - compassHeading);
	}else if(compassHeading > destinationBearing){
		return normaliseBearing(360 - (compassHeading - destinationBearing));
	}else{
		return normaliseBearing(destinationBearing);
	}
}

//calculates the buffer between two nodes
function calculateBuffer(lat, lon, nextlat, nextlon, width) {
	var linestring = [];
	linestring.push([ lat, lon ], [ nextlat, nextlon ]);
	var geoInput = {
		type : "LineString",
		coordinates : linestring
	};

	var reader = new jsts.io.GeoJSONReader();
	var writer = new jsts.io.GeoJSONWriter();
	var geometry = reader.read(geoInput).buffer(width / 111.12);
	return writer.write(geometry);
}

//calculates buffers for both sides of a way 
function calculateSideBuffers(lat, lon, nextlat, nextlon, wayBearing) {
	var leftStartCoords = calculateCoordinatesForBuffer(lat, lon, (wayBearing - 90));
	var leftEndCoords = calculateCoordinatesForBuffer(nextlat, nextlon,
			(wayBearing - 90));
	var rightStartCoords = calculateCoordinatesForBuffer(lat, lon, (wayBearing + 90));
	var rightEndCoords = calculateCoordinatesForBuffer(nextlat, nextlon,
			(wayBearing + 90));

	var leftBuffer = calculateBuffer(leftStartCoords.lat, leftStartCoords.lon,
			leftEndCoords.lat, leftEndCoords.lon, (streetWidth / 2));
	var rightBuffer = calculateBuffer(rightStartCoords.lat,
			rightStartCoords.lon, rightEndCoords.lat, rightEndCoords.lon,
			(streetWidth / 2));
	var buffers = [ leftBuffer, rightBuffer ];
	return buffers;
}

function calculateCoordinatesForBuffer(lat, lon, bearing) {
	bearing = normaliseBearing(bearing);
	var rlon;
	var dif = streetWidth / 2 / 6371.01;
	var rlat1 = deg2rad(lat);
	var rlon1 = deg2rad(lon);
	var rbearing = deg2rad(bearing);
	var rlat = Math.asin(Math.sin(rlat1) * Math.cos(dif) + Math.cos(rlat1)* Math.sin(dif) * Math.cos(rbearing));
	
	if (Math.cos(rlat) == 0 || Math.abs(Math.cos(rlat)) < 0.000001)
		rlon = rlon1;
	else {
		rlon = ((rlon1- Math.asin(Math.sin(-rbearing) * Math.sin(dif)/ Math.cos(rlat)) + Math.PI) % (2 * Math.PI))- Math.PI;
	}
	return new coordPair(rad2deg(rlat), rad2deg(rlon));
}

//check if a coordinate is in range of a multipolygon
function isPip(lat, lon, multipolyCoords){
	var isInPolygon = false;
	for(var k=0; k<multipolyCoords.length; k++){
		var nvert = multipolyCoords[k].length;
		var vertx = []; var verty = [];
		for(var i=0; i<nvert; i++){
			vertx.push(multipolyCoords[k][i].x);
			verty.push(multipolyCoords[k][i].y);
		}
		var i, j;
		for (i=0, j=nvert-1; i<nvert; j=i++) {
			if (((verty[i]>lon) != (verty[j]>lon))&&(lat<(vertx[j]-vertx[i]) * (lon-verty[i]) / (verty[j]-verty[i]) + parseFloat(vertx[i]))){
				isInPolygon = !isInPolygon;
			}
		}
	}
	return isInPolygon;
}
/*calculates the minimum and maximum coordinate of a route
 *used to find orientation points along the route */
function getMinMaxForRoute(route){
	var earthRadius = 6378137;
	var bufferLength = 10;
	var bbox = [];
	var minLon = route[0].lon;
	var minLat = route[0].lat;
	var maxLon = route[0].lon;
	var maxLat = route[0].lat;
	for(var i=0; i<route.length; i++){
		if(route[i].lat < minLat){
			minLat = route[i].lat;
		}
		if(route[i].lat > maxLat){
			maxLat = route[i].lat;
		}
		if(route[i].lon < minLon){
			minLon =route[i].lon;
		}
		if(route[i].lon > maxLon){
			maxLon = route[i].lon;
		}
	}
	minLon = parseFloat(minLon + (180/Math.PI)*(bufferLength/earthRadius)/Math.cos(minLat));
	minLat = parseFloat(minLat - Math.abs((180/Math.PI)*(bufferLength/earthRadius)));
	maxLon = parseFloat(maxLon - (180/Math.PI)*(bufferLength/earthRadius)/Math.cos(maxLat));
	maxLat = parseFloat(maxLat + Math.abs((180/Math.PI)*(bufferLength/earthRadius)));
	bbox.push(minLon);
	bbox.push(minLat);
	bbox.push(maxLon);
	bbox.push(maxLat);
	return bbox;
}
/* input: buffer to check, list of orientationpoints, coordinate of startpoint of routesection, length of routesection
 * output: all orientationpoints that are contained in the buffer of this routesection */
function getPointsInBuffer(buffer, selPoi, lat,lon, distance) {
	var nvert = buffer.coordinates[0].length;
	var vertx = [];
	var verty = [];
	for ( var i = 0; i < nvert; i++) {
		vertx.push(buffer.coordinates[0][i][0]);
		verty.push(buffer.coordinates[0][i][1]);
	}
	var testx, testy;
	var poisInStreetBuffer = [];
	for ( var k = 0; k < selPoi.length; k++) {
		testx = selPoi[k].lat;
		testy = selPoi[k].lon;
		var i, j, isInBuffer = false;
		for (i = 0, j = nvert - 1; i < nvert; j = i++) {
			if (((verty[i] > testy) != (verty[j] > testy))
					&& (testx < (vertx[j] - vertx[i]) * (testy - verty[i])
							/ (verty[j] - verty[i]) + vertx[i])) {
				isInBuffer = !isInBuffer;
			}
		}
		if (isInBuffer === true) {
			var distToPoi = calcDistance(lat,lon,selPoi[k].lat,selPoi[k].lon);
			if(distToPoi*1000 <= (distance) ){
				poisInStreetBuffer.push(new orientationEntry(selPoi[k].lat, selPoi[k].lon,selPoi[k].keyword,selPoi[k].tags,distToPoi));
			}
		}
	}
	return poisInStreetBuffer;
}

//caluclates the bounding box for a coordinate with a certain radius
//input: radius in meter
function getBbox(lat, lon, radius) {
	var radius = radius/1000;

	var degreesOfRadius = (radius / 111.111);
	
	var degreesOfLatY = degreesOfRadius * Math.cos(((lat * Math.PI)/180));
	
	//longitudes 
	var bbox = [];
	bbox.push(parseFloat(lon - degreesOfRadius));
	bbox.push(parseFloat(lat - degreesOfLatY));
	bbox.push(parseFloat(lon + degreesOfRadius));
	bbox.push(parseFloat(lat + degreesOfLatY));
	return bbox;
}

function isLeft(alat, alon, blat, blon, clat, clon){
	var val = ((blon - alon)*(clat - alat)-(blat - alat)*(clon - alon));
	return val > 0;
}
//calculates the distance in km between two coordinates
function calcDistance(lat1, lon1, lat2, lon2) {
	var R = 6371; 
	var dLat = deg2rad(lat2-lat1);
	var dLon = deg2rad(lon2-lon1);
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d;
}

function distanceSort(a,b){
	if (a.distance < b.distance)
		return -1;
	if (a.distance > b.distance)
		return 1;
	return 0;
}
