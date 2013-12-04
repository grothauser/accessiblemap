
function checkCompass(){
	var deferred = $.Deferred();
	var alpha;
	if(window.DeviceOrientationEvent) { 
		window.setInterval(function(){
		window.addEventListener('deviceorientation', function(event) {
			//iOs
			 if(event.webkitCompassHeading) {
                 alpha = event.webkitCompassHeading;
                 deferred.resolve(event.webkitCompassHeading);
               }
               //non iOS
               else {
            	  webkitAlpha = event.alpha;
                  alpha = webkitAlpha;
                  deferred.resolve(webkitAlpha);
               
                 if(!window.chrome) {
                   alpha = webkitAlpha-270;
                   deferred.resolve( webkitAlpha-270);
                 }
               }
			
			}, false);
		}
		,
		360);	
	}
	return deferred;
}
function getHeading(alpha, beta) {
	var azimuth = beta - alpha;
	if (azimuth < 0)
		return (360 + azimuth);
	else
		return azimuth;
}

function transformBearing(bearing) {
	if (bearing < 0)
		return 360 + bearing;
	if (bearing > 360)
		return bearing - 360;
	return bearing;
}

function getClock(degrees) {
	
	var clockNumber = 0;
	if (degrees < 0) {
		console.log("error");
	} else if (degrees >= 0 && degrees < 15) {
		clockNumber = 12;
	} else if (degrees >= 15 && degrees < 45) {
		clockNumber = 1;
	} else if (degrees >= 45 && degrees < 75) {
		clockNumber = 2;
	} else if (degrees >= 75 && degrees < 105) {
		clockNumber = 3;
	} else if (degrees >= 105 && degrees < 135) {
		clockNumber = 4;
	} else if (degrees >= 135 && degrees < 165) {
		clockNumber = 5;
	} else if (degrees >= 165 && degrees < 195) {
		clockNumber = 6;
	} else if (degrees >= 195 && degrees < 225) {
		clockNumber = 7;
	} else if (degrees >= 225 && degrees < 255) {
		clockNumber = 8;
	} else if (degrees >= 255 && degrees < 285) {
		clockNumber = 9;
	} else if (degrees >= 285 && degrees < 315) {
		clockNumber = 10;
	} else if (degrees >= 315 && degrees < 345) {
		clockNumber = 11;
	} else if (degrees >= 345 && degrees <= 360) {
		clockNumber = 12;
	}
	return clockNumber;
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
function frac(a) {
	return (a - Math.floor(a));
}
function calcBearing(lat1, lon1, lat2, lon2) {
	// source : http://www.movable-type.co.uk/scripts/latlong.html
	var lat1 = deg2rad(lat1);
	var lat2 = deg2rad(lat2);
	var dLat = deg2rad(lat2 - lat1);
	var dLon = deg2rad(lon2 - lon1);
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)
			* Math.cos(dLon);
	var brng = rad2deg(Math.atan2(y, x));
	return brng;
}
function calcCompassBearing(lat1, lon1, lat2, lon2, compassHeading) {
	var destinationBearing = normaliseBearing(calcBearing(lat2,lon2,lat1,lon1));
	if(destinationBearing > compassHeading){
		return destinationBearing - compassHeading;
	}else if(compassHeading > destinationBearing){
		return 360 - (compassHeading - destinationBearing);
	}else{
		return destinationBearing;
	}
	
}