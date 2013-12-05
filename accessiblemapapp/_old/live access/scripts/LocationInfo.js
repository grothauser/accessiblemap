//1. get Location
function getGPSLocation() {
	var options = {
		enableHighAccuracy : true,
		timeout : 5000,
		maximumAge : 0
	};
	function success(pos) {
		var crd = pos.coords;
		findNextIntersectionGeoNames(crd.latitude, crd.longitude);
	}
	;

	function error(err) {
		alert('ERROR(' + err.code + '): ' + err.message);
	}
	;
	navigator.geolocation.getCurrentPosition(success, error, options);
}
//2. ask Nominatim for address
function askAddrNominatim(lat, lon) {
	$.ajax({
		type : 'GET',
		url : "http://open.mapquestapi.com/nominatim/v1/reverse?format=json&lat="
				+ lat + "&lon=" + lon + "&zoom=18&addressdetails=1",
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
		},
		success : function(parameters) {
			console.log("success");
			console.log(parameters);
			document.getElementById('location').innerHTML = parameters.display_name;
			var location = document.getElementById('location');
			location.insertAdjacentHTML('beforeend', "<br> lat: " + parameters.lat+ " <br>");
			location.insertAdjacentHTML('beforeend', "<br>lon: " + parameters.lon+ " <br>");
			findBoundingBox(parameters.display_name);
		},
	});
}
//4. search for address
function findBoundingBox(display_name) {
	$.ajax({
		type : 'GET',
		url : "http://nominatim.openstreetmap.org/search?q=" 
				 + display_name
				+ "&format=json&polygon=1&addressdetails=1&",
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
			alert(parameters);
		},
		success : function(parameters) {
			console.log("success 1 bbox");
			console.log(parameters);
		//	writeBoundingBox(parameters);
		},
	});

}
//search for display_name to get bbox around location
function askBboxNominatim(osmid) {
	$.ajax({
		type : 'GET',
		url : "http://open.mapquestapi.com/nominatim/v1/reverse.php?format=json&osm_type=W&osm_id="+ osmid,
		//url : "http://open.mapquestapi.com/nominatim/v1/search.php?format=json&polygon=1&addressdetails=1&q="+ osmid,
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
			alert(parameters);
		},
		success : function(parameters) {
			console.log("success 1 Location.js");
			console.log(parameters);
			//document.getElementById('intersectionsnorth').innerHTML = parameters.boundingbox[0];
		},
	});
}
function findNextIntersectionGeoNames(lat, lon){
	$.ajax({
		type : 'GET',
		url : "http://api.geonames.org/findNearbyStreetsOSMJSON?lat="+lat+"1&lng="+lon+"&username=accessiblemap",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error");
			alert(parameters);
		},
		success : function(parameters) {
			console.log("success intersections from geonames");
			console.log(parameters);
		},
	});
}	
//5. search for bbox for road
function writeBoundingBox(data) {
	$.ajax({
				type : 'GET',
				url : "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];way("
						+ data[0].boundingbox[0]
						+ ","
						+ data[0].boundingbox[2]
						+ ","
						+ data[0].boundingbox[1]
						+ ","
						+ data[0].boundingbox[3] + ");out%20body;",
				dataType : 'json',
				jsonp : 'json_callback',
				error : function(parameters) {
					console.error("error");
				},
				success : function(parameters) {
					console.log("success 2");
					console.log(parameters);
					filterIntersections(data[0].osm_id,parameters.elements);
				},
			});
}

function findElementById(id, elements){
	for(var i = 0; i < elements.length; i++){
		if(elements[i].id == id){
			var actStreet = elements[i];
			return actStreet;
		}
	}
}
function filterIntersections(actId,elements){
	var intersectionsfwd = new Array();
	var streetNodes = new Array();
	var actStreet = new Array();
	
	console.log("actual place id " + actId);
	actStreet = findElementById(actId,elements).nodes;
	
	//for each element in bbox
	for(var i = 0; i < elements.length; i++){
		if(elements[i].id != actId){
			if(elements[i].tags.highway != undefined){
			//fill nodes from street into streetNodes
			streetNodes = elements[i].nodes;
			//for each node in any nodes array
			for(var k = 0; k < streetNodes.length; k++){
				//check if in actStreet
				if($.inArray(streetNodes[k], actStreet)!== -1){
					console.log("node " + streetNodes[k] + " from " + findElementById(actId,elements).tags.name + " is also in " + elements[i].tags.name + " with id " + elements[i].id);
					console.log(elements[i].tags.highway);
					//window.setTimeout(askBboxNominatim(elements[i].id),1500);
					intersectionsfwd.push(elements[i]);
				}
			}
				}
		}
	}
	//writeIntersections(intersectionsfwd);
}
function getLonLatForOsmId(osmid){
	
}
function writeIntersections(intersectionsfwd){
	console.log(intersectionsfwd.length);
	
	var nameOfStreet;
	
	if(intersectionsfwd.length == 0){
		document.getElementById('intersectionsfwd').innerHTML = 'keine Kreuzungen gefunden';
	}else{
	for(var x = 0; x < intersectionsfwd.length; x++){
		nameOfStreet = intersectionsfwd[x].tags.name != undefined ? intersectionsfwd[x].tags.name : "unbekannte Strasse" ;
		var intersections = document.getElementById('intersectionsfwd');
		intersections.insertAdjacentHTML('beforeend', nameOfStreet+ " <br>");
	}
	}
}


function fake(){
	askBboxNominatim("9, Schulstrasse, Rapperswil-Jona, Wahlkreis See-Gaster, St.Gallen, 8640, Schweiz");
}