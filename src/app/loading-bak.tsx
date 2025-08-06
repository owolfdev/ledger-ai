"use client";
import { useEffect } from "react";
const bar = "Loading";

export default function Loading() {
  useEffect(() => {
    console.log("Loading mounted");
    return () => console.log("Loading unmounted");
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="p-36 font-mono text-2xl">
        {bar}
        <span className="inline-block animate-dots w-[3ch] overflow-hidden align-bottom">
          ...
        </span>
      </div>
      <style jsx>{`
        .animate-dots {
          animation: dots 1s steps(3, end) infinite;
        }
        @keyframes dots {
          to {
            width: 3ch;
          }
        }
      `}</style>
    </div>
  );
}
