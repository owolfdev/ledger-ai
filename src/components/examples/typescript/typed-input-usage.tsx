"use client";

import { TypedInput } from "@/components/examples/typescript/typed-input";

export function TypedInputUsage() {
  return (
    <div className="max-w-md mx-auto mt-10 space-y-8 mb-14">
      <h2 className="text-2xl font-bold">User Input</h2>
      <TypedInput<number>
        label="Age"
        initialValue={0}
        validate={(v) => (v < 18 ? "Must be at least 18." : null)}
        onChange={(v) => // console.log("✅ Valid age:", v)}
      />

      <TypedInput<string>
        label="Username"
        initialValue=""
        validate={(v) =>
          v.length < 2 ? "Username must be at least 2 characters." : null
        }
        onChange={(v) => // console.log("✅ Valid username:", v)}
      />
    </div>
  );
}
