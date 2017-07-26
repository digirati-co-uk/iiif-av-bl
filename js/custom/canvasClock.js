/********************************
* Canvas Clock Methods
********************************/

// OPTIONS
var canvasClockFrequency = 25,
	lowPriorityFrequency = 100,
	highPriorityFrequency = 25,
	defaultCanvasWidth = 600,
	defaultCanvasHeight = 400;

// GLOBAL VARS
var canvasInstances = [],
	containerWidth,
	containerHeight;

function initCanvas(canvasData) {
	
	var canvasInstance = {
		"data": canvasData,
		"canvasClockDuration": canvasData.duration,
		"canvasClockTime": 0,
		"canvasClockStartDate": 0,
		"isPlaying": false,
		"isStalled": false,
		"stallRequestedBy": []
	}

	if (!canvasData.width) {
		canvasInstance.canvasWidth = defaultCanvasWidth;
	} else {
		canvasInstance.canvasWidth = canvasData.width;
	}
	if (!canvasData.height) {
		canvasInstance.canvasHeight = defaultCanvasHeight;
	} else {
		canvasInstance.canvasHeight = canvasData.height;
	}

	var player = $('<div class="player"></div>'),
		canvasContainer = $('<div class="canvasContainer"></div>'),
		timelineContainer = $('<div class="timelineContainer"></div>'),
		timelineItemContainer = $('<div class="timelineItemContainer"></div>'),
		controlsContainer = $('<div class="controlsContainer"></div>'),
		playButton = $('<button class="playButton">Play</button>'),
		pauseButton = $('<button class="pauseButton">Pause</button>'),
		timingControls = $('<span>Current Time: <span class="canvasTime"></span> / Duration: <span class="canvasDuration"></span></span>');

	controlsContainer.append(playButton, pauseButton, timingControls);
	player.append(canvasContainer, timelineContainer, timelineItemContainer, controlsContainer);

	$('.playerContainer').append(player);
	canvasInstance.playerElement = player;

	containerWidth = canvasContainer.width();

	timelineContainer.width(containerWidth).slider({
			value: 0,
			step: 0.01,
			orientation: "horizontal",
			range: "min",
			max: canvasInstance.canvasClockDuration,
			animate: false,			
			create: function(evt, ui) {
				// on create
			},
			slide: function(evt, ui) {
				canvasInstance.setCurrentTime(ui.value);
			},
			stop: function(evt, ui) {
				//canvasInstance.setCurrentTime(ui.value);
			}
	});

	var resizeFactorY = containerWidth / canvasInstance.canvasWidth,
		newHeight = canvasInstance.canvasHeight * resizeFactorY;

	canvasContainer.height(canvasInstance.canvasHeight * resizeFactorY);
	timingControls.find('.canvasDuration').text( formatTime(canvasInstance.canvasClockDuration) );
	
	canvasInstances.push(canvasInstance);

	initContents(canvasInstance);
	initCanvasMethods(canvasInstance);

	playButton.on('click', function() {
		canvasInstance.playCanvas();	
	});

	pauseButton.on('click', function() {
		canvasInstance.pauseCanvas();	
	});
	
	canvasInstance.setCurrentTime(0);


	logMessage('CREATED CANVAS: '+ canvasInstance.canvasClockDuration +' seconds, '+ canvasInstance.canvasWidth +' x '+ canvasInstance.canvasHeight+' px.');

}

