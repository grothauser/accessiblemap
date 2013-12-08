module('Mathematics');
test("dist2(v, w) returns square distance from v to w", function () {
	var pointA = new point(1,1);
	var pointB = new point(3,3);
	var pointC = new point(-2,-2);
	equal(dist2(pointA, pointB), 8);
	equal(dist2(pointA, pointC), 18);
});

test("distToSegmentSquared(p, v, w) returns square distance from v to w", function () {
	var pointA = new point(1,1);
	var pointB = new point(3,3);
	var pointC = new point(2,5);
	equal(distToSegmentSquared(pointC, pointA, pointB), 5);
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

test("deg2rad(a) turns degrees to radian", function () {
	equal(rad2deg(0), 0);
	close(rad2deg(1.01229096615671111), 58, 0.0001);
	close(rad2deg(-1.01229096615671111), -58, 0.0001);
	close(rad2deg(3.368485456349055935), 193, 0.0001);
});
test("normalizeBearing(degrees) returns degrees between 0 and 360",function(){
	equal(normaliseBearing(180), 180);
	equal(normaliseBearing(375), 15);
	equal(normaliseBearing(-20), 340);
});
test("frac(a) returns decimal places of a", function () {
	close(frac(3.1416), 0.1416, 0.0001);
	equal(frac(0.25), 0.25);
	equal(frac(67), 0);
	close(frac(-5.238), -0.238);
});
test("calcBearing(lat1, lon1, lat2, lon2) returns bearing from point 1 to point2", function(){
	equal(calcBearing(0,0,2,0),0, 0.1);
	close(calcBearing(1,1,3,3),45, 0.1);
	close(calcBearing(3, 3, 1, 1), -135, 0.1);
	close(calcBearing(1,1,-3,-3), -135, 0.1);
});
test("getAzimuth(degreesToNext,degreesToOverNext) returns ", function(){
	equal(getAzimuth(20, 200), 180);
	equal(getAzimuth(200, 10), 170);
});