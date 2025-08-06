"use client";
import { Button } from "@/components/ui/button";

function MyComponent() {
  return (
    <div className="mt-10">
      <Button onClick={() => alert("clicked")} color="primary">
        Click Me
      </Button>
    </div>
  );
}

export default MyComponent;
