function getKindOfPoi(string) {
	if(string.indexOf('=')>0){
		string = string.split('=')[1];
	}
	switch (string) {
	case "waste_basket":
		return "Abfalleimer";
	case "tree":
		return "Baum";
	case "roadwork":
		return "Baustelle";
	case "fountain":
		return "Brunnen";
	case "waste_disposal":
		return "Container";
	case "crossing":
		return "Fussgängerstreifen";
	case "hydrant":
		return "Hydrant";
	case "intersection":
		return "Kreuzung";
	case "traffic_signals":
		return "Lichtsignal";
	case "bench":
		return "Sitzbank";
	case "warning":
		return "Unvermerkte Kreuzung";
	
	case "bar":
		return "Bar";
	case "restaurant":
		return "Restaurant";
	case "pub":
		return "Pub";
	case "cafe":
		return "Café";
	case "ice_cream":
		return "Gelaterias";
		
	case "kiosk":
		return "Kiosk";
	case "supermarket":
		return "Supermarkt";
	case "general":
		return "Dorfladen";
	case "departement_store":
		return "Warenhaus";
	case "backery":
		return "Bäckerei";
		
	case "library":
		return "Bibliothek";
	case "school":
		return "Schule";
	case "kindergarten":
		return "Kindergarten";
	case "university":
		return "Universität";
	case "toilets":
		return "Toilette";
	case "telephone":
		return "Telephonzelle";
	case "recycling":
		return "Entsorgungstelle";
	case "post_office":
		return "Poststelle";
	case "post_box":
		return "Briefkasten";
	case "police":
		return "Polizei";
	case "fire_station":
		return "Feuerwehr";
		
	case "bus_stop":
		return "Bushaltestelle";
	case "tram_stop":
		return "Tramhaltestelle";
	case "train_station":
		return "Bahnhof";
	case "ferry_terminal":
		return "Fährstation";

	case "bank":
		return "Bank";
	case "atm":
		return "Geldautomat";
	case "taxy":
		return "Taxistation";

	case "pharmacy":
		return "Apotheke";
	case "doctors":
		return "Arzt";
	case "veterinary":
		return "Tierarzt";
	case "hospital":
		return "Krankenhaus";
	case "dentist":
		return "Zahnarzt";
		
	default:
		return "Unbekannt";
	}
}

function getDirectionForDegrees(deg) {
	
	if ((deg >= 22.5) && (deg < 57.5)) {
		return "leicht rechts weiterlaufen";
	} else if ((deg >= 57.5) && (deg < 112.5)) {
		return "rechts abbiegen";
	} else if ((deg >= 112.5) && (deg < 180)) {
		return "scharf rechts abbiegen";
	} else if (deg == 180) {
		return "umdrehen";
	} else if ((deg > 180) && (deg < 247.5)) {
		return "scharf links abbiegen";
	} else if ((deg >= 247.5) && (deg < 292.5)) {
		return "links abbiegen";
	} else if ((deg >= 292.5) && (deg < 337.5)) {
		return "leicht links weiterlaufen";
	} else if ((deg >= 337.5) || ((deg < 22.5) && (deg > 0)))  {
		return "geradeaus weiterlaufen";
	} else {
		return "";
	}
}

function getSurface(surface) {
	var type = "-";
	switch (surface) {
	case "dirt":
	case "earth":
	case "ground":
		type = "unbefestigte Strasse";
		break;
	case "asphalt":
		type = "Asphalt";
		break;
	case "sett":
		type = "Behauenes Steinpflaster";
		break;
	case "cobblestone":
		type = "Pflasterstein";
		break;
	case "concrete":
		type = "Beton";
		break;
	case "unpaved":
		type = "ohne Strassenbelag";
		break;
	case "fine_gravel":
		type = "Splitt oder Kies";
		break;
	case "grass":
		type = "Wiese";
		break;
	case "gravel":
		type = "Schotter";
		break;
	case "grass_paver":
		type = "Rasengittersteine";
		break;
	case "ice":
		type = "führt übers Eis";
		break;
	case "metal":
		type = "Metall";
		break;
	case "mud":
		type = "Schlamm";
		break;
	case "pebblestone":
		type = "loser Kies";
		break;
	case "sand":
		type = "Sand";
		break;
	case "wood":
		type = "Holz";
		break;
	default:
		type = "-";
	}
	return type;
}

function getTypeOfWay(wayTags) {
	var type = "Strasse";
	if(typeof wayTags.highway != "undefined"){
		switch (wayTags.highway) {
		case "steps":
			type = "Treppe";
			break;
		case "footway":
		case "path":
		case "pedestrian":
			type = "Fussweg";
			break;
		default:
			type = "Strasse";
		}
	}

	// if other than default -> change text
	if (type != "Strasse") {
		// check for bridges
		var bridge = typeof wayTags.bridge != "undefined" ? wayTags.bridge
				: "no";
		if (bridge != "no") {
			type = "Brücke";
		}
		// check for tunnels
		var tunnel = typeof wayTags.tunnel != "undefined" ? wayTags.tunnel
				: "no";
		if (tunnel != "no") {
			type = "Tunnel";
		}
		var name = typeof wayTags.name != "undefined" ? wayTags.name : "-";
		if (name != "-") {
			type = name;
		} 
	
		
	} else {
		// get streetname, if defined
		var name = typeof wayTags.name != "undefined" ? wayTags.name : "-";
		if (name != "-") {
			type = name;
		} 
	}
	return type;
}
