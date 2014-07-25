function initPage(){
	var wayPerCord = new Array();
	var locatedLat, locatedLon;	
	$(document).bind("mobileinit", function() {
		$.mobile.loadingMessage = false;
		if ($('#locationOutput').html() === "Suche Standort...") {
			getGPSLocation();
		}
		$.mobile.collapsible.prototype.options.expandCueText = " durch Klicken aufklappen";
		$.mobile.collapsible.prototype.options.inset = false;
		$.mobile.fixedToolbars.setTouchToggleEnabled(false);
	});
	$(document).bind('#location','pagecreate', function(){
		if ($('#locationOutput').html() === "Suche Standort...") {
			getGPSLocation();
		}
		$('#select-choice-radius').val(getRadius());
	});
$("#dialog").live('keyup', function(event){
 if ( event.keyCode == 13)  {
     $("#selectLocation").click();
  }
  else if(event.keyCode == 27){
   $("#cancelLocation").click();
  }
});	
	$(document).on('pageinit','#location', function() {
		if ($('#locationOutput').html() === "Suche Standort...") {
				getGPSLocation();
		}
		$('#select-choice-radius').val(getRadius());
		
		$('#selectLocation').bind("click", function(event,ui){
		if(($('#street').val()!="" && $('#place').val()!="") || ($('#plz').val() !="" && $('#street').val()!="")){
			getManualLocation();
		}else{
			$('#locationOutput').text("Zu wenig Angaben übermittelt, versuchen Sie es noch einmal. (Mind. Ort und PLZ oder Ort und Strasse).");
			$("#cancelLocation").click();
		}
			
		});
		$("input[type='checkbox']").bind("change", function(event, ui) {
			localStorage.setItem($(this).attr('id'), $(this).prop('checked'));
		});
		var checkbox,id;
		var defaultValues = new Array('railway=tram_stop','shop=kiosk','restaurant','fast_food','cafe','shop=supermarket','post_box','toilets','highway=bus_stop');
		$("input[type='checkbox']").each(function() {
			checkbox = $(this);
			var isChecked = localStorage.getItem(checkbox.attr('id'));
			//for the first time we set all orientation points checked
			id = checkbox.attr('id')
			if(isChecked === null){
				if(checkbox.attr('name')==='op'){
					checkbox.prop('checked', 'true').checkboxradio("refresh");
					localStorage.setItem(id, checkbox.prop('checked'));
				}else{
					if($.inArray(id,defaultValues) != -1){
						checkbox.prop('checked', 'true').checkboxradio("refresh");
						localStorage.setItem(id, checkbox.prop('checked'));
					}
				}
			}
			else{
				if(isChecked === "true"){
					checkbox.prop('checked', 'true').checkboxradio("refresh");
				}else{
					checkbox.removeAttr('checked').checkboxradio("refresh");
				}
			}
		});
	});
}

function setListener(){
	var firstLeft = true;
	$('input[name=routeChoiceLeft]').change(function(event) {
		if (!firstLeft) {
			$('#selectedPOIButtonLeftUpper  .ui-btn-text').text("Navigieren nach " + $(this).val());
			$('#selectedPOIButtonLeftDown  .ui-btn-text').text("Navigieren nach " + $(this).val());
			$('#aroundLeft').trigger('create');
		} else {
			$('#selectedPOIButtonLeftUpper  .ui-btn-text').text("Navigieren nach " + $(this).val());
			$('#selectedPOIButtonLeftDown .ui-btn-text').text("Navigieren nach " +$(this).val());
			bindClickEvent('#selectedPOIButtonLeftUpper', 'Left');
			bindClickEvent('#selectedPOIButtonLeftDown','Left');			
			$('#aroundLeft').trigger('create');
			firstLeft = false;
		}
	});

	var firstRight = true;
	$("input[name='routeChoiceRight']").change(function(event) {
		console.log(firstRight);
		if (!firstRight) {
			$('#selectedPOIButtonRightUpper  .ui-btn-text').text("Navigieren nach " +$(this).val());
			$('#selectedPOIButtonRightDown  .ui-btn-text').text("Navigieren nach " +$(this).val());
			$('#aroundRight').trigger('create');
		} else {
			$('#selectedPOIButtonRightUpper  .ui-btn-text').text("Navigieren nach " +$(this).val());
			$('#selectedPOIButtonRightDown  .ui-btn-text').text("Navigieren nach " +$(this).val());
			bindClickEvent('#selectedPOIButtonRightUpper', 'Right');
			bindClickEvent('#selectedPOIButtonRightDown', 'Right');
			$('#aroundRight').trigger('create');
			firstRight = false;
		}
	});
}



function bindClickEvent(button,dir){
	$(button).bind('click', function(){
		var id = $('input[name=routeChoice'+dir+']:checked').attr('id');
		var destarr = id.split(',');
		destlat = destarr[0];
		destlon = destarr[1];
		getRoute(locatedLat, locatedLon, destlat,destlon );
		
		$('#titleroutingright').text("Route von "+ $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
		$('#titleroutingright').trigger('create');	
		$('#titleroutingleft').text("Route von " + $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
		$('#titleroutingleft').trigger('create');
	});
}
