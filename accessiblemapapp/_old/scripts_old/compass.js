function checkCompass(){
	if(window.DeviceOrientationEvent) { 
		document.getElementById('compassAvalibale').innerHTML = 'Kompass aktiviert';
		window.setInterval(function(){
		window.addEventListener('deviceorientation', function(event) {
			//iOs
			 if(event.webkitCompassHeading) {
                 alpha = event.webkitCompassHeading;
               }
               //non iOS
               else {
            	  webkitAlpha = event.alpha;
                  alpha = webkitAlpha;
                 if(!window.chrome) {
                   alpha = webkitAlpha-270;
                 }
               }
			 var alpha = event.alpha;
		//	  document.getElementById('compassHeading').innerHTML = alpha;
			  showAlpha(alpha);
			}, false);
		}
		,
		360);	
	}	
	else{
		output.appendChild(document.createTextNode("compass läuft nicht"));
	}
}
function showAlpha(vAlpha){
	document.getElementById('compassHeading').innerHTML = vAlpha;
	if ((vAlpha  > 337.5) && (vAlpha <= 22.5)){
		document.getElementById('compassDirection').innerHTML = "N";
	}
	if (vAlpha  > 22.5 && vAlpha <= 67.5){
		document.getElementById('compassDirection').innerHTML = "NO";
	}
	if (vAlpha  > 67.5 && vAlpha <= 112.5){
		document.getElementById('compassDirection').innerHTML = "O";
	}
	if (vAlpha  > 112.5 && vAlpha <= 157.5){
		document.getElementById('compassDirection').innerHTML = "SO";
	}
	if (vAlpha  > 157.5 && vAlpha <= 202.5){
		document.getElementById('compassDirection').innerHTML = "S";
	}
	if (vAlpha  > 202.5 && vAlpha <= 247.5){
		document.getElementById('compassDirection').innerHTML = "SW";
	}
	if (vAlpha  > 247.5 && vAlpha <= 292.5){
		document.getElementById('compassDirection').innerHTML = "W";
	}
	if (vAlpha  > 292.5 && vAlpha <= 337.5){
		document.getElementById('compassDirection').innerHTML = "NW";
	}
	
}
//function checkCompass(){
//	if(window.DeviceOrientationEvent) { 
//		document.getElementById('compassAvalibale').innerHTML = 'Kompass aktiviert';
//		window.addEventListener('deviceorientation', function(event) {
//			  var alpha = event.alpha;
//			  document.getElementById('compassHeading').innerHTML = alpha;
//			  return;
//			}, false);
//	}
//	else{
//		output.appendChild(document.createTextNode("compass läuft nicht"));
//	}
//}