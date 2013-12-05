function checkCompass() {
	var deferred = $.Deferred();
	var alpha;
	if (window.DeviceOrientationEvent) {
		window.setInterval(function() {
			window.addEventListener('deviceorientation', function(event) {
				// iOs
				if (event.webkitCompassHeading) {
					deferred.resolve(event.webkitCompassHeading);
				}
				// non iOS
				else {
					deferred.resolve(event.alpha);
					if (!window.chrome) {
						deferred.resolve(event.alpha - 270);
					}
				}
			}, false);
		}, 360);
	}
	return deferred;
}