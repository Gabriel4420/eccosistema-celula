import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { runSync, type SyncResult } from "./engine";
import { getSyncCounts } from "./database";

type SyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  pendingCount: number;
  errorCount: number;
};

type SyncContextValue = SyncState & {
  triggerSync: () => Promise<void>;
  refreshCounts: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(
    null
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsub;
  }, []);

  const refreshCounts = useCallback(() => {
    const counts = getSyncCounts();
    setPendingCount(counts.pending);
    setErrorCount(counts.errors);
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!isOnline || isSyncing) return;
    const timer = setInterval(() => {
      refreshCounts();
    }, 30_000);
    return () => clearInterval(timer);
  }, [isOnline, isSyncing, refreshCounts]);

  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      const result = await runSync();
      setLastSyncResult(result);
      refreshCounts();
    } catch {
      // Best-effort sync
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, refreshCounts]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      triggerSync();
    }
  }, [isOnline, pendingCount, isSyncing, triggerSync]);

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      lastSyncResult,
      pendingCount,
      errorCount,
      triggerSync,
      refreshCounts
    }),
    [
      isOnline,
      isSyncing,
      lastSyncResult,
      pendingCount,
      errorCount,
      triggerSync,
      refreshCounts
    ]
  );

  return React.createElement(SyncContext.Provider, { value }, children);
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}