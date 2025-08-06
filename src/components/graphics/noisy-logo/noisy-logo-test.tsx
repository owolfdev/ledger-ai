import React from "react";
//this is all commented out because it is not working

function NoisyLogoTester() {
  return <div>NoisyLogoTester</div>;
}

export default NoisyLogoTester;
// "use client"; // Ensures the component is client-side

// import { useEffect, useRef } from "react";

// export default function NoisyCircle() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const width = 300; // Set the size of the canvas
//     const height = 300;
//     canvas.width = width;
//     canvas.height = height;

//     // Function to generate noise using createImageData
//     function generateNoise() {
//       const imageData = ctx.createImageData(width, height);
//       for (let i = 0; i < imageData.data.length; i += 4) {
//         const value = Math.random() * 255; // Random grayscale value
//         imageData.data[i] = value; // Red
//         imageData.data[i + 1] = value; // Green
//         imageData.data[i + 2] = value; // Blue
//         imageData.data[i + 3] = 255; // Alpha (opacity)
//       }
//       return imageData;
//     }

//     // Function to clear the area outside the circle
//     function clearOutsideCircle() {
//       const radius = width / 2;
//       const centerX = width / 2;
//       const centerY = height / 2;

//       const imageData = ctx.getImageData(0, 0, width, height); // Get the current noise data
//       const data = imageData.data;

//       for (let x = 0; x < width; x++) {
//         for (let y = 0; y < height; y++) {
//           const dx = x - centerX;
//           const dy = y - centerY;
//           if (dx * dx + dy * dy > radius * radius) {
//             // If the pixel is outside the circle
//             const index = (y * width + x) * 4;
//             data[index + 3] = 0; // Set alpha to 0 (make the pixel transparent)
//           }
//         }
//       }

//       ctx.putImageData(imageData, 0, 0); // Update the canvas with the masked noise
//     }

//     // Function to render the noise within the circle
//     function render() {
//       ctx.clearRect(0, 0, width, height); // Clear the canvas before drawing

//       // Generate the noise across the entire canvas
//       const noiseData = generateNoise();
//       ctx.putImageData(noiseData, 0, 0); // Apply noise to the canvas

//       // Clear the noise outside the circular region
//       clearOutsideCircle();

//       requestAnimationFrame(render); // Request the next frame for animation
//     }

//     render(); // Start the rendering loop
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       className="block"
//       style={{ width: "300px", height: "300px" }}
//     />
//   );
// }
