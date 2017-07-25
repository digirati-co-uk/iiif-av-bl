/********************************
* User Interface Methods
********************************/

function initUI() {

	$('#manifestInput').val('');

	$('#clearLogsButton').click(clearLogs);

	$('#toggleLogsButton').click(function() {
		$('.logContainer').toggle();
	});

	$('.testFixture').click(function() {
		$('#manifestInput').val( $(this).data('json') );
		$('#parseManifestButton').click();
	});

	$('#viewManifestButton').click(function() {
		var absoluteManifestURL = $('#manifestInput').val();
		window.open(absoluteManifestURL, '_blank', 'location=yes,height=600,width=580,scrollbars=yes,status=yes');
	});
	
	$('#parseManifestButton').click(function() {
		
		clearCanvases();

		var manifestURL = $('#manifestInput').val();

		parseManifestData(manifestURL, function() {
		
			clearLogs();
			logMessage('SUCCESS: Manifest data loaded.', this);

			var data = this;

			$('.title').text(data.label);
			$('.description').text(data.description);

			var canvasItems = [];
			if (Array.isArray(data.sequences)) {
				canvasItems = data.sequences[0].canvases;
			} else if (data.type == 'Canvas') {
				canvasItems.push(data);
			} else {
				canvasItems = data.sequences.canvases;
			}

			canvasInstances = [];

			for (var i=0; i<canvasItems.length; i++) {
				initCanvas(canvasItems[i]);
			}

			if (canvasItems.length > 1) {
				initCanvasNavigation(canvasItems);
			}

			if (data.structures) {
				initRangeNavigation(data.structures);
			}


		}, function() {
			
			$('.title').text('ERROR: Could not load manifest data.');
			$('.description').text('');
			logMessage('ERROR: Could not load manifest data.', this);

		});
	});

}

function initCanvasNavigation(canvasItems) {

	for (var i=0; i<canvasItems.length; i++) {
		
		var canvasLabel = i+1;
		var canvasNavigationButton = $('<button class="canvasNavigationButton" data-canvas-id="'+ canvasItems[i].id +'">Canvas '+ canvasLabel +'</button>');
		
		canvasNavigationButton.click(function() {
			navigateToCanvas( $(this).attr('data-canvas-id') );
		});

		$('.canvasNavigationContainer').append(canvasNavigationButton);

	}

	window.setTimeout(function() {
		var firstID = canvasInstances[0].data.id;
		navigateToCanvas(firstID);
	}, 10);
	
}

function initRangeNavigation(structures) {
	
	var rangeNavigationContainer = $('<ul class="rangeNavigationContainer"></ul>');
	
	for (var s=0; s<structures.length; s++) {
		var structureSelector = $('<li data-range="'+ structures[s].id +'">'+ structures[s].label +'</li>');
			structureSelector.click(function() {
				logMessage('SELECT RANGE: '+ $(this).attr('data-range'));
			});

		var ranges = structures[s].members,
			rangeContainer = $('<ul></ul>');

		if (ranges) {
			for (var i=0; i<ranges.length; i++) {
				var rangeSelector = $('<li data-range="'+ ranges[i].id +'">'+ ranges[i].label +'</li>');
					rangeSelector.click(function() {
						logMessage('SELECT RANGE: '+ $(this).attr('data-range'));
					});
					rangeContainer.append(rangeSelector);

				var subranges = ranges[i].members,
					subrangeContainer = $('<ul></ul>');

				if (subranges) {
					for (var r=0; r<subranges.length; r++) {
						var subrangeSelector = $('<li data-range="'+ subranges[r].members[0].id +'">'+ subranges[r].label +'</li>');
						subrangeSelector.click(function() {
							var thisRange = $(this).attr('data-range'),
								selectedCanvas = getCanvasInstanceByID( thisRange );

							if (selectedCanvas) {
								navigateToCanvas(selectedCanvas.data.id);

								var temporal = /t=([^&]+)/g.exec(thisRange);
								if(temporal && temporal[1]) {
									var rangeTiming = temporal[1].split(',');
									selectedCanvas.setCurrentTime(rangeTiming[0]);
									//selectedCanvas.playCanvas();
								}
								logMessage('SELECT RANGE: '+ thisRange);
							} else {
								logMessage('ERROR: Could not find canvas for range '+ thisRange);
							}
							
							//alert('Range: '+ $(this).attr('data-range'));

						});
						subrangeContainer.append(subrangeSelector);
					}
					subrangeContainer.appendTo(rangeContainer);
				}

			}
		}

		
		rangeNavigationContainer.append(structureSelector);
		rangeNavigationContainer.append(rangeContainer);
	}

	

	$('.playerContainer').append(rangeNavigationContainer);
}

function navigateToCanvas(canvasID) {
	for (var i=0; i<canvasInstances.length; i++) {
		canvasInstances[i].pauseCanvas();
	}
	$('.playerContainer .player').hide();
	getCanvasInstanceByID(canvasID).playerElement.show();
}

/*
function stackItems(containerElement) {
	containerElement.CollisionDetection({spacing: 1, includeVerticalMargins: true})
}
*/

function showWorkingIndicator(targetElement) {
	var workingIndicator = $('<div class="workingIndicator">Waiting ...</div>');
	if (targetElement.find('.workingIndicator').length == 0) {
		targetElement.append(workingIndicator);
	}
	//console.log('show working');
}

function hideWorkingIndicator() {
	$('.workingIndicator').remove();
	//console.log('hide working');
}

function getCanvasInstanceByID(canvasID) {
	cleanCanvasID = canvasID.replace('http://', '').replace('https://', '').split('#')[0];
	for (var i=0; i<canvasInstances.length; i++) {
		var cleanInstanceID = canvasInstances[i].data.id.replace('http://', '').replace('https://', '').split('#')[0];
		if (cleanInstanceID == cleanCanvasID) {
			return canvasInstances[i];
		}
	}

	return null;
	
}

function logMessage(message, logObj) {
	if (logObj) {
		//console.log(message, logObj);
	} else {
		//console.log(message);
	}

	$('.logContainer textarea')[0].value = $('.logContainer textarea')[0].value += '\n'+ message;
}

function clearLogs() {
	$('.logContainer textarea')[0].value = '';
}

function clearCanvases() {
	for (var i=0; i<canvasInstances.length; i++) {
		window.clearInterval(canvasInstances[i].highPriorityInterval);
		window.clearInterval(canvasInstances[i].lowPriorityInterval);
		window.clearInterval(canvasInstances[i].canvasClockInterval);
	}

	$('.canvasNavigationContainer, .rangeNavigationContainer, .playerContainer').empty();

}