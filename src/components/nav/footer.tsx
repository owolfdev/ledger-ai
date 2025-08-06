"use client";

import { Github, Linkedin } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Optionally, define links in an array for easier expansion
  const navLinks = [
    { href: "/privacy-policy", label: "Privacy" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="pb-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center h-20 text-muted-foreground">
      <div>&copy;{new Date().getFullYear()} OWolf.com</div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-row gap-4 cursor-pointer">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <p
                className={
                  `transition ` +
                  (pathname === link.href
                    ? "text-foreground font-bold"
                    : "hover:text-foreground hover:font-bold")
                }
              >
                {link.label}
              </p>
            </Link>
          ))}
        </div>
        <div className="flex flex-row gap-3 items-center">
          <a
            href="https://github.com/owolfdev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:font-bold transition"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          {/* <a
            href="https://www.linkedin.com/in/olivier-wolfson-41522a5/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:font-bold transition"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a> */}
        </div>
      </div>
      <div className="hidden sm:block">
        <ModeToggle />
      </div>
    </footer>
  );
}
