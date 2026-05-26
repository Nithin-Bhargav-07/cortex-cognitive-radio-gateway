import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [frame, setFrame] = useState({
    speed: 0,
    brake: 0,
    throttle: 0,
    n_gear: 1,
    x: 0.5,
    y: 0.5,
    lap: 1,
    sector: 1,
    drs: 0,
    race_status: 'PIT STOP',
    gap_ahead: 0,
    gap_behind: 0,
    in_battle: false,
    cl_score: 0,
    cl_label: 'NORMAL BANDWIDTH',
    eda: 5,
    hrv: 50,
    tyre_life: 100,
    predictive_hold: false,
    upcoming_corner: '',
    corner_seconds_away: 0,
  });

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    const url = import.meta.env.VITE_WS_URL;
    if (!url) return;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('Telemetry WS connected');
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFrame(data);
      } catch (err) {
        console.error('Failed to parse telemetry', err);
      }
    };

    ws.current.onclose = () => {
      console.log('Telemetry WS disconnected. Reconnecting in 2s...');
      reconnectTimeout.current = setTimeout(connect, 2000);
    };

    ws.current.onerror = (err) => {
      console.error('Telemetry WS error', err);
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
    <TelemetryContext.Provider value={{ frame }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
