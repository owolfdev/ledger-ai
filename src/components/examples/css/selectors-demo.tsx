"use client";
import { useEffect, useRef, useState } from "react";

export default function CssSelectorPlayground() {
  const [selector, setSelector] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const prev = container.querySelectorAll(".highlighted");
    prev.forEach((el) => el.classList.remove("highlighted"));

    if (!selector.trim()) return;

    try {
      const matches = container.querySelectorAll(selector);
      matches.forEach((el) => el.classList.add("highlighted"));
      setError(matches.length === 0 ? "No match found" : "");
    } catch (e) {
      setError("Invalid selector");
    }
  }, [selector]);

  return (
    <div className="space-y-6 p-6 text-base font-mono font-normal">
      <h1 className="text-4xl font-bold">CSS Selector Playground</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
        Type any valid CSS selector below to highlight matching elements. You
        can select by:
        <br />• Class: <code>.card</code>, <code>.special</code>
        <br />• ID: <code>#header</code>
        <br />• Tag: <code>div</code>, <code>li</code>, <code>input</code>
        <br />• Attribute: <code>[type=&ldquo;text&rdquo;]</code>,{" "}
        <code>[data-role=&ldquo;target&rdquo;]</code>
        <br />• Pseudo-elements: <code>::before</code>, <code>::after</code>{" "}
        (visually shown only)
        <br />• Combinations: <code>div.card[data-type=&ldquo;box&rdquo;]</code>
      </p>
      <input
        value={selector}
        onChange={(e) => setSelector(e.target.value)}
        placeholder="Type a CSS selector..."
        className="border p-2 w-full rounded"
      />
      {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

      <div
        ref={containerRef}
        className="p-6 border rounded space-y-4 bg-gray-50 dark:bg-gray-900"
      >
        <div className="box card" id="header">
          {`<div class="box card" id="header">Header div</div>`}
        </div>

        <div className="box info" data-type="box">
          {`<div class="box info" data-type="box">Info div</div>`}
        </div>

        <input
          type="text"
          className="input-field w-full"
          placeholder='<input type="text" className="input-field" placeholder="Enter text here"/>'
        />

        <ul>
          <li>{`<li>List item 1</li>`}</li>
          <li className="special">{`<li class="special">List item 2</li>`}</li>
          <li>{`<li>List item 3</li>`}</li>
        </ul>

        <span data-role="target">{`<span data-role="target">Target span</span>`}</span>

        <div className="before-demo">
          .before-demo <code>::before</code> and <code>::after</code>{" "}
          pseudo-elements
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This element uses <code>::before</code> and <code>::after</code> to
          add decorative arrows. These pseudo-elements are not part of the DOM,
          so they cannot be selected directly, but their effects are visible.
        </p>
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
          <code>
            {`/* Example CSS applied */
.before-demo::before {
  content: " 👉 ";
  color: #c71585;
}
.before-demo::after {
  content: " 👈 ";
  color: #c71585;
}`}
          </code>
        </pre>
      </div>

      <style jsx>{`
        .highlighted {
          outline: 2px solid #c71585;
          background-color: #c71585;
          color: white !important;
        }
        .box {
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .input-field {
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 6px;
        }
        span[data-role="target"] {
          display: inline-block;
          margin-top: 8px;
        }
        .before-demo::before {
          content: "👉 ";
          color: #c71585;
          margin-right: 6px;
        }
        .before-demo::after {
          content: " 👈";
          color: #c71585;
          margin-left: 6px;
        }
        @media (prefers-color-scheme: dark) {
          .box,
          .input-field,
          ul,
          li,
          span[data-role="target"],
          .before-demo {
            color: #f0f0f0;
          }
        }
      `}</style>
    </div>
  );
}
