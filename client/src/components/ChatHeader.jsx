import pofMdLaterale from "../assets/pof-md-laterale.png";

function ChatHeader({ onNewConversation }) {
  return (
    <header className="chat-header">
      <div className="brand-area">
        <img
          src={pofMdLaterale}
          className="brand-logo"
          alt="POF Planty of Food"
        />
        <p className="brand-subtitle">Assistente ricette plant-based</p>
      </div>

      <button
        className="new-chat-button"
        type="button"
        onClick={onNewConversation}
      >
        Nuova conversazione
      </button>
    </header>
  );
}

export default ChatHeader;
