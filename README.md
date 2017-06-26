Test fixtures to investigate technical challenges of IIIF-AV

See https://docs.google.com/document/d/1lcef8tjqfzBqRSmWLkJZ46Pj0pm8nSD11hbCAd7Hqxg/edit

1.	[Gapless audio playback](https://digirati-co-uk.github.io/iiif-av-bl/bl/01_gapless_audio.json). One IIIF canvas with three annotations with audio content, that must be played in sequence with no gap.
2.	[Gapless video playback](https://digirati-co-uk.github.io/iiif-av-bl/bl/02_gapless_video.json). One IIIF canvas with three annotations with video content, that must be played in sequence with no gap.
3.	[Synchronised video example](https://digirati-co-uk.github.io/iiif-av-bl/bl/03_synchronised_video.json). Videos playing at the same time. The source videos contain markers to demonstrate the synchronisation points. One IIIF canvas annotated with three videos.
4.	[Synchronised audio and video example](https://digirati-co-uk.github.io/iiif-av-bl/bl/04_synchronised_av.json). Audio soundtrack aligned to playing video.
5.	[Video synchronised with gapless audio, text](https://digirati-co-uk.github.io/iiif-av-bl/bl/05_synchronised_av_text.json) that includes gapless join of two audio tracks. Timed text annotations appear throughout including at the same time as the gap transition
6.	[_Fire_](https://tomcrane.github.io/fire/manifest3.json). Images, video and text
7.	[_Mahler 3_](http://dlib.indiana.edu/iiif_av/mahler-symphony-3/mahler-symphony-3.json) from Indiana showing range navigation. There are two canvases in this example, each representing a CD. The range metadata provides the navigation.
8.	[_Lunchroom manners_](http://dlib.indiana.edu/iiif_av/lunchroom_manners/lunchroom_manners.json) from Indiana showing range navigation in a video.
9.	_Pop goes the weasel_ from the British Library showing range navigation of audio.

Later - verify approach works with mixture of file formats, and MPEG-DASH/HLS

See https://github.com/IIIF/iiif-av/blob/master/source/api/av/index.md for model discussion.

Two additional useful fixtures:

* [simplest time-based canvas](https://digirati-co-uk.github.io/iiif-av-bl/iiif/02.json) - Shows an image for part of the duration of a canvas.
* [parts of media annotated onto different canvas](https://digirati-co-uk.github.io/iiif-av-bl/iiif/16.json) - Example - divide a performance up into scenes on different canvases.

