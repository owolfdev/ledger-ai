"use client";

import React, { useState } from "react";
import Image from "next/image";

const cookieFacts = [
  "Did you know? The term 'cookie' in computing comes from 'magic cookies' used in UNIX systems.",
  "In the Netherlands, cookies are called 'koekje,' meaning 'little cake.'",
  "Browser cookies help websites remember your preferences, like a magic memory jar.",
  "The first web cookie was invented by Lou Montulli in 1994 for an e-commerce site.",
  "Chocolate chip cookies were invented by accident in 1938 by Ruth Wakefield.",
  "Browser cookies are small bits of data stored on your computer to improve user experience.",
  "Some cookies, called session cookies, are temporary and disappear once you close your browser.",
  "Persistent cookies can stay on your computer for days, months, or even years, helping websites remember you over multiple visits.",
  "Cookies can store login information so you don't have to sign in every time you visit a website.",
  "You can clear cookies from your browser's settings if you want to remove stored data or reset preferences.",
  "Cookies have an expiration date. Once they reach that date, they are automatically deleted by the browser.",
  "Third-party cookies track your activity across different websites, usually for advertising purposes.",
  "Some cookies are marked as 'Secure' and are only transmitted over HTTPS connections for extra security.",
  "You can block third-party cookies in your browser settings if you want more privacy while browsing.",
  "Most websites display cookie consent banners because of privacy laws like GDPR, which require user consent before tracking.",
];

const CookieJarComponent = () => {
  const [currentFact, setCurrentFact] = useState("");

  const handleOpenJar = () => {
    const randomFact =
      cookieFacts[Math.floor(Math.random() * cookieFacts.length)];
    setCurrentFact(randomFact);
  };

  return (
    <div className="p-6 text-center max-w-[600px]">
      <h1 className="text-2xl font-bold mb-6">
        Click the cookie jar for a cookie fact... both the edible kind and the
        browser kind.
      </h1>
      <Image
        src="/images/posts/chocolate-chip-cookies/cookie-jar.jpg"
        alt="Cookie Jar"
        className="mx-auto w-40 cursor-pointer"
        onClick={handleOpenJar}
        width={160}
        height={160}
      />
      {currentFact && (
        <div className="mt-4 p-4 rounded text-lg">{currentFact}</div>
      )}
    </div>
  );
};

export default CookieJarComponent;
