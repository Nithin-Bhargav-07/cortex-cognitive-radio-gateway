import { useState, useEffect } from 'react';
import { useRadio } from '../contexts/RadioContext';

export const useAuditLog = () => {
  const { radioEvents } = useRadio();
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    if (radioEvents.length === 0) return;
    
    const latestEvent = radioEvents[radioEvents.length - 1];
    
    if (latestEvent.status === 'released' || latestEvent.status === 'buffering' || latestEvent.status === 'bypassed') {
      const isBuffering = latestEvent.status === 'buffering' || latestEvent.status === 'intercepted';
      const statusStr = latestEvent.status === 'released' ? 'RELEASED' : isBuffering ? 'BUFFERED' : 'BYPASSED';
      const summary = latestEvent.summary || latestEvent.original;
      
      const isSafe = !(latestEvent.urgency === 3 && summary && summary.length < 10);
      
      const newEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toTimeString().slice(0, 8),
        lap: latestEvent.lap || '-',
        status: statusStr,
        urgency: latestEvent.urgency || 0,
        summary: summary,
        guardian_safe: isSafe
      };
      
      setAuditLog(prev => {
        const next = [newEntry, ...prev];
        return next.slice(0, 50);
      });
    }
  }, [radioEvents]);

  return auditLog;
};
