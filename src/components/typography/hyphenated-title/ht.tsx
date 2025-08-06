// components/HyphenatedTitle.tsx
"use client";

import { useEffect, useState } from "react";

function insertSoftHyphens(text: string): string {
  // Insert a soft hyphen every ~6 letters
  return text.replace(/([a-z]{6})(?=[a-z])/gi, "$1&shy;");
}

export default function HyphenatedTitle({ title }: { title: string }) {
  const [useHyphens, setUseHyphens] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setUseHyphens(true);
    }
  }, []);

  return useHyphens ? (
    <h1
      className="text-5xl font-sans font-black mb-1 text-primary break-words hyphens-manual sm:hyphens-none"
      lang="en"
      dangerouslySetInnerHTML={{ __html: insertSoftHyphens(title) }}
    />
  ) : (
    <h1 className="sm:text-6xl text-5xl font-sans font-black mb-1 text-primary break-words">
      {title}
    </h1>
  );
}
