"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ProgressPump() {
  const [progress, setProgress] = useState(10);

  const handlePump = () => {
    setProgress((prev) => (prev >= 100 ? 10 : Math.min(prev + 10, 100)));
  };

  return (
    <div className="flex flex-col items-start gap-4 p-6 w-full font-mono">
      <progress id="progress" value={progress} max={100} className="w-full h-5">
        {progress}%
      </progress>

      <Button
        variant="outline"
        onClick={handlePump}
        className="px-4 py-2 rounded"
      >
        Update Progress ({progress}%)
      </Button>

      {/* Simulated code output */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded w-full overflow-x-auto text-sm">
        <pre>
          {`<progress id="progress" value="${progress}" max="100">${progress}%</progress>`}
        </pre>
      </div>

      <style jsx>{`
        progress[value] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 1.25rem;
          border-radius: 0.375rem;
        }
        progress::-webkit-progress-bar {
          background-color: #e5e7eb;
          border-radius: 0.375rem;
        }
        progress::-webkit-progress-value {
          background-color: fuchsia;
          border-radius: 0.375rem;
        }
        progress::-moz-progress-bar {
          background-color: #3b82f6;
          border-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
}
