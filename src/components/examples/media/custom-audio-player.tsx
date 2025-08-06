"use client";

import { useRef, useState, useEffect } from "react";
import EQVisualizer from "./eq-visualizer";

export default function CustomAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const setupAudio = () => {
    if (audioCtxRef.current || !audioRef.current) return;

    const audio = audioRef.current;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaElementSource(audio);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    sourceRef.current = source;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      setupAudio();
    }

    await audioCtxRef.current?.resume();

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setCurrentTime(audio.currentTime);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", update);
      audioCtxRef.current?.close();
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-200 p-4 rounded-lg max-w-md">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <span className="text-sm text-gray-700">{formatTime(currentTime)}</span>
      </div>

      <EQVisualizer
        analyser={analyserRef.current}
        dataArray={dataArrayRef.current}
      />

      <audio ref={audioRef} src="/audio/SoundHelix-Song-1.mp3" preload="auto" />
    </div>
  );
}
