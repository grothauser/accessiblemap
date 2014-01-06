module('Zurich json');
test("findTreeStreet(bbox) returns trees from Zurich in bbox", function () {
	var bbox = getBbox(47.37652, 8.55303, 200);
	var tree1 = new orientationEntry(47.3765576169737, 8.55282077245482, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer", Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-544",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var tree2 = new orientationEntry(47.3765339138836,8.55284322612277, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer",Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-545",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var tree3 = new orientationEntry(47.3764440568692, 8.55293686530245, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer",Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-546",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var expTrees = [tree1, tree2, tree3];
	stop();
	findTreeStreet(bbox).done(function(trees){
		deepEqual(trees, expTrees);
		start();
	});
});

test("findWasteBasket(bbox) returns waste baskets from Zurich in bbox", function () {
	var bbox = getBbox(47.37652, 8.55303, 200);
	var basket1 = new orientationEntry(47.376908852111,8.55424488521075, "waste_basket", { Bemerkung: "Haltestelle Voltastrasse", Ort: "Gloriastrasse", Typ: "Abfallhai", Volumen: "150 Liter"});
	var basket2 = new orientationEntry(47.3770376929649, 8.55396462445198, "waste_basket", {Bemerkung: "Haltestelle Voltastrasse",Ort: "Gloriastrasse", Typ: "Abfallhai", Volumen: "150 Liter"});
	var expBaskets = [basket1, basket2];
	stop();
	findWasteBasket(bbox).done(function(wasteBaskets){
		deepEqual(wasteBaskets, expBaskets);
		start();
	});
});