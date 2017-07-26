/********************************
* Manifest Parser Methods
********************************/

function parseManifestData(dataURL, successCallback, errorCallback) {
	
	$.ajax({
		type: 'GET',
		url: dataURL,
		cache: false,
		dataType: 'json',
		mimeType: 'application/json' 
	}).done(function(response) {
		
		if (successCallback) successCallback.call(response);

	}).fail(function(response) {

		if (errorCallback) errorCallback.call(response);

	});

}

function initContents(canvasInstance, mediaItems) {

	canvasInstance.mediaElements = [];

	var mediaItems = canvasInstance.data.content[0].items;

	for (var i=0; i<mediaItems.length; i++) {

		var mediaItem = mediaItems[i];
		
		/*
		if (mediaItem.motivation != 'painting') {
			return null;
		}
		*/

		var mediaSource;
		if (mediaItem.body.type == 'TextualBody') {
			mediaSource = mediaItem.body.value;
		} else if (Array.isArray(mediaItem.body) && mediaItem.body[0].type == 'Choice') {
			// Choose first "Choice" item as body
			var tmpItem = mediaItem;
			mediaItem.body = tmpItem.body[0].items[0];

			mediaSource = mediaItem.body.id.split('#')[0];
		} else {
			mediaSource = mediaItem.body.id.split('#')[0];
		}
		
		/*
		var targetFragment = (mediaItem.target.indexOf('#') != -1) ? mediaItem.target.split('#t=')[1] : '0, '+ canvasClockDuration,
			fragmentTimings = targetFragment.split(','),
			startTime = parseFloat(fragmentTimings[0]),
			endTime = parseFloat(fragmentTimings[1]);

		//TODO: Check format (in "target" as MFID or in "body" as "width", "height" etc.)
		var fragmentPosition = [0, 0, 100, 100],
			positionTop = fragmentPosition[1],
			positionLeft = fragmentPosition[0],
			mediaWidth = fragmentPosition[2],
			mediaHeight = fragmentPosition[3];
		*/

		var spatial = /xywh=([^&]+)/g.exec(mediaItem.target);
		var temporal = /t=([^&]+)/g.exec(mediaItem.target);
		
		var xywh;
		if (spatial && spatial[1]) {
			xywh = spatial[1].split(',');
		} else {
			xywh = [0, 0, canvasInstance.canvasWidth, canvasInstance.canvasHeight];
		}

		var t;
		if(temporal && temporal[1]) {
			t = temporal[1].split(',');
		} else {
			t = [0, canvasInstance.canvasClockDuration];
		}

		var positionLeft = parseInt(xywh[0]),
			positionTop = parseInt(xywh[1]),
			mediaWidth = parseInt(xywh[2]),
			mediaHeight = parseInt(xywh[3]),
			startTime = parseInt(t[0]),
			endTime = parseInt(t[1]);
		
		var percentageTop = convertToPercentage(positionTop, canvasInstance.canvasHeight),
			percentageLeft = convertToPercentage(positionLeft, canvasInstance.canvasWidth),
			percentageWidth = convertToPercentage(mediaWidth, canvasInstance.canvasWidth),
			percentageHeight = convertToPercentage(mediaHeight, canvasInstance.canvasHeight);

		var temporalOffsets = /t=([^&]+)/g.exec(mediaItem.body.id);

		var ot;
		if(temporalOffsets && temporalOffsets[1]) {
			ot = temporalOffsets[1].split(',');
		} else {
			ot = [null, null];
		}

		var offsetStart = (ot[0]) ? parseInt(ot[0]) : ot[0],
			offsetEnd = (ot[1]) ? parseInt(ot[1]) : ot[1];
		
		var itemData = {
			'type': mediaItem.body.type,
			'source': mediaSource,
			'start': startTime, 
			'end': endTime, 
			'top': percentageTop, 
			'left': percentageLeft, 
			'width': percentageWidth, 
			'height': percentageHeight, 
			'startOffset': offsetStart,
			'endOffset': offsetEnd,
			'active': false
		}

		renderMediaElement(canvasInstance, itemData);

	}
}

function renderMediaElement(canvasInstance, data) {
	
	var mediaElement;

	switch(data.type) {
		case 'Image':
			mediaElement = $('<img class="anno" src="' + data.source + '" />');
			break;
		case 'Video':
			mediaElement = $('<video class="anno" src="' + data.source + '" />');
			break;
		case 'Audio':
			mediaElement = $('<audio class="anno" src="' + data.source + '" />');
			break;
		case 'TextualBody':
			mediaElement = $('<div class="anno">' + data.source + '</div>');
			break;
		default:
			return null;
	}

	mediaElement.css({
		top: data.top + '%',
		left: data.left + '%',
		width: data.width + '%',
		height: data.height + '%'
	}).hide();

	data.element = mediaElement;

	if (data.type == 'Video' || data.type == 'Audio') {
		
		data.timeout = null;

		data.checkForStall = function() {

			var self = this;
			
			if (this.active) {
				canvasInstance.checkMediaSynchronization();
				if (this.element.get(0).readyState > 0 && !this.outOfSync) {
					canvasInstance.playbackStalled(false, self);
				} else {
					canvasInstance.playbackStalled(true, self);
					if (this.timeout) {
						window.clearTimeout(this.timeout);
					}
					this.timeout = window.setTimeout(function() {
						self.checkForStall();
					}, 1000);
				}

			} else {
				canvasInstance.playbackStalled(false, self);
			}

		}
	}

	canvasInstance.mediaElements.push(data);

	var targetElement = canvasInstance.playerElement.find('.canvasContainer');
	targetElement.append(mediaElement);

	if (data.type == 'Video' || data.type == 'Audio') {
		var self = data;
		mediaElement.on('loadstart', function() {
			//console.log('loadstart');
			self.checkForStall();
		});
		mediaElement.on('waiting', function() {
			//console.log('waiting');
			self.checkForStall();
		});
		mediaElement.on('seeking', function() {
			//console.log('seeking');
			//self.checkForStall();
		});
		mediaElement.attr('preload', 'auto');
		mediaElement.get(0).load();
	}

	renderSyncIndicator(canvasInstance, data);

}

function renderSyncIndicator(canvasInstance, mediaElementData) {

	var leftPercent = convertToPercentage(mediaElementData.start, canvasInstance.canvasClockDuration),
		widthPercent = convertToPercentage(mediaElementData.end - mediaElementData.start, canvasInstance.canvasClockDuration);

	var timelineItem = $('<div class="timelineItem" title="'+ mediaElementData.source +'" data-start="'+ mediaElementData.start +'" data-end="'+ mediaElementData.end +'"></div>');

	timelineItem.css({
		left: leftPercent + '%',
		width: widthPercent + '%'
	});

	var lineWrapper = $('<div class="lineWrapper"></div>');

	timelineItem.appendTo(lineWrapper);

	mediaElementData.timelineElement = timelineItem;
	var itemContainer = canvasInstance.playerElement.find('.timelineItemContainer');
	itemContainer.append(lineWrapper);
}

function convertToPercentage(pixelValue, maxValue) {
	var percentage = (pixelValue / maxValue) * 100;
	return percentage;
}