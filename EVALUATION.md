## Media Synchronisation and Playback -</br>Evaluation of Existing Approaches


### Introduction

The goal of this document is to give an overview of technical challenges and state of the art implementations. The document covers web standards and javascript frameworks / libraries. The different approaches are summarized, compared and evaluated regarding their use in the [proof of concept implementation of the IIIF A/V test fixtures](https://digirati-co-uk.github.io/iiif-av-bl/).


___


### Web Standards

* Synchronized Multimedia Integration Language (SMIL 3.0) </br>https://www.w3.org/TR/SMIL3/
  * Last updated: 01 December 2008
  * Allows describing the temporal behavior of a multimedia presentation, associate hyperlinks with media objects and describe the layout of the presentation on a screen in XML. No relevant recent client implementations, included for for the sake of completeness and reference to a timing model which has been crafted in detail over many years.
  * Relevant sections:
    * [Synchronisation Relationship](https://www.w3.org/TR/SMIL3/smil-timing.html#q148)
    * [Clocks](https://www.w3.org/TR/SMIL3/smil-timing.html#q160) (see IIIF A/V *CanvasClock*)
    * [Timing Concepts](https://www.w3.org/TR/SMIL3/smil-timing.html#q165)
* SMIL Timesheets 1.0 </br>https://www.w3.org/TR/timesheets/
  * Last updated: 28 March 2012
  * Makes SMIL 3.0 element and attribute timing control available to a wide range of other XML-based languages. "SMIL Timesheets can be seen as a temporal counterpart of CSS".
  * Relevant sections:
    * [Timing and Synchronization](https://www.w3.org/TR/timesheets/#smilTimesheetsNS-basicTiming)
    * [Event Model](https://www.w3.org/TR/timesheets/#smilTimesheetsNS-basicEventModel)
    * [timesheet Element](https://www.w3.org/TR/timesheets/#edef-timesheetsTimesheet)
* HTML5 Media Element (Video & Audio) </br>https://www.w3.org/TR/html5/embedded-content-0.html#media-element
  * Last updated: 28 October 2014
  * Native integration of video and audio elements in HTML5 documents. Includes a JS API and Media Events (onPlay, onEnded, timeupdate, etc.). There is however no native event system which is able to capture / fire events at certain points of time (this still requires a loop which runs every time the timeupdate event is fired and checks a list of start and end times in order to synchronize contents).
  * Relevant sections:
    * *timeupdate* Event </br>https://www.w3.org/TR/html5/embedded-content-0.html#event-media-timeupdate
      * Fires whenever the currentTime changes (also continously during media playback). This makes it a useful event for any time-related updater / checker methods.
    * *mediagroup* Attribute & MediaController </br>https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-mediagroup
      * Allows coupling two or more media elements to a MediaController in order to sychronise playback. Follows a master / slave concept (one media element is defined as master, all others are synchronised). The mediagroup Attribute seems to be on hold and support has in the meantime be removed in all browsers.
  * See also:
    * [HTML5 Video Events and API - DEMO](https://www.w3.org/2010/05/video/mediaevents.html)
* Timing Object (Draft Community Group Report) </br>http://webtiming.github.io/timingobject/
  * Last updated: 30 November 2015
  * [...] "local object that may be used by Web clients to ensure precisely timed operation as well as flexible timing control. If multiple timing-sensitive components take direction from the same timing object, their behaviour will be precisely aligned in time (synchronized)". Can be connected to a web service distributing timing information to one or more devices (allows multi device synchronisation). Very promising approach towards a media independent timing / clock standard. Currently in draft state, worked on by a small W3C community group (no signs at this point that W3C would officially support these efforts in their roadmap).
  * Relevant sections:
    * [Use Cases and Requirements](http://webtiming.github.io/timingobject/#use-cases-and-requirements)
    * [Timed Data and the Timing Object](http://webtiming.github.io/timingobject/#timed-data-and-the-timing-object) (the [Introduction](http://webtiming.github.io/timingobject/#dfn-sequencing) is very informative)
* Media Source Extensions (MSE) </br>https://www.w3.org/TR/media-source/
  * Last updated: 17 November 2016
  * Allows using Javascript to generate media streams (for playback as HTML5 media element). As these streams can be of various media types, MSEs could be seen as a *time container* which is used to generate a media stream and is optimized for seamless playback (the result is a conventional media element with the same API and events as a video element). There are however no relevant client implementations dealing with that use case. The main use case for MSEs is adaptive streaming.
  * Relevant sections:
    * [Source Buffer Object](https://www.w3.org/TR/media-source/#sourcebuffer)
    * [Segment parser loop](https://www.w3.org/TR/media-source/#sourcebuffer-segment-parser-loop)
  * See also:
    * [Basic sequencing demo](http://html5-demos.appspot.com/static/media-source.html) (streaming several video clips to one media element)
___


### Frameworks / Libraries

* MediaGroup JS </br>https://github.com/rwaldron/mediagroup.js
  * Last updated: 15 September 2011
  * JS implementation of the *mediagroup* attribute </br>(see HTML5 Media Element > *mediagroup* attribute & MediaController)

* Timesheets JS </br>https://github.com/timesheets/timesheets.js
  * Last updated: 29 January 2013
  * JS implementation of *SMIL Timesheets*. Allows defining in / out times or durations directly in HTML elements (as attributes).
  * See also:
    * [Basic Markup](http://tyrex.inria.fr/timesheets/markup/)
    * [Annotations](http://tyrex.inria.fr/timesheets/annotations/)
* Popcorn JS </br>https://github.com/mozilla/popcorn-js
  * Last updated: 6 June 2015 (now officially abandoned by Mozilla)
  * HTML5 Media Framework by Mozilla. Includes a sophisticated event system and plugin architecture, Managing *track events* after initialisation is very complicated and in some cases not possible. The [HTMLNullVideoElement](https://github.com/mozilla/popcorn-js/blob/master/modules/player/popcorn.player.js) provides an abstraction of the native HTML5 media element API (similar to the IIIF A/V CanvasClock concept).
  * See also:
    * Popcorn Inception </br>https://github.com/brianchirls/popcorn-inception
      * Allows embedding PopcornJS instances inside each other (several levels deep), optionally synchronised with a main instance.
    * Popcorn Sequence </br>https://github.com/rwaldron/popcorn.sequence
      * Allows merging several clips into a playable sequence with unified timing controls. Supports in / out times (clipping sources) and manages buffering states of each clip.
* timingsrc (Timing Object Implementation) </br>https://github.com/webtiming/timingsrc
  * Last updated: 7 June 2017
  * JS implementation of the *Timing Object* specification. Mainly developed by one person, with a current focus on media synchronisation (same media source). The synchronisation is very reliable and deals with a number of edge cases, but there are no reliable test cases for sequencing and time offsets (apart from a [text-based proof of concept](http://webtiming.github.io/timingsrc/doc/exp_windowsequencer.html)).
  * See also:
    * [Documentation](http://webtiming.github.io/timingsrc/doc/index.html)

___


### Comparison of timing / event concepts and implementations

As there is no native implementation for timebased events, all JS implementations rely on  [window.requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame), [window.setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval) or the HTML5 media element > [timeupdate Event](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) (only possible if media element present) to regularly call updater / checker methods:

window.requestAnimationFrame()
* [Relevant line in MediaGroup JS](https://github.com/rwaldron/mediagroup.js/blob/master/src/mediagroup.js#L40)
* [Relevant line in Popcorn JS](https://github.com/mozilla/popcorn-js/blob/master/popcorn.js#L301) (with option to use native *timeupdate* event of the media element source)

window.setInterval()
* [Relevant line in Timesheets JS](https://github.com/timesheets/timesheets.js/blob/master/timesheets.js#L946)
* [Relevant line in timingsrc](https://github.com/webtiming/timingsrc/blob/gh-pages/lib/timingsrc-v2.js#L7322)


The same observation was made in
* [FrameTrail](https://frametrail.org) -> [relevant line](https://github.com/OpenHypervideo/FrameTrail/blob/master/player/modules/HypervideoController/module.js#L622) (window.setInterval)
* [Hyperaudio Pad](https://github.com/hyperaudio/hyperaudio-pad) -> [relevant line](https://github.com/hyperaudio/hyperaudio-pad/blob/master/build/hyperaudio-pad.js#L3452) (window.setInterval)

Based on the interval (or animation frame) frequency, the updater / checker methods are used to compare the current time with the start / end timings of synchronised elements.

The *requestAnimationFrame()* method provides high performance, but the frequency can't be controlled (unless additionally using a *window.setTimeout()* call to delay its execution). Using the *setInterval()* method provides two advantages: 1) the frequency in which the updater / checker methods are called can be set to a fixed number, 2) several intervals of varying frequencies can be used to deal with low and high priority tasks (while high priority tasks are executed more often).

