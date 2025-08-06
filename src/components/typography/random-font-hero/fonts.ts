import localFont from "next/font/local";

export const csDefiant = localFont({
  src: "./fonts/CS-Defiant2.woff2",
  variable: "--font-cs-defiant",
  display: "swap",
});

export const csEndless = localFont({
  src: "./fonts/CS-Endless.woff2",
  variable: "--font-cs-endless",
  display: "swap",
});

export const cs5uper = localFont({
  src: "./fonts/CS-5uper.otf",
  variable: "--font-cs-5uper",
  display: "swap",
});

export const csGlare = localFont({
  src: "./fonts/CS-Glare.otf",
  variable: "--font-cs-glare",
  display: "swap",
});

// Export the name/font pair in a separate array
export const fonts = [
  { name: "CS Defiant", font: csDefiant },
  { name: "CS Endless", font: csEndless },
  { name: "CS 5uper", font: cs5uper },
  { name: "CS Glare", font: csGlare },
];
