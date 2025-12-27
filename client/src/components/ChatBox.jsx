import React, { useState, useEffect } from "react";

const ChatBox = ({ socket, room, username }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
    return () => socket.off("receive_message");
  }, [socket]);

  return (
    <div className="chat-window" style={{ border: '1px solid #ccc', height: '450px', display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden' }}>
      <div className="chat-header" style={{ padding: '10px', background: '#004e92', color: 'white' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Live Chat</p>
      </div>
      <div className="chat-body" style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#f9f9f9' }}>
        {messageList.map((content, index) => (
          <div key={index} style={{ textAlign: content.author === username ? 'right' : 'left', marginBottom: '10px' }}>
            <div style={{ background: content.author === username ? '#dbeafe' : '#fff', padding: '8px 12px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>{content.message}</p>
              <small style={{ fontSize: '0.7rem', color: '#777' }}>{content.author} • {content.time}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-footer" style={{ display: 'flex', padding: '10px', background: '#fff', borderTop: '1px solid #eee' }}>
        <input
          type="text"
          value={currentMessage}
          placeholder="Type a message..."
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyPress={(event) => event.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }}
        />
        <button onClick={sendMessage} style={{ background: '#004e92', color: 'white', border: 'none', padding: '0 15px', marginLeft: '5px', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;