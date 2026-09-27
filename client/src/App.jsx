import { useEffect, useRef, useState } from "react";
import ChatComposer from "./components/ChatComposer.jsx";
import ChatHeader from "./components/ChatHeader.jsx";
import {
  ChatMessage,
  TypingMessage,
} from "./components/ChatMessage.jsx";
import { sendChatMessage } from "./services/chatApi.js";
import {
  createConversationId,
  loadConversationId,
  loadMessages,
  saveConversationId,
  saveMessages,
  welcomeMessage,
} from "./utils/chatStorage.js";
import "./App.css";

function App() {
  const [conversationId, setConversationId] = useState(
    loadConversationId
  );
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    saveMessages(messages);

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();

    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(
        conversationId,
        message
      );

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (requestError) {
      console.error("Errore chat:", requestError);

      setError(
        "Non riesco a contattare l'assistente. Riprova tra qualche istante."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function startNewConversation() {
    const newConversationId = createConversationId();

    saveConversationId(newConversationId);
    setConversationId(newConversationId);
    setMessages([welcomeMessage]);
    setInput("");
    setError("");
  }

  return (
    <main className="app">
      <section className="chat">
        <ChatHeader
          onNewConversation={startNewConversation}
        />

        <div className="messages">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
            />
          ))}

          {isLoading && <TypingMessage />}

          <div ref={messagesEndRef}></div>
        </div>

        <ChatComposer
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          error={error}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}

export default App;