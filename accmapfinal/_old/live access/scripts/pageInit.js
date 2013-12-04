function initPage(){		
			//prevents loading screen
			$(document).bind("mobileinit", function() {
				$.mobile.loadingMessage = false;
				if ($('#locationOutput').html() == "") {
					getGPSLocation();
				}

				$.mobile.fixedToolbars.setTouchToggleEnabled(false);
			});
			$(document).bind('pageinit', function() {
			$("input[name='radio-choice-1']").bind( "change", function(event, ui) {
			console.log("routing to " + $(this).attr('id'));
			});
				if ($('#locationOutput').html() == "") {
					getGPSLocation();
				}
				//set saved state from localstorage for roadwidth and search radius
				$('#select-choice-roadwidth').val(getRoadOption());
				$('#select-choice-radius').val(getRadius());

				//bind change event to every checkbox
				$("input[type='checkbox']").bind("change", function(event, ui) {
					localStorage.setItem(event.target.id, event.target.checked);
				});
				
				

			});
			$('#location').live('pageinit', function(event) {
				//set saved state from localstorage on pageinit
				$("input[type='checkbox']").each(function() {
					var isChecked = localStorage.getItem($(this).attr('id'));
					if (isChecked != null) {
						if (isChecked.indexOf("true") >= 0) {
							$(this).prop('checked', 'checked').checkboxradio("refresh");
							;
						}

					}
				});
				$('#selectLocation').bind("click", function(event,ui){
					getManualLocation();
				});
			});
}
