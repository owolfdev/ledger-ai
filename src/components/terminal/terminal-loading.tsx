"use client";
import React, { useEffect, useState } from "react";

const loadingMessages = [
  "Loading data…",
  "Loading chat history…",
  "Loading terminal…",
];

const TYPING_SPEED = 35; // ms per character
const MESSAGE_PAUSE = 600; // ms pause after message is typed

export default function TerminalLoading() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Typing effect
  useEffect(() => {
    if (isPaused) return;
    const currentMsg = loadingMessages[msgIdx];
    if (charIdx < currentMsg.length) {
      const timeout = setTimeout(() => {
        setCharIdx((idx) => idx + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    }
    // When finished typing, trigger pause
    if (charIdx === currentMsg.length) {
      setIsPaused(true);
    }
  }, [charIdx, isPaused, msgIdx]);

  // Pause and advance effect
  useEffect(() => {
    if (!isPaused || charIdx !== loadingMessages[msgIdx].length) return;
    const timeout = setTimeout(() => {
      setCharIdx(0);
      setMsgIdx((idx) => (idx + 1) % loadingMessages.length);
      setIsPaused(false);
    }, MESSAGE_PAUSE);
    return () => clearTimeout(timeout);
  }, [isPaused, charIdx, msgIdx]);

  const display = loadingMessages[msgIdx].slice(0, charIdx);

  return (
    <div className="w-full flex">
      <span className="font-mono text-muted tracking-wide">
        {display}
        <span className="animate-pulse ml-1">▊</span>
      </span>
    </div>
  );
}
