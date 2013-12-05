//use the real host for directions
var SAMPLE_ADVANCED_POST = location.protocol
		+ '//'
		+ location.hostname
		+ (location.port && (location.port.length > 0) && (location.port != 80)
				&& (location.port != 443) ? ':' + location.port : '')
		+ '/directions/v2/route?key=YOUR_KEY_HERE&callback=handleRouteResponse&generalize=500';
// since nominatim runs on a seprate set of hosts we use netscaler to get to
// nominatim, so overwrite host to hit netscaler
var HOST_URL = 'http://open.mapquestapi.com';
var SAMPLE_SEARCH = HOST_URL
		+ '/nominatim/v1/search.php?json_callback=renderExampleAdvancedResults&format=json&bounded=1';
var points = '';
var advancedOptions = '';
var newSearchURL = '';

function getDirectionsURL() {
	advancedOptions = SAMPLE_ADVANCED_POST;

	var from = document.getElementById('e2_from').value;
	var to = document.getElementById('e2_to').value;
	from = from.split(",");
	to = to.split(",");

	advancedOptions += "&from=" + from[0] + "," + from[1];
	advancedOptions += "&to=" + to[0] + "," + to[1];
}

function getSearchURL() {
	var query = document.getElementById('e2_query').value;
	var buffer = document.getElementById('e2_buffer').value;
	newSearchURL = SAMPLE_SEARCH;
	newSearchURL += "&q=" + query;
	newSearchURL += "&routewidth=" + buffer;
	newSearchURL += "&route=" + points;
}

function renderExampleAdvancedResults(response) {
	var html = '';
	var i = 0;
	var j = 0;

	if (response) {
		html += '<table><tr><th colspan="5">Search Results</th></tr>'
		html += '<tr><td><b>#</b></td><td><b>Type</b></td><td style="min-width:150px;"><b>Name</b></td><td><b>Lat/Long</b></td><td style="min-width:200px;"><b>Fields</b></td></tr>';
		html += '<tbody>'

		for ( var i = 0; i < response.length; i++) {
			var result = response[i];
			var resultNum = i + 1;

			html += "<tr valign=\"top\">";
			html += "<td>" + resultNum + "</td>";
			html += "<td>" + result.type + "</td>";

			html += "<td>";
			if (result.display_name) {
				var new_display_name = result.display_name.replace(/,/g,
						",<br />")
				html += new_display_name;
			}
			html += "</td>";
			html += "<td>" + result.lat + ", " + result.lon + "</td>";
			html += "<td>"
			if (result) {
				for ( var obj in result) {
					var f = result[obj];
					html += "<b>" + obj + ":</b> " + f + "<br/>";
				}
			}
			html += "</td></tr>";
		}
		html += '</tbody></table>';
	}

	switch (searchType) {
	case "advancedSearch":
		document.getElementById('divAdvancedDirectionsUrl').style.display = "";
		var safe = advancedOptions;
		document.getElementById('divAdvancedDirectionsUrl').innerHTML = safe
				.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '+');
		document.getElementById('divAdvancedSearchUrl').style.display = "";
		var safe2 = newSearchURL;
		document.getElementById('divAdvancedSearchUrl').innerHTML = safe2
				.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '+');
		document.getElementById('divAdvancedResults').style.display = "";
		document.getElementById('divAdvancedResults').innerHTML = html;
		break;
	}
}

function handleRouteResponse(response) {
	var info = response.info;
	if (info && info.statuscode && (info.statuscode != 0) && info.messages
			&& (info.messages.length > 0)) {
		var text = "Error " + info.statuscode + ":  ";
		for (num = 0; num < info.messages.length; num++) {
			text += info.messages[num] + "  ";
		}
		alert(text);
		return;
	}
	if (response.collections) {
		var text = 'Whoops!  Ambiguous addresses detected.  Please use non-ambiguous locations.';
		text += '\n\nAmbiguous locations:\n\n';
		for (i = 0; i < response.collections.length; i++) {
			var collection = response.collections[i];
			if (collection.length == 1) {
				continue;
			}
			for (j = 0; j < collection.length; j++) {
				text += '    ' + (collection[j].adminArea5 || ' ');
				text += ' ' + (collection[j].adminArea4 || ' ');
				text += ' ' + (collection[j].adminArea3 || ' ');
				text += ' ' + (collection[j].adminArea2 || ' ');
				text += ' ' + (collection[j].adminArea1 || ' ');
				text += '\n';
			}
		}
		alert(text);
		return;
	}

	var route = response.route;
	points = route.shape.shapePoints;
	if (!points) {
		return;
	}
	doAdvancedSearch();
}

function doAdvancedRoute() {
	searchType = 'advanced';
	var script = document.createElement('script');
	script.type = 'text/javascript';
	getDirectionsURL();
	var newURL = advancedOptions;
	var newURL = advancedOptions.replace('YOUR_KEY_HERE', APP_KEY);
	script.src = newURL;
	document.body.appendChild(script);
};

function doAdvancedSearch() {
	searchType = 'advancedSearch';
	var script = document.createElement('script');
	script.type = 'text/javascript';
	getSearchURL();
	var newURL = newSearchURL;
	script.src = newURL;
	document.body.appendChild(script);
};

function collapseResults_advanced(type) {
	switch (type) {
	case "advanced":
		document.getElementById('divAdvancedDirectionsUrl').style.display = "none";
		document.getElementById('divAdvancedSearchUrl').style.display = "none";
		document.getElementById('divAdvancedResults').style.display = "none";
		break;
	}
}