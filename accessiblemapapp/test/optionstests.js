module('Localstorage');
test("Setting radius", function () {
 localStorage.setItem('radiustest',5) 
 equal(localStorage.getItem('raduistest'), 5);
});