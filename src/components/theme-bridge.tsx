// src/components/theme-bridge.tsx
"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { setThemeSetter } from "@/lib/theme-client";

export default function ThemeBridge() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setThemeSetter(setTheme);
  }, [setTheme]);
  return null;
}
