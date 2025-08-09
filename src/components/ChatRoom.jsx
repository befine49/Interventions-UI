import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import logo from "../assets/logo.png";

const ChatRoom = () => {
  const { interventionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [chatClosed, setChatClosed] = useState(false);
  const [chatRating, setChatRating] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const [isPageVisible, setIsPageVisible] = useState(typeof document !== 'undefined' ? !document.hidden : true);
  const [hasWindowFocus, setHasWindowFocus] = useState(typeof document !== 'undefined' ? document.hasFocus() : true);
  const [unseenCount, setUnseenCount] = useState(0);
  const initialTitleRef = useRef(typeof document !== 'undefined' ? document.title : '');
  const [toast, setToast] = useState(null);
  const [notificationBlocked, setNotificationBlocked] = useState(false);

  const markThisInterventionRead = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) return;
      const key = `lastSeenMessageTs:${user.id}:${interventionId}`;
      localStorage.setItem(key, new Date().toISOString());
    } catch (_) { /* ignore */ }
  };

  const requestNotificationPermissionIfNeeded = () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setNotificationBlocked(Notification.permission === 'denied');
  };

  const showDesktopNotification = (title, body) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(title, {
        body,
        icon: logo,
        badge: logo,
      });
      notification.onclick = () => {
        window.focus();
      };
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100]); } catch (_) { /* noop */ }
      }
    } catch (_) {
      // ignore notification errors
    }
  };

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.21);
      setTimeout(() => ctx.close(), 300);
    } catch (_) { /* ignore */ }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    requestNotificationPermissionIfNeeded();
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    const handleFocus = () => {
      setHasWindowFocus(true);
      setUnseenCount(0);
      if (typeof document !== 'undefined') {
        document.title = initialTitleRef.current || document.title;
      }
      markThisInterventionRead();
    };
    const handleBlur = () => setHasWindowFocus(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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

      // Handle chat close event from backend
      if (data.type === 'close_chat_channel') {
        alert("Chat has been ended by the employee.");
        ws.current.close();
        setIsConnected(false);
        setChatClosed(true);

        // If rating info is sent from backend, set it
        if (typeof data.rating === 'number') {
          setChatRating(data.rating);
        }

        const userData = localStorage.getItem('user');
        const userType = userData ? JSON.parse(userData).user_type : null;
        if (userType === 'client') {
          setShowRating(true);
        } else {
          window.location.href = "/interventions";
        }
        return;
      }
      // Push message to UI state
      setMessages((prev) => [...prev, data]);

      // Desktop notification for incoming chat messages from others when tab is hidden
      try {
        const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
        const isIncomingFromOther = data?.type === 'chat' && Number(data?.user_id) !== currentUserId;
        const pageHidden = typeof document === 'undefined' ? false : document.hidden;
        const shouldNotify = isIncomingFromOther && (pageHidden || !hasWindowFocus);
        if (shouldNotify) {
          showDesktopNotification(`New message from ${data.user}`, data.message);
          setToast({ text: `New message from ${data.user}: ${data.message}`, ts: Date.now() });
          playBeep();
          setUnseenCount((c) => {
            const next = c + 1;
            if (typeof document !== 'undefined' && initialTitleRef.current) {
              document.title = `(${next}) New message • ${initialTitleRef.current}`;
            }
            return next;
          });
        }
      } catch (_) {
        // ignore notification errors
      }
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
    if (!inputMessage.trim() || !isConnected || chatClosed) return;

    const userData = localStorage.getItem('user');
    const userType = userData ? JSON.parse(userData).user_type : null;

    if (userType !== 'client' && userType !== 'employee') {
      alert('Only clients and employees can send messages in the chat.');
      return;
    }

    ws.current.send(JSON.stringify({ message: inputMessage }));
    setInputMessage("");
    markThisInterventionRead();
  };

  // Employee end chat handler
  const endChat = () => {
    const userData = localStorage.getItem('user');
    const userType = userData ? JSON.parse(userData).user_type : null;
    if (userType === 'employee' && isConnected) {
      ws.current.send(JSON.stringify({ action: 'end_chat' }));
    }
  };

  const handleRatingSubmit = async () => {
    // Send rating to backend via websocket
    if (ws.current && rating > 0) {
      ws.current.send(JSON.stringify({ action: 'rate_chat', rating }));
    }
    setShowRating(false);
    window.location.href = "/interventions";
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  useEffect(() => {
    // Load intervention rating
    const loadInterventionRating = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`http://localhost:8000/api/interventions/${interventionId}/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.chat_rating === 'number') {
            setChatRating(data.chat_rating);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    loadInterventionRating();
  }, [interventionId]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", textAlign: "center" }}>
        <div>Loading chat...</div>
        {notificationBlocked && (
          <div style={{ color: '#d9534f', marginTop: '10px', fontSize: '12px' }}>
            Desktop notifications are blocked. Enable them in your browser site settings to receive alerts when this tab is not focused.
          </div>
        )}
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

  if (chatClosed && showRating) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", padding: "40px", textAlign: "center" }}>
        <h3>Rate this chat</h3>
        <div style={{ margin: "20px 0" }}>
          {[1,2,3,4,5].map((star) => (
            <span
              key={star}
              style={{
                fontSize: "2em",
                color: rating >= star ? "#FFD700" : "#ccc",
                cursor: "pointer",
                margin: "0 5px"
              }}
              onClick={() => setRating(star)}
            >★</span>
          ))}
        </div>
        <button
          onClick={handleRatingSubmit}
          disabled={rating === 0}
          style={{
            padding: "12px 24px",
            backgroundColor: rating ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: rating ? "pointer" : "not-allowed",
            fontSize: "16px"
          }}
        >
          Submit Rating & Return
        </button>
      </div>
    );
  }

  if (chatClosed && !showRating) {
    return (
      <div style={{ maxWidth: "600px", margin: "auto", padding: "40px", textAlign: "center" }}>
        <h3>Chat Closed</h3>
        <div style={{ margin: "20px 0", color: "#f44336" }}>
          This chat has been closed. You can no longer send messages.
        </div>
        {chatRating !== null && (
          <div style={{ margin: "20px 0", color: "#007bff", fontSize: "18px" }}>
            Client rating for this chat: <b>{chatRating} / 5</b>
          </div>
        )}
        <button
          onClick={() => window.location.href = "/interventions"}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Return to Interventions
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      {toast && (
        <div
          onAnimationEnd={() => setToast(null)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#333',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            zIndex: 9999,
            maxWidth: '320px'
          }}
        >
          {toast.text}
        </div>
      )}
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
              const isClientOrEmployee = userType === 'client' || userType === 'employee';
              return (
                <span style={{ 
                  padding: "2px 8px", 
                  borderRadius: "12px", 
                  backgroundColor: isClientOrEmployee ? "#007bff" : "#ff9800",
                  color: "white",
                  fontSize: "10px"
                }}>
                  {isClientOrEmployee ? "Can Send & Receive Messages" : "View Only"}
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
          const isClientOrEmployee = userType === 'client' || userType === 'employee';
          const canSend = isConnected && isClientOrEmployee;
          
          return (
            <>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isClientOrEmployee ? "Type a message..." : "View Only"}
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: isClientOrEmployee ? "#fff" : "#f5f5f5",
                  color: isClientOrEmployee ? "#000" : "#999"
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
                {isClientOrEmployee ? "Send" : "View Only"}
              </button>
            </>
          );
        })()}
        {(() => {
          const userData = localStorage.getItem('user');
          const userType = userData ? JSON.parse(userData).user_type : null;
          const isEmployee = userType === 'employee';
          return (
            <>
              {isEmployee && (
                <button
                  onClick={endChat}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  End Chat
                </button>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ChatRoom;
