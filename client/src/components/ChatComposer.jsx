function ChatComposer({ input, setInput, isLoading, error, onSubmit }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="composer-area">
      {error && <p className="error-message">{error}</p>}

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Es. Vorrei un piatto speziato con fagioli rossi..."
          rows="1"
          disabled={isLoading}
        />

        <button type="submit" disabled={!input.trim() || isLoading}>
          Invia
        </button>
      </form>

      <p className="composer-hint">
        Invio per mandare · Shift + Invio per andare a capo
      </p>
    </div>
  );
}

export default ChatComposer;
