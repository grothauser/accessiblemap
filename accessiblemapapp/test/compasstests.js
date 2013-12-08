module('Compass');
test("getClock() returns right time for degrees", function () {
 equal(getClock(0), 12);
 equal(getClock(15), 1);
 equal(getClock(45), 2);
 equal(getClock(75), 3);
 equal(getClock(105), 4);
 equal(getClock(135), 5);
 equal(getClock(165), 6);
 equal(getClock(195), 7);
 equal(getClock(225), 8);
 equal(getClock(255), 9);
 equal(getClock(285), 10);
 equal(getClock(315), 11);
 equal(getClock(345), 12);
 equal(getClock(360), 12);
 equal(getClock(400), 0);
});
