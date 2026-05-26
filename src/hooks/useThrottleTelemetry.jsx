import { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';

export function useThrottleTelemetry(fps = 4) {
  const { frame } = useTelemetry();
  const [throttledFrame, setThrottledFrame] = useState(frame);
  const frameRef = useRef(frame);
  
  // History arrays (ref based)
  const history = useRef({
    // 60 points for View 1
    cl_score: Array(60).fill(0),
    hrv: Array(60).fill(0),
    eda: Array(60).fill(0),

    // 400 points for View 2
    lap_distance: Array(400).fill(0),
    speed: Array(400).fill(0),
    brake: Array(400).fill(0),
    throttle: Array(400).fill(0),
    n_gear: Array(400).fill(1),
    steering_angle: Array(400).fill(0),
    g_lateral: Array(400).fill(0),
    g_longitudinal: Array(400).fill(0),
    tyre_life: Array(400).fill(100),
    lap: Array(400).fill(0),

    // 30 points for View 3 (Thermals)
    tyre_temp_fl: Array(30).fill(0),
    tyre_temp_fr: Array(30).fill(0),
    tyre_temp_rl: Array(30).fill(0),
    tyre_temp_rr: Array(30).fill(0),
    brake_temp_fl: Array(30).fill(0),
    brake_temp_fr: Array(30).fill(0),
    brake_temp_rl: Array(30).fill(0),
    brake_temp_rr: Array(30).fill(0),
    engine_temp: Array(30).fill(0),
    gear_temp: Array(30).fill(0)
  });

  // Always update refs immediately on frame change
  useEffect(() => {
    frameRef.current = frame;
    
    // 60pt arrays
    history.current.cl_score = [...history.current.cl_score.slice(1), frame.cl_score];
    history.current.hrv = [...history.current.hrv.slice(1), frame.hrv];
    history.current.eda = [...history.current.eda.slice(1), frame.eda];
    
    // 400pt arrays
    history.current.lap_distance = [...history.current.lap_distance.slice(1), frame.lap_distance || 0];
    history.current.speed = [...history.current.speed.slice(1), frame.speed || 0];
    history.current.brake = [...history.current.brake.slice(1), frame.brake || 0];
    history.current.throttle = [...history.current.throttle.slice(1), frame.throttle || 0];
    history.current.n_gear = [...history.current.n_gear.slice(1), frame.n_gear || 1];
    history.current.steering_angle = [...history.current.steering_angle.slice(1), frame.steering_angle || 0];
    history.current.g_lateral = [...history.current.g_lateral.slice(1), frame.g_lateral || 0];
    history.current.g_longitudinal = [...history.current.g_longitudinal.slice(1), frame.g_longitudinal || 0];
    history.current.tyre_life = [...history.current.tyre_life.slice(1), frame.tyre_life || 100];
    history.current.lap = [...history.current.lap.slice(1), frame.lap || 0];

    // 30pt arrays
    history.current.tyre_temp_fl = [...history.current.tyre_temp_fl.slice(1), frame.tyre_temp_fl || 0];
    history.current.tyre_temp_fr = [...history.current.tyre_temp_fr.slice(1), frame.tyre_temp_fr || 0];
    history.current.tyre_temp_rl = [...history.current.tyre_temp_rl.slice(1), frame.tyre_temp_rl || 0];
    history.current.tyre_temp_rr = [...history.current.tyre_temp_rr.slice(1), frame.tyre_temp_rr || 0];
    history.current.brake_temp_fl = [...history.current.brake_temp_fl.slice(1), frame.brake_temp_fl || 0];
    history.current.brake_temp_fr = [...history.current.brake_temp_fr.slice(1), frame.brake_temp_fr || 0];
    history.current.brake_temp_rl = [...history.current.brake_temp_rl.slice(1), frame.brake_temp_rl || 0];
    history.current.brake_temp_rr = [...history.current.brake_temp_rr.slice(1), frame.brake_temp_rr || 0];
    history.current.engine_temp = [...history.current.engine_temp.slice(1), frame.engine_temp || 0];
    history.current.gear_temp = [...history.current.gear_temp.slice(1), frame.gear_temp || 0];
  }, [frame]);

  // Throttle state updates for UI
  useEffect(() => {
    const interval = setInterval(() => {
      setThrottledFrame(frameRef.current);
    }, 1000 / fps);
    
    return () => clearInterval(interval);
  }, [fps]);

  return { frame: throttledFrame, history: history.current };
}
