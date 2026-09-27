import { recipeAgent } from "../agents/recipeAgent.js";
import {
  getMessages,
  saveMessage,
} from "../services/supabaseService.js";

export async function chat(req, res) {
  const { conversationId, message } = req.body;

  if (!conversationId || !message?.trim()) {
    return res.status(400).json({
      status: "error",
      message: "conversationId e message sono obbligatori",
    });
  }

  try {
    const userMessage = message.trim();
    const history = await getMessages(conversationId);

    const result = await recipeAgent.invoke({
      messages: [
        ...history,
        { role: "user", content: userMessage },
      ],
    });

    const reply = result.messages.at(-1).content;

    await saveMessage(conversationId, "user", userMessage);
    await saveMessage(conversationId, "assistant", reply);

    return res.json({
      status: "ok",
      conversationId,
      reply,
    });
  } catch (error) {
    console.error("Errore chat:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Impossibile elaborare il messaggio",
    });
  }
}