
function getRadius(){	return localStorage.radius;}
function saveRadius(){
	var radius = $('#select-choice-radius').val();
	localStorage.setItem("radius", radius);
}