function initCanvasMethods(canvasInstance) {

	canvasInstance.setCurrentTime = function(seconds) {
		
		var secondsAsFloat = parseFloat(seconds);

		if ( isNaN(secondsAsFloat) ) {
			return;
		}

		this.canvasClockTime = secondsAsFloat;
		this.canvasClockStartDate = Date.now() - (this.canvasClockTime * 1000)

		logMessage('SET CURRENT TIME to: '+ this.canvasClockTime + ' seconds.');

		this.canvasClockUpdater();
		this.highPriorityUpdater();
		this.lowPriorityUpdater();

		this.synchronizeMedia();
		
	}

	canvasInstance.playCanvas = function(withoutUpdate) {
		
		if (this.isPlaying) { return; }

		if (this.canvasClockTime === this.canvasClockDuration) {
			this.canvasClockTime = 0;
		}

		this.canvasClockStartDate = Date.now() - (this.canvasClockTime * 1000);

		var self = this;
		this.highPriorityInterval = window.setInterval(function() {
			self.highPriorityUpdater();
		}, highPriorityFrequency);
		this.lowPriorityInterval = window.setInterval(function() {
			self.lowPriorityUpdater();
		}, lowPriorityFrequency);
		this.canvasClockInterval = window.setInterval(function() {
			self.canvasClockUpdater();
		}, canvasClockFrequency);

		this.isPlaying = true;

		if (!withoutUpdate) {
			this.synchronizeMedia();
		}

		logMessage('PLAY canvas');
		
	}

	canvasInstance.pauseCanvas = function(withoutUpdate) {
		window.clearInterval(this.highPriorityInterval);
		window.clearInterval(this.lowPriorityInterval);

		window.clearInterval(this.canvasClockInterval);

		this.isPlaying = false;

		if (!withoutUpdate) {
			this.highPriorityUpdater();
			this.lowPriorityUpdater();
			this.synchronizeMedia();
		}

		logMessage('PAUSE canvas');
	}

	canvasInstance.canvasClockUpdater = function() {
		this.canvasClockTime = (Date.now() - this.canvasClockStartDate) / 1000;

		if (this.canvasClockTime >= this.canvasClockDuration) {
			this.canvasClockTime = this.canvasClockDuration;
			this.pauseCanvas();
		}
	}

	canvasInstance.highPriorityUpdater = function() {
		this.playerElement.find('.timelineContainer').slider('value', this.canvasClockTime);
		this.playerElement.find('.canvasTime').text( formatTime(this.canvasClockTime) );
	}

	canvasInstance.lowPriorityUpdater = function() {
		this.updateMediaActiveStates();
	}

	canvasInstance.updateMediaActiveStates = function() {

		var mediaElement;

		for (var i=0; i<this.mediaElements.length; i++) {

			mediaElement = this.mediaElements[i];

			if ( mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime ) {

				this.checkMediaSynchronization();

				if (!mediaElement.active) {
					this.synchronizeMedia();
					mediaElement.active = true;
					mediaElement.element.show();
					mediaElement.timelineElement.addClass('active');
				}

				if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {

					if (mediaElement.element[0].currentTime > mediaElement.element[0].duration - mediaElement.endOffset) {
						mediaElement.element[0].pause();
					}

				}

			} else {

				if (mediaElement.active) {
					mediaElement.active = false;
					mediaElement.element.hide();
					mediaElement.timelineElement.removeClass('active');
					if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {
						mediaElement.element[0].pause();
					}
				}

			}

		}

		//logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this.canvasClockTime + ' seconds.');

	}

	canvasInstance.synchronizeMedia = function() {

		var mediaElement;

		for (var i=0; i<this.mediaElements.length; i++) {

			mediaElement = this.mediaElements[i];
			
			if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {

				mediaElement.element[0].currentTime = this.canvasClockTime - mediaElement.start + mediaElement.startOffset;

				if ( mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime ) {
					if (this.isPlaying) {
						if (mediaElement.element[0].paused) {
							var promise = mediaElement.element[0].play();
							if (promise) {
								promise.catch(function(){});
							}
						}
					} else {
						mediaElement.element[0].pause();
					}
				} else {
					mediaElement.element[0].pause();
				}

				if (mediaElement.element[0].currentTime > mediaElement.element[0].duration - mediaElement.endOffset) {
					mediaElement.element[0].pause();
				}

			}


		}

		logMessage('SYNC MEDIA at: '+ this.canvasClockTime + ' seconds.');
		
	}

	canvasInstance.checkMediaSynchronization = function() {
	
		var mediaElement;

		for (var i = 0, l = this.mediaElements.length; i < l; i++) {
			
			mediaElement = this.mediaElements[i];

			if ( (mediaElement.type == 'Video' || mediaElement.type == 'Audio') && 
				 (mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime) ) {

				var correctTime = (this.canvasClockTime - mediaElement.start + mediaElement.startOffset),
					factualTime = mediaElement.element[0].currentTime;

				// off by 0.2 seconds
				if ( Math.abs(factualTime - correctTime) > 0.4) {
					
					mediaElement.outOfSync = true;
					//this.playbackStalled(true, mediaElement);
					
					var lag = Math.abs(factualTime - correctTime);
					logMessage('DETECTED synchronization lag: '+ Math.abs(lag) );
					//mediaElement.element[0].currentTime = correctTime;
					this.synchronizeMedia();

				} else {
					mediaElement.outOfSync = false;
					//this.playbackStalled(false, mediaElement);
				}

			}

		}

	}

	canvasInstance.playbackStalled = function(aBoolean, syncMediaRequestingStall) {

		if (aBoolean) {

			if (this.stallRequestedBy.indexOf(syncMediaRequestingStall) < 0) {
				this.stallRequestedBy.push(syncMediaRequestingStall);
			}


			if (!this.isStalled) {

				showWorkingIndicator(this.playerElement.find('.canvasContainer'));

				this.wasPlaying = this.isPlaying;

				this.pauseCanvas(true);
				/*
				window.clearInterval(this.highPriorityIntervalID);
				window.clearInterval(this.lowPriorityIntervalID);

				window.clearInterval(this.canvasClockInterval);
				*/

				this.isStalled = aBoolean;

			}

		} else {

			var idx = this.stallRequestedBy.indexOf(syncMediaRequestingStall);
			if (idx >= 0) {
				this.stallRequestedBy.splice(idx, 1);
			}

			if (this.stallRequestedBy.length === 0) {

				hideWorkingIndicator();

				if (this.isStalled && this.wasPlaying) {

					this.playCanvas(true);
					/*
					if (this.canvasClockTime === this.canvasClockDuration) {
						this.canvasClockTime = 0;
					}
					this.canvasClockStartDate = Date.now() - (this.canvasClockTime * 1000);
					
					var self = this;
					this.highPriorityInterval = window.setInterval(function() {
						self.highPriorityUpdater();
					}, highPriorityFrequency);
					this.lowPriorityInterval = window.setInterval(function() {
						self.lowPriorityUpdater();
					}, lowPriorityFrequency);
					this.canvasClockInterval = window.setInterval(function() {
						self.canvasClockUpdater();
					}, canvasClockFrequency);
					*/

				}

				this.isStalled = aBoolean;

			}

		}

	}


}

function formatTime(aNumber) {

	var hours, minutes, seconds, hourValue;

	seconds 	= Math.ceil(aNumber);
	hours 		= Math.floor(seconds / (60 * 60));
	hours 		= (hours >= 10) ? hours : '0' + hours;
	minutes 	= Math.floor(seconds % (60*60) / 60);
	minutes 	= (minutes >= 10) ? minutes : '0' + minutes;
	seconds 	= Math.floor(seconds % (60*60) % 60);
	seconds 	= (seconds >= 10) ? seconds : '0' + seconds;

	if (hours >= 1) {
		hourValue = hours + ':';
	} else {
		hourValue = '';
	}

	return hourValue + minutes + ':' + seconds;

}