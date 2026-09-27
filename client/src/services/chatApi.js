const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function sendChatMessage(
  conversationId,
  message
) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId,
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Errore durante la richiesta"
    );
  }

  return data.reply;
}