// src/components/alerts/custom-alert.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

export function CustomAlert({ message }: { message: string }) {
  return (
    <div className=" px-4 py-2 my-2">
      ⚠️{" "}
      <ReactMarkdown
        components={{
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
}
