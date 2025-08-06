"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

function CounterWithoutRef() {
  const [count, setCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(count);

  useEffect(() => {
    setPreviousCount(count);
  }, [count]);

  return (
    <div className="flex flex-col items-center gap-4 justify-center p-10">
      <div className="flex flex-col items-center gap-4 justify-center p-10 border border-gray-200 rounded-md">
        <div className="text-2xl font-bold text-center flex flex-col gap-2">
          <div>Current State: {count}</div>
          <div>Previous State: {previousCount ?? "N/A"}</div>
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

export default CounterWithoutRef;
