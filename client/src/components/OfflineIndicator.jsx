// components/OfflineIndicator.jsx
import { useOfflineQueue } from "../hooks/useOfflineQueue";

export function OfflineIndicator() {
  const { isOnline, queued, syncing } = useOfflineQueue();

  if (isOnline && queued === 0 && !syncing) return null;

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-body font-medium shadow-lg ${
        isOnline ? "bg-teal text-night" : "bg-flame text-night"
      }`}
      role="status"
    >
      {!isOnline && `Offline${queued > 0 ? `, ${queued} answer${queued === 1 ? "" : "s"} queued` : ""}`}
      {isOnline && syncing && "Syncing queued answers..."}
      {isOnline && !syncing && queued > 0 && `${queued} answer${queued === 1 ? "" : "s"} still queued`}
    </div>
  );
}
