import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import "./chatbox.css";

export default function ChatBox({ onUpload, onQuery }) {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hey! 👋 Upload Excel or ask about an area like 'Wakad'." }
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, { ...msg, text: String(msg.text) }]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    addMessage({ sender: "user", text: input });
    const query = input.trim();
    setInput("");

    setIsTyping(true);

    const reply = await onQuery(query);
    setIsTyping(false);

    addMessage({ sender: "bot", text: reply });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addMessage({ sender: "user", text: `📄 Uploaded: ${file.name}` });

    setIsTyping(true);
    await onUpload(file);

    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        sender: "bot",
        text: "Excel uploaded ✔ Now ask something!"
      });
    }, 600);
  };

  return (
    <motion.div className="chatbox-container glass-card">
      <div className="chatbox-messages">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`msg-wrapper ${msg.sender === "user" ? "msg-right" : "msg-left"}`}
          >
            <div className={`avatar ${msg.sender === "user" ? "user-avatar" : "bot-avatar"}`}>
              {msg.sender === "user" ? "🧑‍💻" : "🤖"}
            </div>

            <div className={`bubble ${msg.sender}-bubble`}>
              {String(msg.text)}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="msg-wrapper msg-left">
            <div className="avatar bot-avatar">🤖</div>
            <div className="bubble bot-bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        <div ref={chatRef}></div>
      </div>

      <div className="chatbox-input-area">
        <input
          className="chatbox-input modern-input"
          placeholder="Ask something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button className="chatbox-send-btn btn-primary-modern" onClick={sendMessage}>
          ➤
        </button>

        <label className="chatbox-upload-btn">
          📤
          <input type="file" hidden onChange={handleFile} />
        </label>
      </div>
    </motion.div>
  );
}
