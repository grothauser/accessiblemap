var coords = new Array();
module('GPX:', {});
test("load gpx test", function () {
	stop();
	expect(2);
	loadGPX(function(data){
		ok(true);
		extractCoordinates(data);
		equal(coords.length, 36);
	})
	setTimeout(function() {  
        start();  
    }, 2000);  
});

function loadGPX(callback){
	 $.ajax({
	        type: "GET",
	        url: "data/testroute.gpx",
	        dataType: "xml",
	        success: callback
	  });
}
	
function extractCoordinates(data){
	coords = [];
	$(data).find('rtept').each(function(){
		coords.push(new coordPair($(this)[0].attributes[0].value , $(this)[0].attributes[1].value));
	});
}

