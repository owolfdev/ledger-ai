"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";

type TypedInputProps<T> = {
  label: string;
  initialValue: T;
  validate: (value: T) => string | null;
  onChange: (value: T) => void;
};

function coerceValue<T>(raw: string, initial: T): T {
  if (typeof initial === "number") {
    return Number(raw) as T;
  }
  return raw as T;
}

export function TypedInput<T>({
  label,
  initialValue,
  validate,
  onChange,
}: TypedInputProps<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const typed = coerceValue(raw, initialValue);
    const err = validate(typed);
    setValue(typed);
    setError(err);
    if (!err) onChange(typed);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value as unknown as string}
        onChange={handleChange}
        type={typeof initialValue === "number" ? "number" : "text"}
      />
      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
