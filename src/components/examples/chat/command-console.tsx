"use client";

import { useState, useEffect } from "react";

const RESPONSES: Record<string, string> = {
  hello: `Hello! Type 'help' to see available commands.`,

  help: `Available commands:\n- help\n- about\n- contact\n- clear\n- short\n- medium\n- long`,

  about: `This is a simple demonstration of a command console component that uses a typewriter-style animation to render responses.
  
  Typing animations can greatly enhance perceived interactivity and responsiveness in user interfaces, even in basic terminal-like environments.
  
  This demo is written in React using functional components and hooks. It can easily be extended with additional commands, real-time data fetching, or even connected to a backend.
  
  Try typing 'help' to see available commands, or 'clear' to reset the console.`,

  contact: `Email: contact@example.com\nTwitter: @example`,

  short: `This is short.`,

  medium: `This is a medium-length message designed to demonstrate how each word appears one after the other with smooth timing, simulating a thoughtful typing pace.`,

  long: `This is a long-form demonstration designed to show how sentence-based rendering improves readability and performance.
  
  When a message exceeds a certain length, typing each individual character becomes tedious and unnecessary. Instead, we chunk the message into sentences and display them with a natural delay.
  
  This balances responsiveness with user experience, especially in UIs where content is meant to be skimmed or understood quickly, like help messages or documentation previews.`,

  verylong: `This is a very long message designed to demonstrate how sentence-based rendering improves readability and performance.
  
  When a message exceeds a certain length, typing each individual character becomes tedious and unnecessary. Instead, we chunk the message into sentences and display them with a natural delay.
  
  This balances responsiveness with user experience, especially in UIs where content is meant to be skimmed or understood quickly, like help messages or documentation previews.
  
  This is a very long message designed to demonstrate how sentence-based rendering improves readability and performance.
  
  When a message exceeds a certain length, typing each individual character becomes tedious and unnecessary. Instead, we chunk the message into sentences and display them with a natural delay.
  
  This balances responsiveness with user experience, especially in UIs where content is meant to be skimmed or understood quickly, like help messages or documentation previews. This is a very long message designed to demonstrate how sentence-based rendering improves readability and performance. When a message exceeds a certain length, typing each individual character becomes tedious and unnecessary. Instead, we chunk the message into sentences and display them with a natural delay. This balances responsiveness with user experience, especially in UIs where content is meant to be skimmed or understood quickly, like help messages or documentation previews. This is a very long message designed to demonstrate how sentence-based rendering improves readability and performance. When a message exceeds a certain length, typing each individual character becomes tedious and unnecessary. Instead, we chunk the message into sentences and display them with a natural delay. This balances responsiveness with user experience, especially in UIs where content is meant to be skimmed or understood quickly, like help messages or documentation previews.`,
};

type Line = { type: "input" | "output"; content: string };

export default function CommandConsole() {
  const [history, setHistory] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingOutput, setPendingOutput] = useState("");

  type TypingMode = "char" | "word" | "sentence";

  function getTypingMode(content: string): TypingMode {
    if (content.length > 400) return "sentence";
    if (content.length > 100) return "word";
    return "char";
  }

  // Initial welcome message on mount
  useEffect(() => {
    const welcome =
      "Welcome to the command console. This demonstrates responses rendered with a typewriter-style style animation. You can type in commands like 'help', 'about', or 'contact' to see the effect.";
    setIsTyping(true);
    setPendingOutput(welcome);
  }, []);

  function handleCommand(command: string) {
    if (command === "clear") {
      setHistory([]);
      return;
    }

    const response = RESPONSES[command] || `Command not found: ${command}`;
    setIsTyping(true);
    setPendingOutput(response);
    setHistory((h) => [...h, { type: "input", content: command }]);
  }

  // Typing animation effect
  useEffect(() => {
    if (!isTyping || !pendingOutput) return;

    const mode = getTypingMode(pendingOutput);
    let parts: string[] = [];

    switch (mode) {
      case "word":
        parts = pendingOutput.split(" ");
        break;
      case "sentence":
        parts = pendingOutput.match(/[^.!?]+[.!?]?/g) || [];
        break;
      default:
        parts = pendingOutput.split("");
    }

    let index = 0;

    const interval = setInterval(
      () => {
        setHistory((prev) => {
          const last = prev[prev.length - 1];
          const joined = parts
            .slice(0, index + 1)
            .join(mode === "char" ? "" : " ");
          const updated = [...prev];

          if (last?.type === "output") {
            updated[updated.length - 1].content = joined;
          } else {
            updated.push({ type: "output", content: joined });
          }

          return updated;
        });

        index++;
        if (index >= parts.length) {
          clearInterval(interval);
          setIsTyping(false);
          setPendingOutput("");
        }
      },
      mode === "sentence" ? 150 : mode === "word" ? 50 : 20
    ); // Adjust speed per mode

    return () => clearInterval(interval);
  }, [isTyping, pendingOutput]);

  return (
    <div className="bg-black text-white p-4 font-mono overflow-y-auto rounded-lg">
      {history.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {line.type === "input" ? `> ${line.content}` : line.content}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() === "" || isTyping) return;
          handleCommand(input.trim());
          setInput("");
        }}
        className="mt-2 flex items-center gap-2"
      >
        <span className="text-green-500">{">"}</span>{" "}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-black border-none outline-none text-white w-full"
          autoFocus
        />
      </form>
    </div>
  );
}
