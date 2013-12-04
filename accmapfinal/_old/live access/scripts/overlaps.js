function getOverlaps(x1,y1,x2,y2, x3,y3,x4,y4){
	var ux = x2-x1;
	var uy = y2-y1;
	var vx = x4-x3;
	var vy = y4-y3;
	var c = ux*vy-uy*vx;
	
	if(c!=0){
		var wx = x1-x3;
		var wy = y1-y3;
		var w2x = x2-x3;
		var w2y = y2-y3;
		var t0, t1;
		var numerator1 = vx*wy-vy*wx;
		var numerator2 = ux*wy-uy*wx;
		
		wy = numerator1/c;
		wx = numerator2/c;
		
		if((wy>0 && wy<1)&&(wx>0 && wx<1)){
			var isecX = (parseFloat(x1)+wy*ux);
			var isecY = (parseFloat(y1)+wy*uy);
			console.log(x1+", "+y1+" "+x2+", "+y2+" "+x3+", "+y3+" "+x4+", "+y4);
			console.log("intersection: "+isecX+", "+isecY);
		}
	}
}