var lat = 47.22518694491237;
var lon =  8.816718757152556;
var bbox = getBbox(lat, lon, "0.5");

function getHighways() {
	console.log(bbox[1] + "," + bbox[0] + "," + bbox[3] + "," + bbox[2]);
	$.ajax({
		type : 'GET',
		url : "http://overpass-api.de/api/interpreter?data=[out:json];way[highway][highway!~footway]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error Highways: "+parameters);
			console.log(parameters);
		},
		success : function(parameters) {
			console.log("success Highways: "+ parameters.elements.length);
			console.log(parameters);
			findFootways(parameters, lat, lon);
		},
	});
}

function findFootways (parametersHigh, lat, lon){
	$.ajax({
		type : 'GET',
		url : "http://overpass-api.de/api/interpreter?data=[out:json];way[highway=footway]("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");out;",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error Footways: "+parameters);
			console.log(parameters);
		},
		success : function(parameters) {
			console.log("success Footways: "+ parameters.elements.length);
			console.log(parameters);
			getCrossCity(parametersHigh, lat, lon, parameters );
		},
	});
}

function getCrossCity(parametersHigh, lat, lon, parametersFoot) {
	$.ajax({
		type : 'GET',
		url : "http://open.mapquestapi.com/nominatim/v1/reverse?format=json&lat=" + lat	+ "&lon=" + lon	+ "&zoom=18&addressdetails=1"
			/*+ "&viewbox=" + bbox[0] + "," + bbox[1] + "," + bbox[2] + "," + bbox[3]*/,
		dataType : 'jsonp',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error City");
		},
		success : function(parameters) {
			//console.log("getCity: " + parameters);
			var street = parameters.address.road == undefined? parameters.address.footway :parameters.address.road;  
			console.log("locatedStreet " + street);
			findCrossIntersections(parametersHigh, street, lat, lon, parametersFoot);
		},
	});
}


function findCrossIntersections(parameters, road, lat, lon, parametersFootway) {
	console.log("searching intersections with: "+road);
	var intersections = [];
	var isecArray = [];
	var startVal = 0;
	var counter=0;
	var isec = [];
	/*for (var i = 0; i < parameters.elements.length; i++) {
		//console.log(parameters.elements[i].tags.name + " vs " + road);
		if (parameters.elements[i].tags.name == road) {
			startVal += 1;
			for (var k = startVal; k < parametersFootway.elements.length; k++) {
				var A = parameters.elements[i].nodes;
				var B = parametersFootway.elements[k].nodes;
				isec = getCrossIntersection(A,B);
				if (isec != -1) {
					isecArray.push(isec);
					var intersectionEntry = new intersection(parameters.elements[i].tags.name,
							parametersFootway.elements[k].tags.name, isec);
					console.log("created intersection " + parameters.elements[i].tags.name + " and "
							+ parametersFootway.elements[k].tags.name + " with id "+ isec);
					if (!(isAlreadyInIntersections(intersectionEntry,
						intersections))) {
						intersections.push(intersectionEntry);
					} else {
						console.log("already in");
						isecArray.pop(isec);
					}
				}
			}
		} 
	}*/
		
	getCoordinatesOfNodes(isecArray,function(coords){
		console.log("Coords: "+coords[counter]+" "+coords[counter+1]);
		counter += 2;
	});
	
	console.log("Test Intersectionpoint");
	/*var coordsHigh = new Array(47.23325574533399, 8.842941373586655,47.23349979374654, 8.844569474458693);
	var coordsFoot = new Array(47.233658242487294, 8.843711167573929, 47.23332313194826, 8.84370043873787);
	//var coordsFoot = new Array(47.23380394206069, 8.84367898106575, 47.23375841098704, 8.843853324651718); //Schneidet nicht
	getOverlaps(coordsHigh, coordsFoot);*/
	//getOverlaps(1,1,2,4,7,1,5,5);
	getIntersectionsWithoutNodes();
}

function getCrossIntersection(streetA, streetB) {
	var isec = -1;
	for ( var k = 0; k < streetA.length; k++) {
		if ($.inArray(streetA[k], streetB) != -1) {
			isec = streetA[k];
		}
	}
	return isec;
}

function getCoordinatesOfNodes(nodeArray, callback){
	for(var k = 0; k<nodeArray.length; k++){
		var coords = new Array();
		$.ajax({
			type : 'GET',
			url : "http://overpass-api.de/api/interpreter?data=[out:json];node("+nodeArray[k]+");out;",
			dataType : 'json',
			jsonp : 'json_callback',
			error : function(parameters) {
				console.error("error Coordinates: "+parameters);
				console.log(parameters);
			},
			success : function(parameters) {
				coords.push(parameters.elements[0].lat);
				coords.push(parameters.elements[0].lon);
				callback(coords);
			},
		});
	}
}

