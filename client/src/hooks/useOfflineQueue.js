// hooks/useOfflineQueue.js
import { useEffect, useState, useCallback } from "react";
import { queueCount, flushQueue } from "../services/offlineQueue";

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    setQueued(await queueCount());
  }, []);

  useEffect(() => {
    refreshCount();
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      await flushQueue();
      await refreshCount();
      setSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCount]);

  return { isOnline, queued, syncing, refreshCount };
}
