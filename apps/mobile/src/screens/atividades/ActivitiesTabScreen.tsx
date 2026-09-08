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
import { Badge } from "@/components/ui/Badge";
import { listCells } from "@/lib/api/cells";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMeetingDay, formatHour } from "@/lib/utils/format";

const statusVariant: Record<string, "success" | "warning" | "info" | "neutral"> = {
  ACTIVE: "success",
  FORMING: "info",
  SUSPENDED: "warning",
  CLOSED: "neutral"
};

export default function ActivitiesTabScreen(): React.JSX.Element {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cells, setCells] = useState<CellsPageEnvelope["data"]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const page = await listCells({ page: 1, pageSize: 50, sortBy: "name" });
      setCells(page.data);
    } catch {
      setError("Não foi possível carregar as células.");
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
      <Text variant="title" style={styles.title}>
        Minhas células
      </Text>
      <Text variant="caption" color="#6B7280" style={styles.subtitle}>
        Toque em uma célula para registrar suas atividades.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : error ? (
        <Card>
          <Text color="#DC2626">{error}</Text>
        </Card>
      ) : cells.length === 0 ? (
        <Card>
          <Text variant="label" color="#6B7280">
            Nenhuma célula vinculada ao seu perfil.
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
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text variant="bold">{cell.name}</Text>
                  <Text variant="caption" color="#6B7280">
                    {cell.code} • {formatMeetingDay(cell.meetingDay)} às{" "}
                    {formatHour(cell.meetingTime)}
                  </Text>
                </View>
                <Badge
                  label={cell.status}
                  variant={statusVariant[cell.status] ?? "neutral"}
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 2
  },
  subtitle: {
    marginBottom: 16
  },
  loader: {
    marginTop: 24
  },
  cellCard: {
    marginBottom: 10
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  info: {
    flex: 1,
    paddingRight: 8
  }
});