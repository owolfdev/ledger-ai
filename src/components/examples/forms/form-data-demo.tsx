"use client";

import { useRef } from "react";

export default function FormDataDemo() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    let output = "Form Data:\n";

    for (const [key, value] of formData.entries()) {
      output += `${key}: ${value instanceof File ? value.name : value}\n`;
    }

    alert(output);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 pt-6 pb-12"
    >
      <input
        className="rounded-md border border-gray-300 p-2"
        type="text"
        name="username"
        placeholder="Username"
      />
      <input
        className="rounded-md border border-gray-300 p-2"
        type="email"
        name="email"
        placeholder="Email"
      />
      <input
        className="rounded-md border border-gray-300 p-2"
        type="file"
        name="avatar"
      />
      <button className="rounded-md bg-blue-500 p-2 text-white" type="submit">
        Submit
      </button>
    </form>
  );
}
