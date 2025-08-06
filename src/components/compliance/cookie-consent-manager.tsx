//src/components/compliance/cookie-consent-manager.tsx
"use client";

import { useEffect, useState } from "react";
import CookieConsentBanner from "./cookie-consent-banner";

const COOKIE_CONSENT_KEY = "cookie_consent_v1_owolf";

export default function CookieConsentManager() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only run on client
    const consent =
      typeof window !== "undefined"
        ? localStorage.getItem(COOKIE_CONSENT_KEY)
        : null;
    setShowBanner(!consent);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
    // Place any logic to enable analytics/scripts here
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setShowBanner(false);
    // Place logic to *prevent* analytics/scripts here
  };

  if (!showBanner) return null;

  return (
    <CookieConsentBanner
      onAccept={handleAccept}
      onReject={handleReject}
      privacyPolicyUrl="/privacy-policy"
    />
  );
}
