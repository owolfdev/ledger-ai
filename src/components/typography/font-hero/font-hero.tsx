"use client";

import { csNoireLight } from "./fonts";

interface FontHeroProps {
  text: string;
  size?: number; // in rem
  className?: string;
}

export default function FontHero({
  text,
  size = 6, // default to 6rem
  className = "",
}: FontHeroProps) {
  return (
    <h1
      className={`${csNoireLight.className} ${className}`}
      style={{ fontSize: `${size}rem` }}
    >
      {text}
    </h1>
  );
}
