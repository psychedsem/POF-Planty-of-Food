import ReactMarkdown from "react-markdown";

export function ChatMessage({ message }) {
  return (
    <article
      className={`message message-${message.role}`}
    >
      <div className="message-label">
        {message.role === "user" ? "Tu" : "POF"}
      </div>

      <div className="message-content">
        <ReactMarkdown>
          {message.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}

export function TypingMessage() {
  return (
    <article className="message message-assistant">
      <div className="message-label">POF</div>

      <div className="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </article>
  );
}