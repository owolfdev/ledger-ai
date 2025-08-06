import React from "react";

export default function ExamplePlayer({
  type,
  src,
  poster,
}: {
  type: string;
  src: string;
  poster?: string;
}) {
  if (type === "audio") {
    return (
      <audio controls preload="auto" style={{ width: "100%" }}>
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    );
  }

  if (type === "video") {
    return (
      <video
        controls
        preload="metadata"
        poster={poster}
        style={{ width: "100%", maxWidth: 640 }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video element.
      </video>
    );
  }

  return <p>Unsupported media type.</p>;
}
