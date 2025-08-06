"use client";
import React, { useState } from "react";
import MultiSelect from "@/components/multi-select/shcn-multi-select-categories";

const options = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
];

export default function MultiSelectExample() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <div className="p-4 mb-4">
      <MultiSelect
        options={options}
        selectedValues={selectedCategories}
        setSelectedValues={setSelectedCategories}
        placeholder="Select frameworks..."
      />
      {/* <p className="my-4">Selected: {selectedCategories.join(", ")}</p> */}
    </div>
  );
}
