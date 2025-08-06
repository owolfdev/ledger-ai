import { useEffect } from "react";

export function useTerminalScrollKeys(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    console.log("✅ useTerminalScrollKeys MOUNTED");

    const handler = (e: KeyboardEvent) => {
      // console.log("Key pressed:", e.key);
      //   const tag = document.activeElement?.tagName;
      //   // Optional: Add log here
      //   console.log("Active element:", tag);
      //   if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowDown":
          console.log("ArrowDown: scroll +600px");
          e.preventDefault();
          window.scrollBy({ top: 600, behavior: "smooth" });
          break;
        case "ArrowUp":
          console.log("ArrowUp: scroll -600px");
          e.preventDefault();
          window.scrollBy({ top: -600, behavior: "smooth" });
          break;
        case "PageDown":
          console.log("PageDown: scroll +1 viewport");
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
          break;
        case "PageUp":
          console.log("PageUp: scroll -1 viewport");
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
          break;
        case "Home":
          console.log("Home: scroll to top");
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "End":
          console.log("End: scroll to bottom");
          e.preventDefault();
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
