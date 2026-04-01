import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatBox = ({ socket, room, username }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messageList]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        room, author: username, message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    const handler = (data) => setMessageList((list) => [...list, data]);
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [socket]);

  return (
    <div className="chatbox-root">
      {/* Header */}
      <div className="chatbox-header">
        <div className="chatbox-header-left">
          <span className="chatbox-dot" />
          <span className="chatbox-title">Chat</span>
        </div>
        <span className="chatbox-count">{messageList.length}</span>
      </div>

      {/* Messages */}
      <div className="chatbox-messages">
        {messageList.length === 0 && (
          <div className="chatbox-empty">
            <p>No messages yet</p>
          </div>
        )}
        <AnimatePresence>
          {messageList.map((content, index) => {
            const isMe = content.author === username;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`msg-row ${isMe ? "msg-mine" : "msg-other"}`}
              >
                {!isMe && <span className="msg-author">{content.author}</span>}
                <div className={`msg-bubble ${isMe ? "bubble-mine" : "bubble-other"}`}>
                  <p className="msg-text">{content.message}</p>
                </div>
                <span className="msg-time">{content.time}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chatbox-input-area">
        <div className="chatbox-input-wrap">
          <input
            type="text"
            value={currentMessage}
            placeholder="Message..."
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="chatbox-input"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            className="chatbox-send"
            disabled={!currentMessage.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </div>

      <style>{`
        .chatbox-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f0f0f;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .chatbox-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .chatbox-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chatbox-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
        }
        .chatbox-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f1f5f9;
        }
        .chatbox-count {
          font-size: 0.7rem;
          color: #475569;
          background: rgba(255,255,255,0.04);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .chatbox-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }
        .chatbox-messages::-webkit-scrollbar { width: 4px; }
        .chatbox-messages::-webkit-scrollbar-track { background: transparent; }
        .chatbox-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .chatbox-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chatbox-empty p {
          color: #334155;
          font-size: 0.8rem;
        }

        .msg-row {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }
        .msg-mine { align-self: flex-end; align-items: flex-end; }
        .msg-other { align-self: flex-start; align-items: flex-start; }

        .msg-author {
          font-size: 0.65rem;
          color: #64748b;
          margin-bottom: 3px;
          padding-left: 2px;
        }

        .msg-bubble {
          padding: 8px 12px;
          border-radius: 14px;
          word-break: break-word;
        }
        .bubble-mine {
          background: #3b82f6;
          border-bottom-right-radius: 4px;
        }
        .bubble-other {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 4px;
        }

        .msg-text {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.45;
          color: #f1f5f9;
        }

        .msg-time {
          font-size: 0.6rem;
          color: #475569;
          margin-top: 3px;
          padding: 0 2px;
        }

        .chatbox-input-area {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .chatbox-input-wrap {
          display: flex;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 4px 4px 4px 14px;
          align-items: center;
        }
        .chatbox-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #f1f5f9;
          font-size: 0.85rem;
          outline: none;
          padding: 8px 0;
          font-family: inherit;
        }
        .chatbox-input::placeholder { color: #334155; }

        .chatbox-send {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: #3b82f6;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .chatbox-send:disabled {
          opacity: 0.3;
          cursor: default;
        }
        .chatbox-send:hover:not(:disabled) { opacity: 0.85; }
      `}</style>
    </div>
  );
};

export default ChatBox;