import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { AttendanceSnapshot } from "@mission-atos/contracts";
import { FullScreen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAttendance, saveAttendance } from "@/lib/api/attendance";
import { useSync } from "@/lib/sync/use-sync";
import {
  enqueueOperation,
  getAttendanceEntries,
  upsertAttendanceEntries
} from "@/lib/sync/database";
import { generateId } from "@/lib/utils/id";
import { formatDateBR, formatPercentage } from "@/lib/utils/format";
import { ApiError, NetworkError } from "@/lib/api/client";

const statusOptions: Array<{
  value: "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED";
  label: string;
  color: string;
}> = [
  { value: "PRESENT", label: "Presente", color: "#16A34A" },
  { value: "ABSENT", label: "Ausente", color: "#DC2626" },
  { value: "EXCUSED", label: "Justificado", color: "#D97706" }
];

type LocalEntry = {
  personId: string;
  fullName: string;
  status: string;
};

export default function AttendanceScreen(): React.JSX.Element {
  const { cellId, meetingId } = useLocalSearchParams<{
    cellId: string;
    meetingId: string;
  }>();
  const { triggerSync } = useSync();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AttendanceSnapshot | null>(null);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!cellId || !meetingId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAttendance(cellId, meetingId);
      const snap = response.data;
      setSnapshot(snap);
      setRevision(snap.revision);

      const local = getAttendanceEntries(meetingId);
      if (local.length > 0) {
        setEntries(local.map((e) => ({ personId: e.personId, fullName: e.fullName, status: e.status })));
      } else {
        const mapped = snap.participants.map((p) => ({
          personId: p.personId,
          fullName: p.fullName,
          status: p.status
        }));
        setEntries(mapped);
        upsertAttendanceEntries(
          mapped.map((e) => ({
            meetingId,
            personId: e.personId,
            fullName: e.fullName,
            status: e.status,
            updatedAt: new Date().toISOString()
          }))
        );
      }
    } catch {
      setError("Não foi possível carregar a chamada.");
    } finally {
      setLoading(false);
    }
  }, [cellId, meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (personId: string, status: string): void => {
    setEntries((prev) =>
      prev.map((e) => (e.personId === personId ? { ...e, status } : e))
    );
  };

  const handleSave = async (): Promise<void> => {
    if (!cellId || !meetingId) return;
    setSaving(true);
    const attendance = entries.map((e) => ({
      personId: e.personId,
      status: (e.status === "UNMARKED" ? "ABSENT" : e.status) as "PRESENT" | "ABSENT" | "EXCUSED"
    }));

    try {
      const result = await saveAttendance(cellId, meetingId, {
        expectedRevision: revision,
        attendance
      });
      setSnapshot(result.data);
      setRevision(result.data.revision);
      upsertAttendanceEntries(
        entries.map((e) => ({
          meetingId,
          personId: e.personId,
          fullName: e.fullName,
          status: e.status,
          updatedAt: new Date().toISOString()
        }))
      );
      Alert.alert("Sucesso", "Chamada salva.");
    } catch (error) {
      if (error instanceof NetworkError) {
        enqueueOperation({
          operationId: generateId(),
          entity: "attendance",
          entityId: meetingId,
          operation: "upsert",
          payload: JSON.stringify({
            cellId,
            meetingId,
            expectedRevision: revision,
            attendance
          }),
          status: "PENDING",
          errorMessage: null,
          attemptCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        triggerSync();
        Alert.alert(
          "Salvo offline",
          "Frequência salva localmente e enviada quando houver conexão."
        );
      } else if (error instanceof ApiError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Não foi possível salvar a chamada.");
      }
    } finally {
      setSaving(false);
    }
  };

  const completedCount = entries.filter((e) => e.status !== "UNMARKED").length;
  const presentCount = entries.filter((e) => e.status === "PRESENT").length;

  if (loading) {
    return (
      <FullScreen style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </FullScreen>
    );
  }

  if (error || !snapshot) {
    return (
      <FullScreen style={styles.center}>
        <Text color="#DC2626">{error ?? "Sem dados."}</Text>
        <Button onPress={load} style={styles.retry} variant="secondary">
          Tentar novamente
        </Button>
      </FullScreen>
    );
  }

  const progress =
    entries.length > 0 ? (completedCount / entries.length) * 100 : 0;

  return (
    <FullScreen>
      <View style={styles.header}>
        <Text variant="title">Chamada</Text>
        <Text variant="label" color="#6B7280">
          {snapshot.meeting.cellName} • {formatDateBR(snapshot.meeting.meetingDate)}
        </Text>
      </View>

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <View>
            <Text variant="label" color="#6B7280">
              Presentes
            </Text>
            <Text variant="title">{presentCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text variant="label" color="#6B7280">
              Progresso
            </Text>
            <Text variant="title">{formatPercentage(Math.round(progress))}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text variant="label" color="#6B7280">
              Visitantes
            </Text>
            <Text variant="title">{snapshot.summary.visitorCount}</Text>
          </View>
        </View>
      </Card>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.personId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text variant="subtitle" style={styles.listTitle}>
            Participantes
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.personCard}>
            <View style={styles.personRow}>
              <View style={styles.personInfo}>
                <Text variant="label">{item.fullName}</Text>
                <Badge
                  label={
                    item.status === "PRESENT"
                      ? "Presente"
                      : item.status === "ABSENT"
                        ? "Ausente"
                        : item.status === "EXCUSED"
                          ? "Justificado"
                          : "—"
                  }
                  variant={
                    item.status === "PRESENT"
                      ? "success"
                      : item.status === "ABSENT"
                        ? "error"
                        : item.status === "EXCUSED"
                          ? "warning"
                          : "neutral"
                  }
                />
              </View>
              <View style={styles.statusButtons}>
                {statusOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setStatus(item.personId, opt.value)}
                    style={[
                      styles.statusButton,
                      item.status === opt.value && {
                        backgroundColor: opt.color,
                        borderColor: opt.color
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      color={item.status === opt.value ? "#fff" : "#374151"}
                      style={styles.statusButtonText}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              fullWidth
              onPress={handleSave}
              loading={saving}
              disabled={snapshot.isReadOnly}
            >
              {snapshot.isReadOnly ? "Chamada finalizada" : "Salvar chamada"}
            </Button>
          </View>
        }
      />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  retry: {
    marginTop: 12
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  summary: {
    marginHorizontal: 16,
    marginBottom: 8
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F3F4F6"
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  listTitle: {
    marginVertical: 8
  },
  personCard: {
    marginBottom: 8
  },
  personRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  personInfo: {
    flex: 1,
    paddingRight: 8
  },
  statusButtons: {
    flexDirection: "row",
    gap: 6
  },
  statusButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB"
  },
  statusButtonText: {
    fontWeight: "600"
  },
  footer: {
    marginTop: 12
  }
});