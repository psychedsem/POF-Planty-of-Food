const CONVERSATION_KEY = "pof-conversation-id";
const MESSAGES_KEY = "pof-chat-messages";

export const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ciao! Sono l'assistente di POF Planty of Food. Dimmi che tipo di ricetta plant-based stai cercando.",
};

export function createConversationId() {
  return crypto.randomUUID();
}

export function loadConversationId() {
  const savedId = localStorage.getItem(CONVERSATION_KEY);

  if (savedId) {
    return savedId;
  }

  const newId = createConversationId();
  localStorage.setItem(CONVERSATION_KEY, newId);

  return newId;
}

export function saveConversationId(conversationId) {
  localStorage.setItem(CONVERSATION_KEY, conversationId);
}

export function loadMessages() {
  try {
    const savedMessages = JSON.parse(
      localStorage.getItem(MESSAGES_KEY)
    );

    if (Array.isArray(savedMessages) && savedMessages.length) {
      return savedMessages;
    }
  } catch {
    // Se i dati locali non sono validi, riparte dalla schermata iniziale.
  }

  return [welcomeMessage];
}

export function saveMessages(messages) {
  localStorage.setItem(
    MESSAGES_KEY,
    JSON.stringify(messages)
  );
}