"use client";

// import { Github, Linkedin } from "lucide-react";
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
      <div>&copy;{new Date().getFullYear()} Ledger AI</div>
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
      </div>
      <div className="hidden sm:block">
        <ModeToggle />
      </div>
    </footer>
  );
}
