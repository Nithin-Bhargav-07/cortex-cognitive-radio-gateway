import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const RadioContext = createContext(null);

export const RadioProvider = ({ children }) => {
  const [radioEvents, setRadioEvents] = useState([]);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    const url = import.meta.env.VITE_RADIO_URL;
    if (!url) return;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('Radio WS connected');
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setRadioEvents((prev) => [...prev, data]);
        
        // Auto-play audio if released
        if (data.status === 'released' && data.audio_b64) {
          try {
            const binaryString = atob(data.audio_b64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const blobUrl = URL.createObjectURL(blob);
            const audio = new Audio(blobUrl);
            audio.play();
          } catch (e) {
            console.error('Failed to play audio', e);
          }
        }
      } catch (err) {
        console.error('Failed to parse radio event', err);
      }
    };

    ws.current.onclose = () => {
      console.log('Radio WS disconnected. Reconnecting in 2s...');
      reconnectTimeout.current = setTimeout(connect, 2000);
    };

    ws.current.onerror = (err) => {
      console.error('Radio WS error', err);
      ws.current.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return (
    <RadioContext.Provider value={{ radioEvents }}>
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => useContext(RadioContext);
