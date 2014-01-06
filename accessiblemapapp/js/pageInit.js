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
			
			$(document).on('pageinit','#location', function() {
				if ($('#locationOutput').html() === "Suche Standort...") {
						getGPSLocation();
				}
				$('#select-choice-radius').val(getRadius());
				
				$('#selectLocation').bind("click", function(event,ui){
					getManualLocation();
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
		$('input[name=routeChoiceLeft]').change(function(event) {
			if ($('#selectedPOIButtonLeft').length) {
				$('#selectedPOIButtonLeft  .ui-btn-text').text("Navigieren nach " + $(this).val());
				$('#aroundLeft').trigger('create');
			} else {
				$('#aroundLeft').append('<a href="#" data-transition="none" data-role="button" "data-icon="arrow-u" id="selectedPOIButtonLeft" >Navigieren nach ' +$(this).val() + '</a>');
				$('#selectedPOIButtonLeft').bind('click', function(){
					var id = $('input[name=routeChoiceLeft]:checked').attr('id');
					var destarr = id.split(',');
					destlat = destarr[0];
					destlon = destarr[1];

					getRoute(locatedLat, locatedLon, destlat,destlon );

					$('#titleroutingleft').text("Route von " + $('#locationOutput').text() + " nach " +$('input[name=routeChoiceLeft]:checked').val() );
					$('#titleroutingleft').trigger('create');
					$('#titleroutingright').text("Route von "+ $('#locationOutput').text() + " nach " +$('input[name=routeChoiceLeft]:checked').val() );
					$('#titleroutingright').trigger('create');	
				});
				$('#aroundLeft').trigger('create');
			}
		});

			$("input[name='routeChoiceRight']").change(function(event) {
				if ($('#selectedPOIButtonRight').length) {
					$('#selectedPOIButtonRight  .ui-btn-text').text("Navigieren nach " +$(this).val());
					$('#aroundRight').trigger('create');
				} else {
					$('#aroundRight').append('<a href="#" data-transition="none" data-role="button" "data-icon="arrow-u" id="selectedPOIButtonRight" >Navigieren nach ' +$(this).val() + '</a>');
					$('#selectedPOIButtonRight').bind('click', function(){
						var id = $('input[name=routeChoiceRight]:checked').attr('id');
						var destarr = id.split(',');
						destlat = destarr[0];
						destlon = destarr[1];
						getRoute(locatedLat, locatedLon, destlat,destlon );
						
						$('#titleroutingright').text("Route von "+ $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
						$('#titleroutingright').trigger('create');	
						$('#titleroutingleft').text("Route von " + $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
						$('#titleroutingleft').trigger('create');
					
					});
					$('#aroundRight').trigger('create');
				}
			});
		
}
