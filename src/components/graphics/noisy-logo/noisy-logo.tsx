"use client"; // Ensures the component is client-side

import { useEffect, useRef } from "react";

export default function NoisyLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const width = 1378;
    const height = 562;
    canvas.width = width;
    canvas.height = height;

    function generateNoise() {
      const imageData = ctx?.createImageData(width, height);
      if (!imageData) return;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = Math.random() * 255;
        imageData.data[i] = value; // Red
        imageData.data[i + 1] = value; // Green
        imageData.data[i + 2] = value; // Blue
        imageData.data[i + 3] = 255; // Alpha (opacity)
      }
      ctx?.putImageData(imageData, 0, 0);
    }

    const render = () => {
      generateNoise();
      requestAnimationFrame(render);
    };

    render();
  }, []);

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg
      width="600"
      height="245"
      viewBox="0 0 1378 562"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }} // Prevent any potential margin issues
    >
      {/* Define the mask using the SVG logo */}
      <mask id="noise-mask">
        {/* Add a black border */}
        <rect width="100%" height="100%" fill="black" />
        {/* The white part for the mask content */}
        <rect width="98%" height="98%" fill="white" x="1%" y="1%" />
        <g
          transform="translate(0.000000,562.000000) scale(0.100000,-0.100000)"
          fill="black"
        >
          <path d="M0 2810 l0 -2810 6890 0 6890 0 0 2810 0 2810 -6890 0 -6890 0 0 -2810z m11960 1630 c102 -9 340 -46 348 -55 4 -3 -106 -556 -110 -560 -2 -2 -37 3 -78 11 -133 23 -204 15 -259 -32 -34 -28 -54 -103 -49 -176 l3 -43 208 -3 207 -2 0 -285 0 -285 -210 0 -210 0 0 -805 0 -805 -390 0 -390 0 0 805 0 805 -175 0 -175 0 0 285 0 285 175 0 175 0 0 78 c0 99 23 239 54 331 98 289 348 451 711 460 28 0 102 -4 165 -9z m-9471 -105 c542 -79 956 -432 1109 -945 55 -184 66 -279 66 -535 0 -255 -12 -353 -65 -533 -185 -633 -765 -1009 -1470 -952 -205 17 -346 53 -521 134 -219 102 -379 239 -516 444 -167 249 -244 538 -244 917 1 432 116 770 353 1041 185 210 486 374 772 419 56 9 109 18 117 19 46 10 307 4 399 -9z m1916 -47 c3 -13 63 -306 134 -653 121 -588 155 -778 214 -1210 17 -118 26 -161 30 -140 3 17 25 152 48 300 50 331 59 374 205 1015 64 283 126 558 138 610 l21 95 397 3 396 2 11 -47 c6 -27 64 -284 130 -573 148 -649 168 -752 228 -1137 l48 -307 22 164 c70 502 114 741 350 1873 l6 27 438 0 c242 0 439 -3 439 -7 0 -5 -172 -659 -382 -1455 l-383 -1448 -447 0 c-247 0-448 2 -448 5 0 2 -65 271 -145 597 -155 632 -214 905 -242 1116 -9 73 -20 132 -23 132 -3 0 -12 -53 -19 -117 -26 -242 -55 -377 -264 -1228 l-123 -500 -446 -3 -447 -2 -15 52 c-22 78 -756 2847 -756 2853 0 3 198 5 440 5 l440 0 5 -22z m6245 -1433 l0 -1455 -395 0 -395 0 0 1455 0 1455 395 0 395 0 0 -1455z m-1725 726 c437 -101 715 -401 797 -861 17 -97 16 -382 -1 -480 -40 -222 -137 -423 -275 -568 -45 -48 -162 -135 -237 -175 -303 -165 -784 -182 -1116 -39 -275 118 -467 340 -556 642 -39 132 -51 222 -51 390 0 226 33 384 115 557 65 136 156 248 275 338 131 99 280 165 449 198 121 24 136 25 330 22 137 -3 202 -9 270 -24z" />
          <path d="M2150 3651 c-230 -35 -383 -191 -457 -467 -25 -93 -26 -112 -26 -329 0 -217 1 -236 26 -328 40 -151 87 -239 171 -322 80 -79 129 -106 241 -135 147 -38 316 -18 446 51 108 58 202 180 253 331 81 241 69 650 -25 873 -44 103 -129 205 -215 258 -94 58 -277 88 -414 68z" />
          <path d="M8495 2996 c-136 -63 -207 -238 -207 -511 0 -339 105 -518 313 -533 60 -4 75 -1 124 22 113 56 180 184 205 393 21 169 -5 375 -60 483 -75 148 -237 211 -375 146z" />
        </g>
      </mask>

      {/* Embed the canvas inside the SVG using <foreignObject> */}
      <foreignObject width="100%" height="100%" mask="url(#noise-mask)">
        <canvas ref={canvasRef} className="w-full h-full" />
      </foreignObject>
    </svg>
  );
}
