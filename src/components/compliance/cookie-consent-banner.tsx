// src/components/compliance/cookie-consent-banner.tsx
"use client";

import { useState } from "react";
import CustomLink from "@/components/mdx/custom-link"; // Use your trusted link
import { cn } from "@/utils/cn"; // If you use a classNames util (optional)

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
  privacyPolicyUrl?: string;
}

export default function CookieConsentBanner({
  onAccept,
  onReject,
  privacyPolicyUrl = "/privacy",
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    setIsVisible(false);
    onReject?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card text-foreground border-t border-border font-mono text-sm"
      )}
      role="banner"
      aria-label="Cookie consent banner"
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Monaco-style code-text content */}
          <div className="flex-1">
            <p className="leading-6">
              <span className="text-accent">{`// `}</span>
              <span>
                We use{" "}
                <span className="text-primary font-semibold">cookies</span> to
                improve your experience.{" "}
              </span>
              <CustomLink
                href={privacyPolicyUrl}
                aria-label="Read our privacy policy"
              >
                Read our privacy policy
              </CustomLink>
              <span>.</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:ml-6">
            <button
              onClick={handleReject}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded min-w-[80px]",
                "bg-muted text-muted-foreground border border-border",
                "hover:bg-muted/70 hover:border-accent",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                "transition-colors duration-200"
              )}
              aria-label="Reject cookies"
              type="button"
            >
              reject()
            </button>
            <button
              onClick={handleAccept}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded min-w-[80px]",
                "bg-accent text-accent-foreground",
                "hover:bg-primary hover:text-primary-foreground",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                "transition-colors duration-200"
              )}
              aria-label="Accept cookies"
              type="button"
            >
              accept()
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
