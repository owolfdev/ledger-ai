"use client";

import React from "react";
import Image from "next/image";

const CopyImageComponent = () => {
  const handleCopyImage = async () => {
    if (!navigator.clipboard || !window.ClipboardItem) {
      alert("Your browser does not support copying images to the clipboard.");
      return;
    }

    try {
      const imageUrl = "/images/sample-images/dog.jpg"; // Ensure image URL is correct
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch the image.");
      }

      const contentType = response.headers.get("Content-Type") || "image/png"; // Fallback to image/png
      const blob = await response.blob();

      const clipboardItem = new ClipboardItem({ [contentType]: blob });
      await navigator.clipboard.write([clipboardItem]);

      alert("Image copied to clipboard!");
    } catch (error) {
      console.error(error);
      alert("Failed to copy image. Your browser may not support this feature.");
    }
  };

  return (
    <div className="pb-6">
      <div className="px-6 py-6 bg-gray-900 flex flex-col gap-2 rounded">
        <p>Click the button to copy the image:</p>
        <div className="text-xl">Dog Image</div>
        <Image
          src="/images/sample-images/dog.jpg"
          alt="Dog"
          width={300}
          height={200}
        />
        <button type="button" onClick={handleCopyImage}>
          Copy Image
        </button>
      </div>
    </div>
  );
};

export default CopyImageComponent;
