import React from "react";
import { StyleSheet, View } from "react-native";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";
import { useSync } from "../lib/sync/use-sync";

export function SyncStatusBar(): React.JSX.Element {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    errorCount,
    triggerSync,
    lastSyncResult
  } = useSync();

  const statusLabel = !isOnline
    ? "Sem conexão"
    : isSyncing
      ? "Sincronizando..."
      : pendingCount > 0
        ? `${pendingCount} item(ns) pendente(s)`
        : "Tudo sincronizado";

  return (
    <Card padded style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Badge
            label={!isOnline ? "Offline" : pendingCount > 0 && !isSyncing ? "Pendente" : "Online"}
            variant={!isOnline ? "error" : pendingCount > 0 && !isSyncing ? "warning" : "success"}
          />
          <Text variant="label" color="#374151" style={styles.label}>
            {statusLabel}
          </Text>
          {errorCount > 0 ? (
            <Text variant="caption" color="#DC2626">
              {errorCount} operação(ões) com erro
            </Text>
          ) : null}
        </View>
        <Button
          variant="secondary"
          onPress={triggerSync}
          loading={isSyncing}
          disabled={!isOnline || pendingCount === 0}
          style={styles.syncButton}
          textStyle={styles.syncButtonText}
        >
          Sincronizar
        </Button>
      </View>
      {lastSyncResult ? (
        <Text variant="caption" color="#6B7280" style={styles.lastSync}>
          Última sincronização: {lastSyncResult.synced} enviado(s)
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  info: {
    flex: 1,
    paddingRight: 12
  },
  label: {
    marginTop: 6
  },
  syncButton: {
    minHeight: 40,
    paddingVertical: 8
  },
  syncButtonText: {
    fontSize: 13
  },
  lastSync: {
    marginTop: 10
  }
});