function getIntersectionsWithoutNodes(){
	var roads="primary|secondary|tertiary|trunk|residential|primary_link|secondary_link|tertiary_link|unclassified|service|cycleway";
	$.ajax({
		type : 'GET',
		url : "http://overpass-api.de/api/interpreter?data=[out:json];way [%22highway%22=%22footway%22] [%22bridge%22!~%22.%22] [%22tunnel%22!~%22.%22] "
			+"("+bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]+");"
			+" foreach->.footway( way (around.footway:0) [%22highway%22~%22"+roads+"%22] [%22bridge%22!~%22.%22] [%22tunnel%22!~%22.%22] ->.intersections;" 
			+" node(w.footway); way(bn) [%22highway%22~%22"+roads+"%22] [%22bridge%22!~%22.%22] [%22tunnel%22!~%22.%22] ->.crossings;" 
			+" ( way.intersections; - way.crossings; )->.errors;" 
			+" (.errors;); ( ._; way.footway(around:0); ); out body; node(w); out skel;);",
		dataType : 'json',
		jsonp : 'json_callback',
		error : function(parameters) {
			console.error("error w/o Nodes: "+parameters);
			console.log(parameters);
		},
		success : function(parameters) {
			console.log("found intersections");
			console.log(parameters);
			console.log("getOverlapCoords")
			getOverlapCoords(parameters);
		},
	});
}

function getOverlapCoords(parameters){
	var streetNodes = [];
	var footNodes = [];
	var streetCoords = [];
	var nodeLength = [];
	var nodes = [];
	for(var i=0; i<parameters.elements.length; i++){
		if(parameters.elements[i].type == "way"){
			nodeLength.push(parameters.elements[i].nodes.length);
			if(i==0)
				streetNodes = getWayNodes(parameters, 0);
			else
				footNodes.push(getWayNodes(parameters, i));
		}
		else{
			nodes.push(parameters.elements[i]);
		}
	}
	
	for(var l=0; l<nodeLength[0]; l++){
		for(var x=0; x<nodes.length; x++){
				if(nodes[x]!=undefined && streetNodes[l] == nodes[x].id){
					streetCoords.push((nodes[x].lat+", "+nodes[x].lon));
					delete nodes[x];
				}
		}	
	}
	
	var fNodes = [];
	for(var o=0; o<nodes.length; o++)
		if(nodes[o]!=undefined){
			fNodes.push(nodes[o]);
		}
	
	for(var k=1; k<nodeLength.length; k++){
		var footCoords = [];
		for(var l=0; l<nodeLength[k]; l++){
			for(var x=0; x<fNodes.length; x++){
				if(fNodes[x]!=undefined && footNodes[k-1][l] == fNodes[x].id){
					footCoords.push(fNodes[x].lat+", "+fNodes[x].lon);
					delete fNodes[x];
				}
			}
		}
		
		testOverlap(streetCoords, footCoords);
		
		var nodes = [];
		for(var o=0; o<fNodes.length; o++)
			if(fNodes[o]!=undefined){
				nodes.push(fNodes[o]);
			}	
		var fNodes = nodes;
	}
}

function getWayNodes(parameters, i){
	var wayNodes = [];
	for(var a=0; a<parameters.elements[i].nodes.length; a++){
		wayNodes.push(parameters.elements[i].nodes[a]);
	}
	return wayNodes;
}

function testOverlap(streetCoords, footCoords){
	console.log("test for intersection");
	console.log(streetCoords.length+" and "+footCoords.length);
	for(var i=0; i<streetCoords.length-1; i++){
		for(var k=0;k<footCoords.length-1; k++){
			var line1Start = streetCoords[i].split(",");
			var line1End = streetCoords[i+1].split(",");
			var line2Start = footCoords[k].split(",");
			var line2End = footCoords[k+1].split(",");
			
			console.log("getOverlaps");
			getOverlaps(line1Start[0],line1Start[1],line1End[0], line1End[1],line2Start[0],line2Start[1],line2End[0],line2End[1]);
		}
	}
}

function getNodes(parameters){
	var coords = new Array();
	for(var i = 0; i<parameters.elements.length; i++){
		for(var k = 0; k<parameters.elements[i].nodes.length; k++)
		coords.push(parameters.elements[i].nodes[k]);
	}
	return coords;
}