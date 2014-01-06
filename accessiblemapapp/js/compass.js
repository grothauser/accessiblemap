//TODO: nicht jedesmal einen listener hinzufügen
function checkCompass() {
	console.log("reading compass");
	var deferred = $.Deferred();
	var isFirefox = typeof InstallTrigger !== 'undefined';
	if (!isFirefox) {
		if (window.DeviceOrientationEvent) {
			
			// window.setInterval(function(){
			window.addEventListener('deviceorientation', function(event) {
				console.log(event);
				// iOs
				if (event.webkitCompassHeading) {
					deferred.resolve(event.webkitCompassHeading);
				}
				// non iOS is the other way round
				else {
					console.log("3");
					if (!window.chrome) {
						if (event.alpha == null) {
							deferred.resolve(0);
						} else {
							deferred.resolve(event.alpha - 270);
						}

					} else {
						if (event.alpha == null) {
							deferred.resolve(0);
						} else {
							deferred.resolve(event.alpha);
						}
					}
				}

			}, false);
			// }
			// ,
			// 3600); //intervall in ms
		} else {
			deferred.resolve(0);
		}

	} else {
		console.log("firefox");
		deferred.resolve(0);
	}
	return deferred;
}

// <DOCTYPE html>
// <html>
// <head>
// <script>
// function init() {
// var dataContainerOrientation =
// document.getElementById('dataContainerOrientation');
// var dataContainerMotion = document.getElementById('dataContainerMotion');
// if(window.DeviceOrientationEvent) {
// window.addEventListener('deviceorientation', function(event) {
// var alpha = event.alpha;
// var beta = event.beta;
// var gamma = event.gamma;
//               
// if(alpha!=null || beta!=null || gamma!=null)
// dataContainerOrientation.innerHTML = '<strong>Orientation</strong><br
// />alpha: ' + alpha + '<br/>beta: ' + beta + '<br />gamma: ' + gamma;
// }, false);
// }

/*
 * input: degrees between 0 and 360 output: direction as clock number
 */
function getClock(degrees) {
	var clockNumber = 0;
	if (degrees >= 0 && degrees < 15) {
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
