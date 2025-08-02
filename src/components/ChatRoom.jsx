import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const ChatRoom = () => {
  const { interventionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!interventionId) {
      console.log("No interventionId provided");
      return;
    }

    console.log("Connecting to intervention:", interventionId);

    // Load previous messages
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }

        console.log("Loading messages for intervention:", interventionId);
        const response = await fetch(`http://localhost:8000/api/interventions/${interventionId}/messages/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Loaded messages:", data);
          setMessages(data.map(msg => ({
            type: 'chat',
            message: msg.content,
            user: msg.user.username,
            timestamp: msg.timestamp,
            user_id: msg.user.id
          })));
        } else {
          console.error("Failed to load messages, status:", response.status);
          setError('Failed to load messages');
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Connect to WebSocket
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/chat/${interventionId}/?token=${token}`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
      setError(null);
    };

    ws.current.onmessage = (event) => {
      console.log("Received WebSocket message:", event.data);
      const data = JSON.parse(event.data);
      
      // Handle error messages from backend
      if (data.type === 'error') {
        alert(data.message);
        return;
      }
      
      setMessages((prev) => [...prev, data]);
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError('Connection failed');
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [interventionId]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    // Check if user is a client (only clients can send messages)
    const userData = localStorage.getItem('user');
    const userType = userData ? JSON.parse(userData).user_type : null;
    console.log("User type:", userType);
    if (userType !== 'client' && userType !== 'employee') {
      alert('Only clients can send messages in the chat.');
      return;
    }

    ws.current.send(JSON.stringify({ message: inputMessage }));
    setInputMessage("");
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", textAlign: "center" }}>
        <div>Loading chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", textAlign: "center" }}>
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        padding: "10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px"
      }}>
        <div>
          <h3 style={{ margin: 0 }}>Intervention #{interventionId}</h3>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            {(() => {
              const userData = localStorage.getItem('user');
              const userType = userData ? JSON.parse(userData).user_type : null;
              const isClient = userType === 'client';
              return (
                <span style={{ 
                  padding: "2px 8px", 
                  borderRadius: "12px", 
                  backgroundColor: isClient ? "#007bff" : "#ff9800",
                  color: "white",
                  fontSize: "10px"
                }}>
                  {isClient ? "Client - Can Send Messages" : "Employee - View Only"}
                </span>
              );
            })()}
          </div>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px" 
        }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: isConnected ? "#4CAF50" : "#f44336"
          }}></div>
          <span style={{ fontSize: "14px", color: "#666" }}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          height: "400px",
          overflowY: "scroll",
          padding: "15px",
          marginBottom: "15px",
          backgroundColor: "#fff"
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            {msg.type === 'system' ? (
              <div style={{
                textAlign: "center",
                color: "#666",
                fontSize: "12px",
                fontStyle: "italic",
                margin: "10px 0"
              }}>
                {msg.message}
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.user_id === parseInt(localStorage.getItem('user_id') || '0') ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  backgroundColor: msg.user_id === parseInt(localStorage.getItem('user_id') || '0') ? "#007bff" : "#f1f1f1",
                  color: msg.user_id === parseInt(localStorage.getItem('user_id') || '0') ? "white" : "black",
                  wordWrap: "break-word"
                }}>
                  <div style={{ fontSize: "12px", marginBottom: "4px", opacity: 0.7 }}>
                    {msg.user} • {formatTimestamp(msg.timestamp)}
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ display: "flex", gap: "10px" }}>
        {(() => {
          const userData = localStorage.getItem('user');
          const userType = userData ? JSON.parse(userData).user_type : null;
          const isClient = userType === 'client' || 'employee';
          const canSend = isConnected && isClient;
          
          return (
            <>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isClient ? "Type a message..." : "Only clients can send messages"}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: isClient ? "#fff" : "#f5f5f5",
                  color: isClient ? "#000" : "#999"
                }}
                disabled={!canSend}
              />
              <button 
                onClick={sendMessage} 
                disabled={!canSend || !inputMessage.trim()}
                style={{ 
                  padding: "12px 20px", 
                  backgroundColor: canSend && inputMessage.trim() ? "#007bff" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: canSend && inputMessage.trim() ? "pointer" : "not-allowed",
                  fontSize: "14px"
                }}
              >
                {isClient ? "Send" : "View Only"}
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ChatRoom;
