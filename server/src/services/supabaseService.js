import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Salva un messaggio della conversazione
export async function saveMessage(conversationId, role, content) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });

  if (error) throw error;
}

// Recupera gli ultimi messaggi in ordine cronologico
export async function getMessages(conversationId, limit = 10) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).reverse();
}