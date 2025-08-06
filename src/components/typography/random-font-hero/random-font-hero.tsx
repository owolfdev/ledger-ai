// random-font-hero.tsx
import { fonts } from "./fonts";

interface HeroTitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function HeroTitle({
  children,
  className = "",
}: HeroTitleProps) {
  const fontsWithInter = [...fonts];
  const randomFont =
    fontsWithInter[Math.floor(Math.random() * fontsWithInter.length)];

  const fontSizeClass =
    randomFont.name === "CS Endless"
      ? "sm:text-[19rem] text-[7.5rem]"
      : randomFont.name === "CS Glare"
        ? "sm:text-[21rem]"
        : "sm:text-[22rem]";

  const paddingRightClass = randomFont.name === "CS Endless" ? "pr-8" : "pr-0";

  return (
    <div className="overflow-hidden">
      <h1
        className={`
          ${randomFont.font.className}
          ${fontSizeClass}
          text-[9rem]
          font-bold
          text-center
          m-0 p-0
          leading-[1]
          -mt-0 -mb-3
          pt-3
          ${paddingRightClass}
          ${className}
        `}
      >
        {children}
      </h1>
    </div>
  );
}
