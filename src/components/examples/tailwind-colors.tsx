"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";

const colors = [
  {
    name: "slate",
    variants: [
      { name: "slate-50", tailwindClass: "bg-slate-50", hex: "#f8fafc" },
      { name: "slate-100", tailwindClass: "bg-slate-100", hex: "#f1f5f9" },
      { name: "slate-200", tailwindClass: "bg-slate-200", hex: "#e2e8f0" },
      { name: "slate-300", tailwindClass: "bg-slate-300", hex: "#cbd5e1" },
      { name: "slate-400", tailwindClass: "bg-slate-400", hex: "#94a3b8" },
      { name: "slate-500", tailwindClass: "bg-slate-500", hex: "#64748b" },
      { name: "slate-600", tailwindClass: "bg-slate-600", hex: "#475569" },
      { name: "slate-700", tailwindClass: "bg-slate-700", hex: "#334155" },
      { name: "slate-800", tailwindClass: "bg-slate-800", hex: "#1e293b" },
      { name: "slate-900", tailwindClass: "bg-slate-900", hex: "#0f172a" },
    ],
  },
  {
    name: "gray",
    variants: [
      { name: "gray-50", tailwindClass: "bg-gray-50", hex: "#f9fafb" },
      { name: "gray-100", tailwindClass: "bg-gray-100", hex: "#f3f4f6" },
      { name: "gray-200", tailwindClass: "bg-gray-200", hex: "#e5e7eb" },
      { name: "gray-300", tailwindClass: "bg-gray-300", hex: "#d1d5db" },
      { name: "gray-400", tailwindClass: "bg-gray-400", hex: "#9ca3af" },
      { name: "gray-500", tailwindClass: "bg-gray-500", hex: "#6b7280" },
      { name: "gray-600", tailwindClass: "bg-gray-600", hex: "#4b5563" },
      { name: "gray-700", tailwindClass: "bg-gray-700", hex: "#374151" },
      { name: "gray-800", tailwindClass: "bg-gray-800", hex: "#1f2937" },
      { name: "gray-900", tailwindClass: "bg-gray-900", hex: "#111827" },
    ],
  },
  {
    name: "zinc",
    variants: [
      { name: "zinc-50", tailwindClass: "bg-zinc-50", hex: "#fafafa" },
      { name: "zinc-100", tailwindClass: "bg-zinc-100", hex: "#f4f4f5" },
      { name: "zinc-200", tailwindClass: "bg-zinc-200", hex: "#e4e4e7" },
      { name: "zinc-300", tailwindClass: "bg-zinc-300", hex: "#d4d4d8" },
      { name: "zinc-400", tailwindClass: "bg-zinc-400", hex: "#a1a1aa" },
      { name: "zinc-500", tailwindClass: "bg-zinc-500", hex: "#71717a" },
      { name: "zinc-600", tailwindClass: "bg-zinc-600", hex: "#52525b" },
      { name: "zinc-700", tailwindClass: "bg-zinc-700", hex: "#3f3f46" },
      { name: "zinc-800", tailwindClass: "bg-zinc-800", hex: "#27272a" },
      { name: "zinc-900", tailwindClass: "bg-zinc-900", hex: "#18181b" },
    ],
  },
  {
    name: "neutral",
    variants: [
      { name: "neutral-50", tailwindClass: "bg-neutral-50", hex: "#fafafa" },
      { name: "neutral-100", tailwindClass: "bg-neutral-100", hex: "#f5f5f5" },
      { name: "neutral-200", tailwindClass: "bg-neutral-200", hex: "#e5e5e5" },
      { name: "neutral-300", tailwindClass: "bg-neutral-300", hex: "#d4d4d4" },
      { name: "neutral-400", tailwindClass: "bg-neutral-400", hex: "#a3a3a3" },
      { name: "neutral-500", tailwindClass: "bg-neutral-500", hex: "#737373" },
      { name: "neutral-600", tailwindClass: "bg-neutral-600", hex: "#525252" },
      { name: "neutral-700", tailwindClass: "bg-neutral-700", hex: "#404040" },
      { name: "neutral-800", tailwindClass: "bg-neutral-800", hex: "#262626" },
      { name: "neutral-900", tailwindClass: "bg-neutral-900", hex: "#171717" },
    ],
  },
  {
    name: "stone",
    variants: [
      { name: "stone-50", tailwindClass: "bg-stone-50", hex: "#fafaf9" },
      { name: "stone-100", tailwindClass: "bg-stone-100", hex: "#f5f5f4" },
      { name: "stone-200", tailwindClass: "bg-stone-200", hex: "#e7e5e4" },
      { name: "stone-300", tailwindClass: "bg-stone-300", hex: "#d6d3d1" },
      { name: "stone-400", tailwindClass: "bg-stone-400", hex: "#a8a29e" },
      { name: "stone-500", tailwindClass: "bg-stone-500", hex: "#78716c" },
      { name: "stone-600", tailwindClass: "bg-stone-600", hex: "#57534e" },
      { name: "stone-700", tailwindClass: "bg-stone-700", hex: "#44403c" },
      { name: "stone-800", tailwindClass: "bg-stone-800", hex: "#292524" },
      { name: "stone-900", tailwindClass: "bg-stone-900", hex: "#1c1917" },
    ],
  },
  {
    name: "red",
    variants: [
      { name: "red-50", tailwindClass: "bg-red-50", hex: "#fef2f2" },
      { name: "red-100", tailwindClass: "bg-red-100", hex: "#fee2e2" },
      { name: "red-200", tailwindClass: "bg-red-200", hex: "#fecaca" },
      { name: "red-300", tailwindClass: "bg-red-300", hex: "#fca5a5" },
      { name: "red-400", tailwindClass: "bg-red-400", hex: "#f87171" },
      { name: "red-500", tailwindClass: "bg-red-500", hex: "#ef4444" },
      { name: "red-600", tailwindClass: "bg-red-600", hex: "#dc2626" },
      { name: "red-700", tailwindClass: "bg-red-700", hex: "#b91c1c" },
      { name: "red-800", tailwindClass: "bg-red-800", hex: "#991b1b" },
      { name: "red-900", tailwindClass: "bg-red-900", hex: "#7f1d1d" },
    ],
  },
  {
    name: "orange",
    variants: [
      { name: "orange-50", tailwindClass: "bg-orange-50", hex: "#fff7ed" },
      { name: "orange-100", tailwindClass: "bg-orange-100", hex: "#ffedd5" },
      { name: "orange-200", tailwindClass: "bg-orange-200", hex: "#fed7aa" },
      { name: "orange-300", tailwindClass: "bg-orange-300", hex: "#fdba74" },
      { name: "orange-400", tailwindClass: "bg-orange-400", hex: "#fb923c" },
      { name: "orange-500", tailwindClass: "bg-orange-500", hex: "#f97316" },
      { name: "orange-600", tailwindClass: "bg-orange-600", hex: "#ea580c" },
      { name: "orange-700", tailwindClass: "bg-orange-700", hex: "#c2410c" },
      { name: "orange-800", tailwindClass: "bg-orange-800", hex: "#9a3412" },
      { name: "orange-900", tailwindClass: "bg-orange-900", hex: "#7c2d12" },
    ],
  },
  {
    name: "amber",
    variants: [
      { name: "amber-50", tailwindClass: "bg-amber-50", hex: "#fffbeb" },
      { name: "amber-100", tailwindClass: "bg-amber-100", hex: "#fef3c7" },
      { name: "amber-200", tailwindClass: "bg-amber-200", hex: "#fde68a" },
      { name: "amber-300", tailwindClass: "bg-amber-300", hex: "#fcd34d" },
      { name: "amber-400", tailwindClass: "bg-amber-400", hex: "#fbbf24" },
      { name: "amber-500", tailwindClass: "bg-amber-500", hex: "#f59e0b" },
      { name: "amber-600", tailwindClass: "bg-amber-600", hex: "#d97706" },
      { name: "amber-700", tailwindClass: "bg-amber-700", hex: "#b45309" },
      { name: "amber-800", tailwindClass: "bg-amber-800", hex: "#92400e" },
      { name: "amber-900", tailwindClass: "bg-amber-900", hex: "#78350f" },
    ],
  },

  {
    name: "yellow",
    variants: [
      { name: "yellow-50", tailwindClass: "bg-yellow-50", hex: "#fefce8" },
      { name: "yellow-100", tailwindClass: "bg-yellow-100", hex: "#fef9c3" },
      { name: "yellow-200", tailwindClass: "bg-yellow-200", hex: "#fef08a" },
      { name: "yellow-300", tailwindClass: "bg-yellow-300", hex: "#fde047" },
      { name: "yellow-400", tailwindClass: "bg-yellow-400", hex: "#facc15" },
      { name: "yellow-500", tailwindClass: "bg-yellow-500", hex: "#eab308" },
      { name: "yellow-600", tailwindClass: "bg-yellow-600", hex: "#ca8a04" },
      { name: "yellow-700", tailwindClass: "bg-yellow-700", hex: "#a16207" },
      { name: "yellow-800", tailwindClass: "bg-yellow-800", hex: "#854d0e" },
      { name: "yellow-900", tailwindClass: "bg-yellow-900", hex: "#713f12" },
    ],
  },
  {
    name: "lime",
    variants: [
      { name: "lime-50", tailwindClass: "bg-lime-50", hex: "#f7fee7" },
      { name: "lime-100", tailwindClass: "bg-lime-100", hex: "#ecfccb" },
      { name: "lime-200", tailwindClass: "bg-lime-200", hex: "#d9f99d" },
      { name: "lime-300", tailwindClass: "bg-lime-300", hex: "#bef264" },
      { name: "lime-400", tailwindClass: "bg-lime-400", hex: "#a3e635" },
      { name: "lime-500", tailwindClass: "bg-lime-500", hex: "#84cc16" },
      { name: "lime-600", tailwindClass: "bg-lime-600", hex: "#65a30d" },
      { name: "lime-700", tailwindClass: "bg-lime-700", hex: "#4d7c0f" },
      { name: "lime-800", tailwindClass: "bg-lime-800", hex: "#3f6212" },
      { name: "lime-900", tailwindClass: "bg-lime-900", hex: "#365314" },
    ],
  },
  {
    name: "green",
    variants: [
      { name: "green-50", tailwindClass: "bg-green-50", hex: "#f0fdf4" },
      { name: "green-100", tailwindClass: "bg-green-100", hex: "#dcfce7" },
      { name: "green-200", tailwindClass: "bg-green-200", hex: "#bbf7d0" },
      { name: "green-300", tailwindClass: "bg-green-300", hex: "#86efac" },
      { name: "green-400", tailwindClass: "bg-green-400", hex: "#4ade80" },
      { name: "green-500", tailwindClass: "bg-green-500", hex: "#22c55e" },
      { name: "green-600", tailwindClass: "bg-green-600", hex: "#16a34a" },
      { name: "green-700", tailwindClass: "bg-green-700", hex: "#15803d" },
      { name: "green-800", tailwindClass: "bg-green-800", hex: "#166534" },
      { name: "green-900", tailwindClass: "bg-green-900", hex: "#14532d" },
    ],
  },
  {
    name: "emerald",
    variants: [
      { name: "emerald-50", tailwindClass: "bg-emerald-50", hex: "#ecfdf5" },
      { name: "emerald-100", tailwindClass: "bg-emerald-100", hex: "#d1fae5" },
      { name: "emerald-200", tailwindClass: "bg-emerald-200", hex: "#a7f3d0" },
      { name: "emerald-300", tailwindClass: "bg-emerald-300", hex: "#6ee7b7" },
      { name: "emerald-400", tailwindClass: "bg-emerald-400", hex: "#34d399" },
      { name: "emerald-500", tailwindClass: "bg-emerald-500", hex: "#10b981" },
      { name: "emerald-600", tailwindClass: "bg-emerald-600", hex: "#059669" },
      { name: "emerald-700", tailwindClass: "bg-emerald-700", hex: "#047857" },
      { name: "emerald-800", tailwindClass: "bg-emerald-800", hex: "#065f46" },
      { name: "emerald-900", tailwindClass: "bg-emerald-900", hex: "#064e3b" },
    ],
  },
  {
    name: "teal",
    variants: [
      { name: "teal-50", tailwindClass: "bg-teal-50", hex: "#f0fdfa" },
      { name: "teal-100", tailwindClass: "bg-teal-100", hex: "#ccfbf1" },
      { name: "teal-200", tailwindClass: "bg-teal-200", hex: "#99f6e4" },
      { name: "teal-300", tailwindClass: "bg-teal-300", hex: "#5eead4" },
      { name: "teal-400", tailwindClass: "bg-teal-400", hex: "#2dd4bf" },
      { name: "teal-500", tailwindClass: "bg-teal-500", hex: "#14b8a6" },
      { name: "teal-600", tailwindClass: "bg-teal-600", hex: "#0d9488" },
      { name: "teal-700", tailwindClass: "bg-teal-700", hex: "#0f766e" },
      { name: "teal-800", tailwindClass: "bg-teal-800", hex: "#115e59" },
      { name: "teal-900", tailwindClass: "bg-teal-900", hex: "#134e4a" },
    ],
  },
  {
    name: "cyan",
    variants: [
      { name: "cyan-50", tailwindClass: "bg-cyan-50", hex: "#ecfeff" },
      { name: "cyan-100", tailwindClass: "bg-cyan-100", hex: "#cffafe" },
      { name: "cyan-200", tailwindClass: "bg-cyan-200", hex: "#a5f3fc" },
      { name: "cyan-300", tailwindClass: "bg-cyan-300", hex: "#67e8f9" },
      { name: "cyan-400", tailwindClass: "bg-cyan-400", hex: "#22d3ee" },
      { name: "cyan-500", tailwindClass: "bg-cyan-500", hex: "#06b6d4" },
      { name: "cyan-600", tailwindClass: "bg-cyan-600", hex: "#0891b2" },
      { name: "cyan-700", tailwindClass: "bg-cyan-700", hex: "#0e7490" },
      { name: "cyan-800", tailwindClass: "bg-cyan-800", hex: "#155e75" },
      { name: "cyan-900", tailwindClass: "bg-cyan-900", hex: "#164e63" },
    ],
  },
  {
    name: "sky",
    variants: [
      { name: "sky-50", tailwindClass: "bg-sky-50", hex: "#f0f9ff" },
      { name: "sky-100", tailwindClass: "bg-sky-100", hex: "#e0f2fe" },
      { name: "sky-200", tailwindClass: "bg-sky-200", hex: "#bae6fd" },
      { name: "sky-300", tailwindClass: "bg-sky-300", hex: "#7dd3fc" },
      { name: "sky-400", tailwindClass: "bg-sky-400", hex: "#38bdf8" },
      { name: "sky-500", tailwindClass: "bg-sky-500", hex: "#0ea5e9" },
      { name: "sky-600", tailwindClass: "bg-sky-600", hex: "#0284c7" },
      { name: "sky-700", tailwindClass: "bg-sky-700", hex: "#0369a1" },
      { name: "sky-800", tailwindClass: "bg-sky-800", hex: "#075985" },
      { name: "sky-900", tailwindClass: "bg-sky-900", hex: "#0c4a6e" },
    ],
  },
  {
    name: "blue",
    variants: [
      { name: "blue-50", tailwindClass: "bg-blue-50", hex: "#eff6ff" },
      { name: "blue-100", tailwindClass: "bg-blue-100", hex: "#dbeafe" },
      { name: "blue-200", tailwindClass: "bg-blue-200", hex: "#bfdbfe" },
      { name: "blue-300", tailwindClass: "bg-blue-300", hex: "#93c5fd" },
      { name: "blue-400", tailwindClass: "bg-blue-400", hex: "#60a5fa" },
      { name: "blue-500", tailwindClass: "bg-blue-500", hex: "#3b82f6" },
      { name: "blue-600", tailwindClass: "bg-blue-600", hex: "#2563eb" },
      { name: "blue-700", tailwindClass: "bg-blue-700", hex: "#1d4ed8" },
      { name: "blue-800", tailwindClass: "bg-blue-800", hex: "#1e40af" },
      { name: "blue-900", tailwindClass: "bg-blue-900", hex: "#1e3a8a" },
    ],
  },
  {
    name: "indigo",
    variants: [
      { name: "indigo-50", tailwindClass: "bg-indigo-50", hex: "#eef2ff" },
      { name: "indigo-100", tailwindClass: "bg-indigo-100", hex: "#e0e7ff" },
      { name: "indigo-200", tailwindClass: "bg-indigo-200", hex: "#c7d2fe" },
      { name: "indigo-300", tailwindClass: "bg-indigo-300", hex: "#a5b4fc" },
      { name: "indigo-400", tailwindClass: "bg-indigo-400", hex: "#818cf8" },
      { name: "indigo-500", tailwindClass: "bg-indigo-500", hex: "#6366f1" },
      { name: "indigo-600", tailwindClass: "bg-indigo-600", hex: "#4f46e5" },
      { name: "indigo-700", tailwindClass: "bg-indigo-700", hex: "#4338ca" },
      { name: "indigo-800", tailwindClass: "bg-indigo-800", hex: "#3730a3" },
      { name: "indigo-900", tailwindClass: "bg-indigo-900", hex: "#312e81" },
    ],
  },
  {
    name: "violet",
    variants: [
      { name: "violet-50", tailwindClass: "bg-violet-50", hex: "#f5f3ff" },
      { name: "violet-100", tailwindClass: "bg-violet-100", hex: "#ede9fe" },
      { name: "violet-200", tailwindClass: "bg-violet-200", hex: "#ddd6fe" },
      { name: "violet-300", tailwindClass: "bg-violet-300", hex: "#c4b5fd" },
      { name: "violet-400", tailwindClass: "bg-violet-400", hex: "#a78bfa" },
      { name: "violet-500", tailwindClass: "bg-violet-500", hex: "#8b5cf6" },
      { name: "violet-600", tailwindClass: "bg-violet-600", hex: "#7c3aed" },
      { name: "violet-700", tailwindClass: "bg-violet-700", hex: "#6d28d9" },
      { name: "violet-800", tailwindClass: "bg-violet-800", hex: "#5b21b6" },
      { name: "violet-900", tailwindClass: "bg-violet-900", hex: "#4c1d95" },
    ],
  },
  {
    name: "purple",
    variants: [
      { name: "purple-50", tailwindClass: "bg-purple-50", hex: "#faf5ff" },
      { name: "purple-100", tailwindClass: "bg-purple-100", hex: "#f3e8ff" },
      { name: "purple-200", tailwindClass: "bg-purple-200", hex: "#e9d5ff" },
      { name: "purple-300", tailwindClass: "bg-purple-300", hex: "#d8b4fe" },
      { name: "purple-400", tailwindClass: "bg-purple-400", hex: "#c084fc" },
      { name: "purple-500", tailwindClass: "bg-purple-500", hex: "#a855f7" },
      { name: "purple-600", tailwindClass: "bg-purple-600", hex: "#9333ea" },
      { name: "purple-700", tailwindClass: "bg-purple-700", hex: "#7e22ce" },
      { name: "purple-800", tailwindClass: "bg-purple-800", hex: "#6b21a8" },
      { name: "purple-900", tailwindClass: "bg-purple-900", hex: "#581c87" },
    ],
  },
  {
    name: "fuchsia",
    variants: [
      { name: "fuchsia-50", tailwindClass: "bg-fuchsia-50", hex: "#fdf4ff" },
      { name: "fuchsia-100", tailwindClass: "bg-fuchsia-100", hex: "#fae8ff" },
      { name: "fuchsia-200", tailwindClass: "bg-fuchsia-200", hex: "#f5d0fe" },
      { name: "fuchsia-300", tailwindClass: "bg-fuchsia-300", hex: "#f0abfc" },
      { name: "fuchsia-400", tailwindClass: "bg-fuchsia-400", hex: "#e879f9" },
      { name: "fuchsia-500", tailwindClass: "bg-fuchsia-500", hex: "#d946ef" },
      { name: "fuchsia-600", tailwindClass: "bg-fuchsia-600", hex: "#c026d3" },
      { name: "fuchsia-700", tailwindClass: "bg-fuchsia-700", hex: "#a21caf" },
      { name: "fuchsia-800", tailwindClass: "bg-fuchsia-800", hex: "#86198f" },
      { name: "fuchsia-900", tailwindClass: "bg-fuchsia-900", hex: "#701a75" },
    ],
  },
  {
    name: "pink",
    variants: [
      { name: "pink-50", tailwindClass: "bg-pink-50", hex: "#fdf2f8" },
      { name: "pink-100", tailwindClass: "bg-pink-100", hex: "#fce7f3" },
      { name: "pink-200", tailwindClass: "bg-pink-200", hex: "#fbcfe8" },
      { name: "pink-300", tailwindClass: "bg-pink-300", hex: "#f9a8d4" },
      { name: "pink-400", tailwindClass: "bg-pink-400", hex: "#f472b6" },
      { name: "pink-500", tailwindClass: "bg-pink-500", hex: "#ec4899" },
      { name: "pink-600", tailwindClass: "bg-pink-600", hex: "#db2777" },
      { name: "pink-700", tailwindClass: "bg-pink-700", hex: "#be185d" },
      { name: "pink-800", tailwindClass: "bg-pink-800", hex: "#9d174d" },
      { name: "pink-900", tailwindClass: "bg-pink-900", hex: "#831843" },
    ],
  },
  {
    name: "rose",
    variants: [
      { name: "rose-50", tailwindClass: "bg-rose-50", hex: "#fff1f2" },
      { name: "rose-100", tailwindClass: "bg-rose-100", hex: "#ffe4e6" },
      { name: "rose-200", tailwindClass: "bg-rose-200", hex: "#fecdd3" },
      { name: "rose-300", tailwindClass: "bg-rose-300", hex: "#fda4af" },
      { name: "rose-400", tailwindClass: "bg-rose-400", hex: "#fb7185" },
      { name: "rose-500", tailwindClass: "bg-rose-500", hex: "#f43f5e" },
      { name: "rose-600", tailwindClass: "bg-rose-600", hex: "#e11d48" },
      { name: "rose-700", tailwindClass: "bg-rose-700", hex: "#be123c" },
      { name: "rose-800", tailwindClass: "bg-rose-800", hex: "#9f1239" },
      { name: "rose-900", tailwindClass: "bg-rose-900", hex: "#881337" },
    ],
  },
];

