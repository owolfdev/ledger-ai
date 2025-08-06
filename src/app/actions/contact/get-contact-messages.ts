"use server";
import { createClient } from "@/utils/supabase/server";

export interface ContactMessage {
  id: string;
  created_at: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  read: boolean | null;
  responded: boolean | null;
  type: string | null;
}

export async function getContactMessages(
  limit = 20
): Promise<ContactMessage[]> {
  console.log("running contact messages");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_owolf_dot_com")
    .select(
      "id, created_at, name, email, phone, company, message, read, responded, type"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  console.log("data from get contact messages:", data);
  if (error) throw new Error(error.message);
  return data ?? [];
}
