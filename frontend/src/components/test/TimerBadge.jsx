import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const TimerBadge = ({
  initialMinutes = 90,
  initialSeconds,
  expiresAt,
  serverTime,
  onTimeUp,
  isPaused = false,
}) => {
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const timeUpTriggeredRef = useRef(false);

  // Monotonic hardware clock baseline anchored to authoritative server time
  // Changing local OS date/clock will NOT alter performance.now()
  const syncRef = useRef({
    serverBaseMs: serverTime ? new Date(serverTime).getTime() : Date.now(),
    clientPerfBase: performance.now(),
  });

  useEffect(() => {
    const sTime = serverTime ? new Date(serverTime).getTime() : Date.now();
    syncRef.current = {
      serverBaseMs: isNaN(sTime) ? Date.now() : sTime,
      clientPerfBase: performance.now(),
    };
  }, [serverTime, expiresAt]);

  // Helper to compute remaining seconds based on server expiration timestamp anchored monotonically
  const getRemainingSeconds = useCallback(() => {
    if (expiresAt) {
      const expTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
      if (!isNaN(expTime)) {
        const elapsedSinceSync = performance.now() - syncRef.current.clientPerfBase;
        const currentEstimatedServerMs = syncRef.current.serverBaseMs + elapsedSinceSync;
        return Math.max(0, Math.floor((expTime - currentEstimatedServerMs) / 1000));
      }
    }
    if (initialSeconds !== undefined) {
      return Math.max(0, initialSeconds);
    }
    return Math.max(0, (initialMinutes || 90) * 60);
  }, [expiresAt, initialSeconds, initialMinutes]);

  const [secondsRemaining, setSecondsRemaining] = useState(getRemainingSeconds);

  // Sync state when expiresAt, serverTime, or initial duration changes
  useEffect(() => {
    const rem = getRemainingSeconds();
    setSecondsRemaining(rem);
    timeUpTriggeredRef.current = false;
  }, [getRemainingSeconds]);

  // Handle visibility / focus change to immediately re-sync with monotonic clock
  useEffect(() => {
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        const rem = getRemainingSeconds();
        setSecondsRemaining(rem);
        if (rem <= 0 && !timeUpTriggeredRef.current) {
          timeUpTriggeredRef.current = true;
          onTimeUpRef.current?.();
        }
      }
    };

    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [getRemainingSeconds]);

  // 1-second interval tick that calculates real time difference from expiresAt
  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      if (expiresAt) {
        const rem = getRemainingSeconds();
        setSecondsRemaining(rem);
        if (rem <= 0 && !timeUpTriggeredRef.current) {
          timeUpTriggeredRef.current = true;
          onTimeUpRef.current?.();
        }
      } else {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (!timeUpTriggeredRef.current) {
              timeUpTriggeredRef.current = true;
              onTimeUpRef.current?.();
            }
            return 0;
          }
          return prev - 1;
        });
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [expiresAt, isPaused, getRemainingSeconds]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const isCritical = secondsRemaining < 300; // Under 5 mins

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base tracking-wide transition-colors ${
        isCritical
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse shadow-xs'
          : 'bg-slate-100 text-slate-900 border-slate-300 shadow-2xs'
      }`}
      role="timer"
      aria-live="polite"
      title="Remaining Examination Time"
    >
      {isCritical ? (
        <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-bounce" />
      ) : (
        <Clock className="h-4.5 w-4.5 text-blue-600" />
      )}
      <span>{formattedTime}</span>
    </div>
  );
};

export default TimerBadge;
