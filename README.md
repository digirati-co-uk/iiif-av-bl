## Test fixtures to investigate technical challenges of IIIF-AV

See https://docs.google.com/document/d/1lcef8tjqfzBqRSmWLkJZ46Pj0pm8nSD11hbCAd7Hqxg/edit

[Demo](https://digirati-co-uk.github.io/iiif-av-bl/)

___

### Fixture Manifests

1.	[Gapless audio playback](https://digirati-co-uk.github.io/iiif-av-bl/data/bl/01_gapless_audio.json). One IIIF canvas with three annotations with audio content, that must be played in sequence with no gap.
2.	[Gapless video playback](https://digirati-co-uk.github.io/iiif-av-bl/data/bl/02_gapless_video.json). One IIIF canvas with three annotations with video content, that must be played in sequence with no gap.
3.	[Synchronised video example](https://digirati-co-uk.github.io/iiif-av-bl/data/bl/03_synchronised_video.json). Videos playing at the same time. The source videos contain markers to demonstrate the synchronisation points. One IIIF canvas annotated with three videos.
4.	[Synchronised audio and video example](https://digirati-co-uk.github.io/iiif-av-bl/data/bl/04_synchronised_av.json). Audio soundtrack aligned to playing video.
5.	[Video synchronised with gapless audio, text](https://digirati-co-uk.github.io/iiif-av-bl/data/bl/05_synchronised_av_text.json) that includes gapless join of two audio tracks. Timed text annotations appear throughout including at the same time as the gap transition
6.	[_Fire_](https://tomcrane.github.io/fire/manifest3.json). Images, video and text
7.	[_Mahler 3_](https://dlib.indiana.edu/iiif_av/mahler-symphony-3/mahler-symphony-3.json) from Indiana showing range navigation. There are two canvases in this example, each representing a CD. The range metadata provides the navigation.
8.	[_Lunchroom manners_](https://dlib.indiana.edu/iiif_av/lunchroom_manners/lunchroom_manners.json) from Indiana showing range navigation in a video.
9.	[_Bach: Brandenburg Concerto no. 1_](https://britishlibrary.github.io/iiif-av-samples/symphony/manifest.json) from the British Library showing range navigation of audio.

Later - verify approach works with mixture of file formats, and MPEG-DASH/HLS

See https://github.com/IIIF/iiif-av/blob/master/source/api/av/index.md for model discussion.

Two additional useful fixtures:

* [simplest time-based canvas](https://digirati-co-uk.github.io/iiif-av-bl/data/iiif/02.json) - Shows an image for part of the duration of a canvas.
* [parts of media annotated onto different canvas](https://digirati-co-uk.github.io/iiif-av-bl/data/iiif/16.json) - Example - divide a performance up into scenes on different canvases.

___


### Implementation
based on [Evaluation of Existing Approaches](EVALUATION.md)

#### Relevant Files

* [main.js](/js/custom/main.js) </br>UI initialisation
* [ui.js](/js/custom/ui.js) </br>UI methods (canvas navigation, range navigation, logging, helpers)
* [parser.js](/js/custom/parser.js) </br>Parser and media initialisation methods
* [canvasClock.js](/js/custom/canvasClock.js) </br>Canvas clock methods (player initialisation, timing, synchronisation)

#### Canvas Instances / Canvas Clock

* The canvas clock controls synchronisation and playback of media items. It is an abstract timing mechanism, which serves as a point of reference to the synchronisation modules, rather than being based on the native timing mechanisms of a media element. The `canvasClockUpdater()` method updates the abstract timing (based on `canvasClockStartDate`, `canvasClockDuration` and `canvasClockTime`). Every canvas instance has its own canvas clock, player element and updater methods (see **Media Synchronisation**). A canvas clock is always independent of any other canvas instances (playback state, current time, etc.) and contains its own set of media elements (see **Manifest Parsing**).

* A single canvas instance (see global object `canvasInstances`) contains the following properties and methods:
  * data (object)
  * canvasClockDuration (number)
  * canvasClockStartDate (number)
  * canvasClockTime (number)
  * canvasWidth (number)
  * canvasHeight (number)
  * playerElement (DOM element)
  * mediaElements (array) -> see **Manifest Parsing**
  * pauseCanvas (function)
  * playCanvas (function)
  * setCurrentTime (function)
  * updateMediaActiveStates (function)
  * checkMediaSynchronization (function)
  * synchronizeMedia (function)
  * playbackStalled (function)
  * canvasClockUpdater (function)
  * highPriorityUpdater (function)
  * lowPriorityUpdater (function)
  * isPlaying (boolean)
  * wasPlaying (boolean)
  * isStalled (boolean)
  * stallRequestedBy (array)


#### Manifest Parsing

* `initContents()` parses all media items from the manifest data, pushes them to the custom `mediaElements` array of the respective canvasInstance (see `canvasInstances[0].mediaElements`) and renders them in the DOM (both within the canvas and inside the timeline). The `mediaElements[0].element` contains a binding to the rendered DOM element.
* A single media element object contains the following properties and methods:
  * type (string)
  * source (string)
  * start (number)
  * startOffset (number)
  * end (number)
  * endOffset (number)
  * top (number)
  * left (number)
  * width (number)
  * height (number)
  * element (DOM element)
  * timelineElement (DOM element)
  * checkForStall (function)
  * timeout (function)
  * active (boolean)
  * outOfSync (boolean)


#### Media Synchronisation

* Based on the canvas clock timing, media items are synchronised using a set of updater methods. These methods are controlled by two intervals (using `window.setInterval`) of different frequencies (`lowPriorityFrequency` and `highPriorityFrequency`). The intervals are set and cancelled by the canvas instance methods `playCanvas()` and `pauseCanvas()`. Media items are synchronised in two ways:
	* `updateMediaActiveStates()` controls the visibility of items (based on the `mediaElements[0].start` & `mediaElements[0].end` properties, as well as the canvas and media element timing offsets)
	* `synchronizeMedia()` adjusts the `currentTime` of video and audio elements relative to the canvas clock time, as well as their playback state (`mediaElements[0].element[0].play()`, `pause()` etc.)
* Proper synchronisation is regularly checked and corrected in `checkMediaSynchronization()`. Additionally, every media item has its own `mediaElements[0].checkForStall()` method, which reacts to changes in the `readyState` of video and audio elements (buffering or loading issues). This method is coupled with the `checkMediaSynchronization()` logic, as media buffering is the main cause for synchronisation lags.
