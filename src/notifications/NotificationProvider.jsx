import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]); // [{interventionId, title, fromUser, message, timestamp}]
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationCountRef = useRef(0); // Add this line to track total count
  const pollingRef = useRef(null);

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  };

  const getToken = () => localStorage.getItem('token');

  const getLastSeenTs = (interventionId, userId) => {
    const key = `lastSeenMessageTs:${userId}:${interventionId}`;
    return localStorage.getItem(key) || '';
  };

  const setLastSeenTs = (interventionId, userId, ts) => {
    const key = `lastSeenMessageTs:${userId}:${interventionId}`;
    localStorage.setItem(key, ts || new Date().toISOString());
  };

  const refresh = async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;
    try {
      const res = await fetch('http://localhost:8000/api/interventions/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return;
      const interventions = await res.json();
      
      setNotifications(prev => {
        const nextNotifications = [];
        interventions.forEach((itv) => {
          const messages = Array.isArray(itv.messages) ? itv.messages : [];
          if (messages.length === 0) return;
          const last = messages[messages.length - 1];
          const lastTs = last.timestamp;
          const lastSeen = getLastSeenTs(itv.id, user.id);
          const lastFromOther = last?.user?.id && Number(last.user.id) !== Number(user.id);
          const isNew = lastFromOther && (!lastSeen || new Date(lastTs) > new Date(lastSeen));
          if (isNew) {
            nextNotifications.push({
              interventionId: itv.id,
              title: itv.title,
              fromUser: last.user.username,
              message: last.content,
              timestamp: lastTs,
            });
          }
        });
        
        // Merge with existing WebSocket notifications
        const existingIds = new Set(nextNotifications.map(n => n.interventionId));
        const wsNotifications = prev.filter(n => !existingIds.has(n.interventionId));
        const merged = [...wsNotifications, ...nextNotifications];
        notificationCountRef.current = merged.length; // Update ref
        return merged;
      });
      
      // Update unread count based on the ref
      setUnreadCount(notificationCountRef.current);
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(refresh, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime via websocket
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      const token = getToken();
      if (!token) return;
      
      ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
      
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          console.log('WebSocket message received:', data);
          
          if (data?.event === 'new_message') {
            const user = getUser();
            // Only show notification if message is from someone else
            if (user && Number(user.id) !== Number(data.from_user_id)) {
              setNotifications(prev => {
                const filtered = prev.filter(n => n.interventionId !== Number(data.intervention_id));
                const newNotification = {
                  interventionId: Number(data.intervention_id),
                  title: data.title,
                  fromUser: data.from_user,
                  message: data.message,
                  timestamp: data.timestamp,
                };
                const newNotifications = [newNotification, ...filtered];
                notificationCountRef.current = newNotifications.length; // Update ref
                return newNotifications;
              });
              
              // Update unread count based on the ref
              setUnreadCount(notificationCountRef.current);
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...'); // Debug logging
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error); // Debug logging
      };

      ws.onopen = () => {
        console.log('WebSocket connected'); // Debug logging
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const markInterventionRead = (interventionId) => {
    const user = getUser();
    if (!user) return;
    setLastSeenTs(interventionId, user.id, new Date().toISOString());
    setNotifications((prev) => {
      const filtered = prev.filter(n => n.interventionId !== interventionId);
      notificationCountRef.current = filtered.length; // Update ref
      return filtered;
    });
    setUnreadCount(prev => Math.max(0, notificationCountRef.current));
  };

  const markAllRead = () => {
    const user = getUser();
    if (!user) return;
    notifications.forEach(n => setLastSeenTs(n.interventionId, user.id, n.timestamp));
    setNotifications([]);
    notificationCountRef.current = 0; // Reset ref
    setUnreadCount(0);
  };

  const value = useMemo(() => ({ notifications, unreadCount, refresh, markInterventionRead, markAllRead }), [notifications, unreadCount]);
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

