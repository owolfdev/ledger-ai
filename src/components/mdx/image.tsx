"use client";

import { useState } from "react";
import NextImage from "next/image";

const Image = ({
  src,
  alt,
  width = 2000,
  height = 1000,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const aspectRatio = height / width; // Calculate aspect ratio

  return (
    <div className="w-full mb-4">
      <div
        className="relative w-full"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
      >
        {/* Skeleton Loader */}
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Next.js Image (maintains aspect ratio) */}
        <NextImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{ objectFit: "cover" }}
          onLoadingComplete={() => setIsLoading(false)}
        />
      </div>

      {/* Caption (now properly positioned below the image) */}
      {caption && (
        <div className="text-sm text-muted-foreground mt-2 ">{caption}</div>
      )}
    </div>
  );
};

export default Image;
