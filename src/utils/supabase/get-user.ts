// src/utils/supabase/get-user-client.ts
import { createClient } from "@/utils/supabase/client"; // <-- NOT server.ts
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
