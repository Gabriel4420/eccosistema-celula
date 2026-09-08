import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { CellsPageEnvelope } from "@mission-atos/contracts";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SyncStatusBar } from "@/components/SyncStatusBar";
import { useAuth } from "@/lib/auth/auth-context";
import { listCells } from "@/lib/api/cells";
import { getMe } from "@/lib/api/users";
import { formatMeetingDay, formatHour } from "@/lib/utils/format";

const statusVariant: Record<string, "success" | "warning" | "info" | "neutral"> = {
  ACTIVE: "success",
  FORMING: "info",
  SUSPENDED: "warning",
  CLOSED: "neutral"
};

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { getToken, state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cells, setCells] = useState<CellsPageEnvelope["data"]>([]);
  const [userName, setUserName] = useState("");

  const user = state.status === "signedIn" ? state.user : null;
  const displayName =
    userName || (user?.firstName ? `${user.firstName} ${user.lastName}`.trim() : "Líder");

  const load = useCallback(async (): Promise<void> => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const [cellsPage, me] = await Promise.all([
        listCells({ page: 1, pageSize: 50, sortBy: "name" }),
        getMe()
      ]);
      setCells(cellsPage.data);
      const u = me.data;
      setUserName(`${u.firstName} ${u.lastName}`.trim());
    } catch {
      setError("Não foi possível carregar suas células.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <SyncStatusBar />

      <Card style={styles.greeting}>
        <Avatar name={displayName} size={48} />
        <View style={styles.greetingText}>
          <Text variant="caption" color="#6B7280">
            Olá
          </Text>
          <Text variant="subtitle">{displayName}</Text>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text variant="subtitle">Minhas células</Text>
        <TouchableOpacity onPress={() => router.push("/atividades")}>
          <Text variant="label" color="#2563EB">
            Ver atividades
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : error ? (
        <Card>
          <Text color="#DC2626">{error}</Text>
        </Card>
      ) : cells.length === 0 ? (
        <Card>
          <Text variant="label" color="#6B7280">
            Nenhuma célula encontrada para o seu perfil.
          </Text>
        </Card>
      ) : (
        cells.map((cell) => (
          <TouchableOpacity
            key={cell.id}
            onPress={() =>
              router.push({
                pathname: "/atividades/[cellId]",
                params: { cellId: cell.id }
              })
            }
          >
            <Card style={styles.cellCard}>
              <View style={styles.cellRow}>
                <View style={styles.cellInfo}>
                  <Text variant="bold">{cell.name}</Text>
                  <Text variant="caption" color="#6B7280">
                    {cell.code} • {formatMeetingDay(cell.meetingDay)} às{" "}
                    {formatHour(cell.meetingTime)}
                  </Text>
                </View>
                <Badge label={cell.status} variant={statusVariant[cell.status] ?? "neutral"} />
              </View>
              <Text variant="caption" color="#9CA3AF" numberOfLines={2}>
                {cell.address}
              </Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  greetingText: {
    marginLeft: 12,
    flex: 1
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  loader: {
    marginTop: 24
  },
  cellCard: {
    marginBottom: 10
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cellInfo: {
    flex: 1,
    paddingRight: 8
  }
});