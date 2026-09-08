import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import type { OverviewEnvelope, CellsSummaryEnvelope } from "@mission-atos/contracts";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getOverview,
  getCellsSummary
} from "@/lib/api/dashboard";
import { useSync } from "@/lib/sync/use-sync";
import { formatPercentage, formatNumber } from "@/lib/utils/format";

function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}): React.JSX.Element {
  return (
    <Card style={styles.statCard} padded>
      <Text variant="label" color="#6B7280">
        {label}
      </Text>
      <Text variant="title" style={styles.statValue}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="#9CA3AF">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

type Metric = { label: string; value: string };

export default function DashboardScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const { isOnline } = useSync();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewEnvelope["data"] | null>(
    null
  );
  const [cellsSummary, setCellsSummary] =
    useState<CellsSummaryEnvelope["data"] | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, cs] = await Promise.all([
        getOverview({ period: "30d" }),
        getCellsSummary({ windowDays: 14 })
      ]);
      setOverview(ov.data);
      setCellsSummary(cs.data);
    } catch {
      setError("Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen padded={false} style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
      </Screen>
    );
  }

  if (error || !overview) {
    return (
      <Screen>
        <Text variant="body" color="#DC2626">
          {error ?? "Sem dados disponíveis."}
        </Text>
      </Screen>
    );
  }

  const metrics: Metric[] = [
    { label: "Pessoas", value: formatNumber(overview.totals.people) },
    { label: "Células ativas", value: formatNumber(overview.totals.activeCells) },
    { label: "Células formando", value: formatNumber(overview.totals.formingCells) },
    { label: "Membros", value: formatNumber(overview.totals.members) }
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">Painel</Text>
        <Badge
          label={isOnline ? "Online" : "Offline"}
          variant={isOnline ? "success" : "error"}
        />
      </View>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} />
        ))}
      </View>

      <Text variant="subtitle" style={styles.sectionTitle}>
        Reuniões
      </Text>
      <Card style={styles.fullCard}>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Reuniões no período
          </Text>
          <Text variant="bold">{formatNumber(overview.meetings.total)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Concluídas
          </Text>
          <Text variant="bold">{formatNumber(overview.meetings.completed)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Taxa de conclusão
          </Text>
          <Text variant="bold">
            {formatPercentage(overview.meetings.completionRate)}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Taxa de frequência
          </Text>
          <Text variant="bold">
            {formatPercentage(overview.attendance.attendanceRate)}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Média de presentes
          </Text>
          <Text variant="bold">
            {overview.attendance.averagePresent.toFixed(1)}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text variant="label" color="#6B7280">
            Visitantes
          </Text>
          <Text variant="bold">{formatNumber(overview.visitors.total)}</Text>
        </View>
      </Card>

      {cellsSummary ? (
        <>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Células
          </Text>
          <Card style={styles.fullCard}>
            <View style={styles.rowBetween}>
              <Text variant="label" color="#6B7280">
                Sem reunião recente
              </Text>
              <Text variant="bold">
                {formatNumber(cellsSummary.withoutRecentMeeting)}
              </Text>
            </View>
            <Text variant="caption" color="#6B7280" style={styles.hint}>
              Janela de {cellsSummary.recentMeetingWindowDays} dias
            </Text>
            {cellsSummary.cells.slice(0, 5).map((cell) => (
              <View key={cell.id} style={styles.cellRow}>
                <Text variant="label">{cell.name}</Text>
                <Badge
                  label={cell.status}
                  variant={
                    cell.status === "ACTIVE" ? "success" : "neutral"
                  }
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  statCard: {
    width: "48%",
    marginBottom: 12
  },
  statValue: {
    marginTop: 4
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8
  },
  fullCard: {
    marginBottom: 16
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  hint: {
    marginTop: 4
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 8
  }
});