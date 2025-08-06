// src/components/alerts/production-mode-alert.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export default function ProductionModeAlert() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check env var (set automatically by Vercel)
    const isProdEnv =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

    // Fallback: check for production host
    const isProdHost =
      typeof window !== "undefined" &&
      (window.location.hostname.endsWith(".vercel.app") ||
        window.location.hostname === "your-custom-domain.com"); // update as needed

    if (isProdEnv || isProdHost) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <Alert
      variant="destructive"
      className="mb-4 relative"
      // Add extra styling or border if needed
    >
      <AlertTitle className="flex items-center">
        <TriangleAlert className="h-5 w-5 text-yellow-500 mr-2 inline" />
        <span className="font-bold text-xl">Production Mode (Demo Only)</span>
      </AlertTitle>
      <AlertDescription>
        <div>
          You are attempting to edit in a production deployment of this app.
          This editor is desinged to create and edit static files on the{" "}
          <span className="font-bold">local file system</span>, and will only
          work in development mode. Changes will{" "}
          <span className="font-bold">NOT</span> affect the live deployed site.
        </div>
      </AlertDescription>
    </Alert>
  );
}
