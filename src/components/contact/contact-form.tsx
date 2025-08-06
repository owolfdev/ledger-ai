"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const supabase = createClient();

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const { error } = await supabase
      .from("contact_owolf_dot_com")
      .insert([{ ...form }]);

    if (error) {
      setStatus("error");
    } else {
      setStatus("success");
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pb-8">
      <input
        type="text"
        placeholder="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full bg-transparent border-b border-gray-400 outline-none"
      />
      <input
        type="email"
        placeholder="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full bg-transparent border-b border-gray-400 outline-none"
      />
      <input
        type="text"
        placeholder="phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full bg-transparent border-b border-gray-400 outline-none"
      />
      <input
        type="text"
        placeholder="company"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
        className="w-full bg-transparent border-b border-gray-400 outline-none"
      />
      <textarea
        placeholder="message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full bg-transparent border-b border-gray-400 outline-none"
        rows={4}
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send"}{" "}
        <Send className="w-4 h-4" />
      </Button>
      {status === "success" && <div className="text-green-600">Sent!</div>}
      {status === "error" && (
        <div className="text-red-600">Error sending message.</div>
      )}
    </form>
  );
}
