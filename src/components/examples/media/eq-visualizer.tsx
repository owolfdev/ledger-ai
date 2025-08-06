"use client";

import { useEffect, useRef } from "react";

type Props = {
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
};

export default function EQVisualizer({ analyser, dataArray }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !dataArray) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 32;
      const maxIndex = 64;
      const barWidth = canvas.width / barCount;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const logIndex = Math.floor(Math.pow(i / barCount, 2.0) * maxIndex);

        const raw = dataArray[logIndex];

        // 🔥 Nonlinear amplitude curve
        const scaled = Math.pow(raw / 255, 1.5); // Try 1.5–2.5
        const barHeight = scaled * canvas.height * 0.9;

        ctx.fillStyle = `rgb(${barHeight + 80}, 40, 120)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  }, [analyser, dataArray]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="rounded bg-black"
    />
  );
}
