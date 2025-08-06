// src/components/terminal/CustomMDXComponents.tsx

import React from "react";

// Example custom MDX component
export function MyComponent({ message }: { message: string }) {
  return <span style={{ color: "tomato", fontWeight: "bold" }}>{message}</span>;
}

export const mdxComponents = {
  MyComponent,
  // Add more components as needed
};
