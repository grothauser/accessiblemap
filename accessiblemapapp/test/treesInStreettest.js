module('Trees in Zurich');
test("findTreeStreet(bbox) returns trees from Zurich in bbox", function () {
	var bbox = new Array(47.37599, 8.55182, 47.37703, 8.55435);
	var tree1 = new orientationEntry(47.3765576169737, 8.55282077245482, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer", Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-544",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var tree2 = new orientationEntry(47.3765339138836,8.55284322612277, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer",Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-545",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var tree3 = new orientationEntry(47.3764440568692, 8.55293686530245, "tree", {Baumname_D:"Schwarz-Kiefer, Oesterreichische Schwarz-Kiefer",Status:"Strassenbaum",Quartier:"Fluntern",Baumname_LAT:"Pinus nigra 'spp. nigra'",Strasse:"Gloriastrasse",Baumnummer:"FL-546",Baumart_LAT:"nigra",Pflanzjahr:"0",Kategorie:"Strassenbaum",Baumtyp:"nicht zugeordnet",Baumgattung:"Pinus"});
	var trees = [tree1, tree2, tree3];
	equal(findTreeStreet(bbox), trees);
});