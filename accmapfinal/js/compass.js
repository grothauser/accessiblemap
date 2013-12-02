
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
	var deg;
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
	} else if (degrees >= 345 && degrees < 360) {
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

function frac(a) {
	return (a - Math.floor(a));
}
function calcAll(X1, Y1, X2, Y2, compassHeading) {
	var azimCompassHeading = 0;
	var dx = X1 - X2;
	var dy = Y1 - Y2;
	var azi = 0;
	var PI = Math.PI;
	if (dx == 0) {
		if (dy > 0) {
			azi = 0;
		} else if (dy < 0) {
			azi = 2 * PI;
		} else if (dy == 0) {
			console.log("Fehler: Start- und Endpunkt identisch");
		}
	} else if (dy == 0) {
		if (dx > 0) {
			azi = PI / 2;
		}
		if (dx < 0) {
			azi = 3 / (2 * PI);
		}
	} else {
		azi = Math.atan(Math.abs(dx / dy));
		if (dx > 0) {
			if (dy < 0) {
				azi = PI - azi;
			}
		} else if (dx < 0) {
			if (dy > 0) {
				azi = 2 * PI - azi;
			} else if (dy < 0) {
				azi = azi + PI;
			}
		}
	}
	// azimuth in degrees
	azi = azi * (180 / PI);
	// if compassHeading greater than target-azimuth
	if (compassHeading > azi) {
		var temp = azi - compassHeading;
		azimCompassHeading = 360 + temp;
		// if compassHeading is exactly north
	} else if (compassHeading == 0) {
		azimCompassHeading = azi;
	}
	// if compassHeading smaller than target-azimuth
	else {
		azimCompassHeading = azi - compassHeading;
	}
	return azimCompassHeading;
}