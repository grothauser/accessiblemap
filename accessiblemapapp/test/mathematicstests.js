module('Mathematics');
test("squareDistance(v, w) returns square distance from v to w", function () {
	var pointA = new point(1,1);
	var pointB = new point(3,3);
	var pointC = new point(-2,-2);
	equal(squareDistance(pointA, pointB), 8);
	equal(squareDistance(pointA, pointC), 18);
});

test("distanceToSegmentSquared(p, v, w) returns square distance from v to w", function () {
	var pointA = new point(1,1);
	var pointB = new point(3,3);
	var pointC = new point(2,5);
	equal(distanceToSegmentSquared(pointC, pointA, pointB), 5);
});

test("distToSegment(p, v, w) returns distance from line v w to point p", function () {
	var pointA = new point(1,1);
	var pointB = new point(3,3);
	var pointC = new point(2,5);
	equal(distToSegment(pointC, pointA, pointB), Math.sqrt(5));
});

test("deg2rad(a) turns degrees to radian", function () {
	equal(deg2rad(0), 0);
	equal(deg2rad(58), 1.01229096615671111);
	equal(deg2rad(-58), -1.01229096615671111);
	equal(deg2rad(193), 3.368485456349055935);
});

test("rad2deg(a) turns degrees to radian", function () {
	equal(rad2deg(0), 0);
	equal(Math.round(rad2deg(1.01229096615671111)), 58);
	equal(Math.round(rad2deg(-1.01229096615671111)), -58);
	equal(Math.round(rad2deg(3.368485456349055935)), 193);
});
test("normalizeBearing(degrees) returns degrees between 0 and 360",function(){
	equal(normaliseBearing(180), 180);
	equal(normaliseBearing(375), 15);
	equal(normaliseBearing(-20), 340);
	equal(normaliseBearing(360), 0);
});
test("calcBearing(lat1, lon1, lat2, lon2) returns bearing from point 1 to point2", function(){
	equal(calcBearing(0,0,2,0),0);
	equal(Math.round(calcBearing(1,1,3,3)),45);
	equal(Math.round(calcBearing(3, 3, 1, 1)), -135);
	equal(Math.round(calcBearing(1,1,-3,-3)), -135);
});
test("getAzimuth(degreesToNext,degreesToOverNext) returns ", function(){
	equal(getAzimuth(20, 200), 180);
	equal(getAzimuth(200, 10), 170);
});
test("calcCompassBearing(destlat, destlon, startlat, startlon, compassHeading) returns bearing relative to device compass", function(){
	equal(Math.round(calcCompassBearing(3, 3, 0, 0,  0)), 45);
	equal(normaliseBearing(Math.round(calcCompassBearing(3, 3, 0, 0,  45))), 0);
	equal(Math.round(calcCompassBearing(3, 3, 0, 0, 90)), 315);
	equal(Math.round(calcCompassBearing(0, 0, 3, 3, 0)), 225);
});
test("calculateCoordinatesForBuffer(lat, lon, bearing) returns coordinates for buffer", function(){
	equal(Math.round(calculateCoordinatesForBuffer(47.22391, 8.8159, 0).lat*100000)/100000, 47.22395);
	equal(Math.round(calculateCoordinatesForBuffer(47.22391, 8.8159, 0).lon*100000)/100000, 8.8159);
	equal(Math.round(calculateCoordinatesForBuffer(47.22391, 8.8159, 90).lat*100000)/100000, 47.22391);
	equal(Math.round(calculateCoordinatesForBuffer(47.22391, 8.8159, 90).lon*100000)/100000, 8.81595);
});
test("getMinMaxForRoute(route) returns bounding box with minimum lat/lon and maximum lat/lon as corners", function(){
	var earthRadius = 6378137;
	var route = [new coordPair(1,5),new coordPair(2,4),new coordPair(1,3),new coordPair(0,2),new coordPair(-2,3),new coordPair(-1,6),new coordPair(1,4)];
	var minLon = 2+(180/Math.PI)*(10/earthRadius)/Math.cos(-2);
	var minLat = -2-Math.abs((180/Math.PI)*(10/earthRadius));
	var maxLon = 6-(180/Math.PI)*(10/earthRadius)/Math.cos(2);
	var maxLat = 2+Math.abs((180/Math.PI)*(10/earthRadius));
	var expBox = new Array(minLon,minLat, maxLon, maxLat);
	deepEqual(getMinMaxForRoute(route), expBox);
});
test("getBbox(lat, lon, radius) returns bounding box with corner distance of radius", function(){
	equal(Math.round(getBbox(47.22391, 8.8159, 500)[0]*100000)/100000, 8.8114);
	equal(Math.round(getBbox(47.22391, 8.8159, 500)[1]*100000)/100000, 47.22085);
	equal(Math.round(getBbox(47.22391, 8.8159, 500)[2]*100000)/100000, 8.8204);
	equal(Math.round(getBbox(47.22391, 8.8159, 500)[3]*100000)/100000, 47.22697);
});
test("isLeft(alat, alon, blat, blon, clat, clon) returns true, if point(c) is left of line (a to b)", function(){
	equal(isLeft(1,1,3,3,1,3), false);
	equal(isLeft(1,1,3,3,3,1), true);
	equal(isLeft(3,3,1,1,3,1), false);
	equal(isLeft(3,3,1,1,2,2), false);
});
test("calcDistance(lat1, lon1, lat2, lon2) returns distance between two points", function(){
	equal(Math.round(calcDistance(47.22074, 8.81123, 47.22391, 8.8159)*1000),499);
});
