"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

function CounterWithRef() {
  const [count, setCount] = useState(0);
  const previousCountRef = useRef<number | null>(null); // Initialize a ref to store the previous count
  useEffect(() => {
    previousCountRef.current = count; // Update the ref after every render
  }, [count]);

  return (
    <div className="flex flex-col items-center gap-4 justify-center p-10">
      <div className="flex flex-col items-center gap-4 justify-center p-10 border border-gray-200 rounded-md">
        <div className="text-2xl font-bold text-center flex flex-col gap-2">
          <div>Current State: {count}</div>
          <div>Previous State: {previousCountRef.current ?? "N/A"}</div>
        </div>
        <Button
          type="button"
          onClick={() => setCount(count + 1)}
          className="text-lg"
        >
          Increment
        </Button>
      </div>
    </div>
  );
}

export default CounterWithRef;
