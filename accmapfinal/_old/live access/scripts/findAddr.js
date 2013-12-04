   function askAddrNominatim(){
      $.ajax({
        type: 'GET',
        url: "http://nominatim.openstreetmap.org/reverse?format=json&lat=47.223313&lon=8.817576&zoom=18&addressdetails=1",
        dataType: 'jsonp',
        jsonp: 'json_callback',
        error: function(parameters) {
            console.error("error");
            alert(parameters);
        },
        success: function(parameters) {
            console.log("success");
            read(parameters);
            write(parameters);
        },
    });
    }
    function read(data){
    	console.log(data);
    	//findNearestIntersections();
    }
    function write(data){
    	getGPSLocation();
    	var output = document.getElementById("address");
    //TODO: remove all old Nodes before creating new one
    	if(data.osm_type = "way"){
    	output.appendChild(document.createTextNode("Adresse gefunden: "));
    	if(data.address.road != undefined){
    		output.appendChild(document.createTextNode("Strasse: "));
    		output.appendChild(document.createTextNode(data.address.road));
    		findEndOfRoad(data);
    	}
    	else{
    		output.appendChild(document.createTextNode("Fussweg: "));
    		output.appendChild(document.createTextNode(data.address.footway));
    	}
    	}
    	else{
    		output.appendChild(document.createTextNode("Koordinate ist keine Strasse"));
    	}
    	
    }
    function findNearestIntersections(){
    	 $.ajax({
    	        type: 'GET',
    	        url: "http://api.geonames.org/findNearestIntersectionOSMJSON?lat=37.451&lng=-122.18&username=demo",
    	        dataType: 'jsonp',
    	        jsonp: 'json_callback',
    	        error: function(parameters) {
    	            console.error("error");
    	            alert(parameters);
    	        },
    	        success: function(parameters) {
    	            console.log("success");
    	            console.log(parameters);
    	        },
    	    });
    }
    function findEndOfRoad(data){
    	
    	
    }
    function getGPSLocation(){
    	console.log('asking geolocation');
    	var alocation = new Array();
    	var options = {
    			  enableHighAccuracy: true,
    			  timeout: 5000,
    			  maximumAge: 0
    			};
    	function success(pos) {
    			var crd = pos.coords;
    			alocation[0]= crd.longitude;
    			alocation[1] = crd.latitude;
    			console.log(crd.longitude);
    	 };

    	function error(err) {
    			 alert('ERROR(' + err.code + '): ' + err.message);
    	};
    	
    	navigator.geolocation.getCurrentPosition(success, error, options);
    } 
