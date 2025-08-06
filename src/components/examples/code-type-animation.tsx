"use client";
import { useState, useRef, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";

// Type definition for a code block
interface CodeBlock {
  time: number;
  content: string;
  delay: number;
}

// Code block configuration
const codeBlocks: CodeBlock[] = [
  {
    time: 1000,
    content: `
import { createApiClient } from "./apiClient";
import { getSession } from "./sessionHandler";

export async function initializeClient() {
  const session = await getSession();

  return createApiClient(
    process.env.API_BASE_URL ?? "https://default.api.url",
    process.env.API_KEY ?? "default_api_key",
    {
      sessionData: {
        getAll: () => session.getAllSessionData(),
        setAll: (dataToSet) => {
          for (const { key, value, options } of dataToSet) {
            session.setSessionData(key, value, options);
          }
        },
        clear: () => session.clearAllData(),
      },
    }
  );
}
    `,
    delay: 50,
  },
];

// Function to type each character in the content
async function typeCode(
  content: string,
  delay: number,
  onUpdate: (newText: string) => void
): Promise<void> {
  for (let index = 0; index < content.length; index++) {
    onUpdate(content.slice(0, index + 1));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// Helper function to calculate the total estimated time for animation
// function calculateTotalAnimationTime(codeBlocks: CodeBlock[]): number {
//   const totalCharacters = codeBlocks.reduce(
//     (sum, block) => sum + block.content.length,
//     0
//   );
//   const totalDelay = codeBlocks.reduce((sum, block) => sum + block.time, 0);
//   const typingTime = totalCharacters * codeBlocks[0].delay;
//   return (totalDelay + typingTime) / 1000; // Convert to seconds
// }

export default function CodeAnimation() {
  const [displayedCode, setDisplayedCode] = useState<{ text: string }[]>([]);
  const [started, setStarted] = useState<boolean>(false);
  // const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the audio object
    typingSoundRef.current = new Audio("/audio/typing.mp3");
  }, []);

  // const totalEstimatedTime = calculateTotalAnimationTime(codeBlocks);

  // Timer management functions
  const startTimer = () => {
    timerRef.current = setInterval(
      // () => setElapsedTime((prev) => prev + 1)
      () => {},
      1000
    );
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Function to start the animation
  const startAnimation = () => {
    setStarted(true);
    // setElapsedTime(0);
    startTimer();

    // Play typing sound
    if (typingSoundRef.current) {
      typingSoundRef.current.loop = true; // Loop the sound while typing
      typingSoundRef.current.play().catch((err) => {
        console.error("Error playing sound:", err);
      });
    }

    codeBlocks.forEach((block, idx) => {
      setTimeout(async () => {
        setDisplayedCode((prev) => [...prev, { text: "" }]);

        await typeCode(block.content, block.delay, (newText) =>
          setDisplayedCode((prev) => {
            const updatedBlocks = [...prev];
            updatedBlocks[idx].text = newText;
            return updatedBlocks;
          })
        );

        if (idx === codeBlocks.length - 1) {
          // Stop the typing sound when the animation completes
          if (typingSoundRef.current) {
            typingSoundRef.current.pause();
            typingSoundRef.current.currentTime = 0; // Reset for next play
          }
          stopTimer();
        }
      }, block.time);
    });
  };

  return (
    <div className="flex flex-col items-center mb-5">
      <div className="flex items-center mx-auto w-full h-auto">
        <div className="code-animation-container w-full rounded-lg font-mono mx-auto text-center text-base sm:text-lg md:text-lg mb-5">
          {started ? (
            displayedCode.map((block, idx) => (
              <SyntaxHighlighter
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                key={idx}
                language="javascript"
                style={darcula}
                className="custom-syntax-highlighter"
                wrapLongLines // Add this prop to enable line wrapping
              >
                {block.text}
              </SyntaxHighlighter>
            ))
          ) : (
            <div className="flex justify-center py-5 pt-10">
              <button
                type="button"
                onClick={startAnimation}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Start Text Animation Example
              </button>
            </div>
          )}
          <style jsx>{`
            :global(.custom-syntax-highlighter pre),
            :global(.custom-syntax-highlighter code),
            :global(.custom-syntax-highlighter) {
              background: none !important;
              word-wrap: break-word; /* Ensure long lines wrap */
              overflow-wrap: break-word; /* Ensure content wraps within the container */
              white-space: pre-wrap; /* Allow text to wrap */
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
