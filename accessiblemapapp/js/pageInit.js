function initPage(){
	var wayPerCord = new Array();
	var locatedLat, locatedLon;	
			//prevents loading screen
			$(document).bind("mobileinit", function() {
				$.mobile.loadingMessage = false;
				if ($('#locationOutput').html() == "") {
					getGPSLocation();
				}

				$.mobile.fixedToolbars.setTouchToggleEnabled(false);
			});
			 $(document).bind('#location','pagecreate', function(){
				 if ($('#locationOutput').html() == "") {
					getGPSLocation();
				}
				//set saved state from localstorage for roadwidth and search radius
				$('#select-choice-radius').val(getRadius());

			 });
			
			$('#location').live('pageinit', function() {
				console.log("pageinit location");
				 if ($('#locationOutput').html() == "") {
						getGPSLocation();
					}
				$('#select-choice-radius').val(getRadius());
				
				$('#selectLocation').bind("click", function(event,ui){
					getManualLocation();
				});
				$("input[type='checkbox']").bind("change", function(event, ui) {
					localStorage.setItem($(this).attr('id'), $(this).prop('checked'));
				});

				$("input[type='checkbox']").each(function() {
					var isChecked = localStorage.getItem($(this).attr('id'));
					if(isChecked == "true"){
						$(this).prop('checked', 'true').checkboxradio("refresh");
					}else{
						$(this).removeAttr('checked').checkboxradio("refresh");
					}
				});
				 
			});
			
//			$( '#streetViewLeft' ).live( "pageinit", function( event ) {
//						$('#streetviewContent').html("");
//			});
//			
			$('#routing' ).live( "pageinit" ,function( event ) {
				console.log("roting");
			//	getGPSLocation();
				//locatedLat = 47.2300422;
				//locatedLon = 8.8260246;
				//getRoute(47.2300422,8.8260246,"47.2290428,8.8244257");
			});
	}
			


function setListener(){
	console.log("setting listener");
		$('input[name=routeChoiceLeft]').change(function(event) {
			if ($('#selectedPOIButtonLeft').length) {
				$('#selectedPOIButtonLeft  .ui-btn-text').text("Navigieren nach " + $(this).val());
				$('#aroundLeft').trigger('create');
			} else {
				$('#aroundLeft').append("<a href=\"#\" data-transition=\"none\" data-role=\"button\"" + "data-icon=\"arrow-u\" id=\"selectedPOIButtonLeft\" >Navigieren nach " +$(this).val() + "</a>");
				$('#selectedPOIButtonLeft').bind('click', function(){
					getRoute(locatedLat, locatedLon, $('input[name=routeChoiceLeft]:checked').attr('id'));
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
					console.log("button rechts gibts");
					$('#selectedPOIButtonRight  .ui-btn-text').text("Navigieren nach " +$(this).val());
					$('#aroundRight').trigger('create');
				} else {
					$('#aroundRight').append("<a href=\"#routing\" data-transition=\"none\" data-role=\"button\"" + "data-icon=\"arrow-u\" id=\"selectedPOIButtonRight\" >Navigieren nach " + $(this).val() + "</a>");
					$('#selectedPOIButtonRight').bind('click', function(){
						getRoute(locatedLat, locatedLon, $('input[name=routeChoiceRight]:checked').attr('id'));
						$('#titleroutingright').text("Route von "+ $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
						$('#titleroutingright').trigger('create');	
						$('#titleroutingleft').text("Route von " + $('#locationOutput').text() + " nach " +$('input[name=routeChoiceRight]:checked').val() );
						$('#titleroutingleft').trigger('create');
					
					});
					$('#aroundRight').trigger('create');
				}
			});
		
}
