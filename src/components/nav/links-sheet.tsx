"use client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Github, Linkedin, Menu } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import Link from "next/link";

export default function LinksSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="fixed top-13 right-8 sm:right-12 z-50 rounded-full p-2 transition dark:text-neutral-100 sm:hidden"
          aria-label="Open Links Sidebar"
        >
          <Menu size={32} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 border-0 pl-2">
        <div className="flex flex-col gap-8 h-full pt-10 px-6">
          <div className="text-4xl font-black font-sans">Links</div>
          <div className="flex flex-col gap-5 text-lg">
            <SheetClose asChild>
              <Link className="" href="/">
                Home
              </Link>
            </SheetClose>
            {/* <SheetClose asChild>
              <Link className="" href="/about">
                About
              </Link>
            </SheetClose> */}
            <SheetClose asChild>
              <Link className="" href="/blog">
                Blog
              </Link>
            </SheetClose>
            {/* <SheetClose asChild>
              <Link className="" href="/projects">
                Projects
              </Link>
            </SheetClose> */}
            {/* <SheetClose asChild>
              <Link className="" href="/contact">
                Contact
              </Link>
            </SheetClose> */}
            {/* <SheetClose asChild>
              <Link className="" href="/privacy-policy">
                Privacy
              </Link>
            </SheetClose> */}
            <div className="flex flex-row gap-4 items-center mt-auto pt-4">
              <Link
                href="https://github.com/owolfdev"
                target="_blank"
                rel="noopener noreferrer"
                className=" transition"
                aria-label="GitHub"
              >
                <Github size={20} />
              </Link>
              {/* <a
                href="https://www.linkedin.com/in/olivier-wolfson-41522a5/"
                target="_blank"
                rel="noopener noreferrer"
                className=" transition"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a> */}
            </div>
            <div className="pt-8">
              <ModeToggle />
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
          <ModeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
