// components/VideoWithSubtitles.tsx
"use client";

import { useEffect, useRef } from "react";

export default function VideoWithSubtitles() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vttData = `
WEBVTT


00:00:18.700 --> 00:00:21.500
This blade has a dark past.

00:00:22.800 --> 00:00:26.800
It has shed much innocent blood.

00:00:29.000 --> 00:00:32.450
You're a fool for traveling alone,
so completely unprepared.

00:00:32.750 --> 00:00:35.800
You're lucky your blood's still flowing.

00:00:36.250 --> 00:00:37.300
Thank you.

00:00:38.500 --> 00:00:40.000
So...

00:00:40.400 --> 00:00:44.800
What brings you to
the land of the gatekeepers?

00:00:46.000 --> 00:00:48.500
I'm searching for someone.

00:00:49.000 --> 00:00:53.200
Someone very dear?
A kindred spirit?

00:00:54.400 --> 00:00:56.000
A dragon.

00:00:58.850 --> 00:01:01.750
A dangerous quest for a lone hunter.

00:01:02.950 --> 00:01:05.870
I've been alone for
as long as I can remember.

00:01:58.250 --> 00:01:59.500
We're almost done. Shhh...
    `.trim();

    const blob = new Blob([vttData], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);

    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = "English";
    track.srclang = "en";
    track.src = url;
    track.default = true;

    const video = videoRef.current;
    if (video) video.appendChild(track);
  }, []);

  return (
    <video
      ref={videoRef}
      controls
      width="640"
      poster="https://mohistory.org/molabplugins/videoviewer/sintel.jpg"
    >
      <source
        src="https://mohistory.org/molabplugins/videoviewer/sintel-short.mp4"
        type="video/mp4"
      />
    </video>
  );
}