const getTextColor = (shade: string) => {
  const darkShades = ["600", "700", "800", "900"];
  return darkShades.some((shadeLevel) => shade.endsWith(shadeLevel))
    ? "text-white"
    : "text-black";
};

const RedColorSwatches = () => {
  const { toast } = useToast();

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard.`,
          duration: 2000,
        });
      },
      (err) => {
        toast({
          title: "Error",
          description: `Failed to copy ${label}. ${err}`,
          variant: "destructive",
          duration: 2000,
        });
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {colors.map((color) => (
        <div key={color.name} className="flex flex-col gap-1">
          <h2 className="text-lg font-bold capitalize">{color.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {color.variants.map((variant) => (
              <div
                key={variant.name}
                className={`p-4 flex flex-col gap-1 items-center justify-center text-sm rounded-lg ${variant.tailwindClass}`}
                style={{ height: "80px" }}
              >
                <span
                  className={`${getTextColor(
                    variant.name
                  )} font-bold cursor-pointer`}
                  onClick={() =>
                    handleCopyToClipboard(variant.name, "Color Name")
                  }
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCopyToClipboard(variant.name, "Color Name");
                    }
                  }}
                >
                  {variant.name}
                </span>
                <span
                  className={`${getTextColor(variant.name)} cursor-pointer`}
                  onClick={() => handleCopyToClipboard(variant.hex, "Hex Code")}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCopyToClipboard(variant.hex, "Hex Code");
                    }
                  }}
                >
                  {variant.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RedColorSwatches;
