//src/components/image/image-analyzer.tsx
"use client";
import { useState } from "react";

export default function ImageAnalyzer() {
  const [result, setResult] = useState("");
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/openai-image-analyze", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data.choices?.[0]?.message?.content || "No result.");
  };
  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <pre>{result}</pre>
    </div>
  );
}
