"use client";

import type React from "react";

interface IFrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  width?: string | number;
  minWidth?: string | number;
  aspectRatio?: string | number;
}

export const IFrame: React.FC<IFrameProps> = ({
  width = "100%",
  minWidth = "0",
  aspectRatio = "16/9",
  ...props
}) => {
  return (
    <div
      style={{
        width,
        minWidth,
        aspectRatio:
          typeof aspectRatio === "number" ? `${aspectRatio}` : aspectRatio,
        overflow: "hidden",
      }}
    >
      <iframe
        {...props}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
};
