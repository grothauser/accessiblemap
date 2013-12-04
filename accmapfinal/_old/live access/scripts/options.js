 function saveRadius(sel) {
       localStorage.radius = sel.value;
 }
 function saveRoadOption(sel){
	  localStorage.roadOption = sel.value;
 }
function getRadius(){
	return localStorage.radius;
}
function getRoadOption(){
	return localStorage.roadOption;
}