import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { getMeeting, updateMeetingReport, updateMeetingStatus } from "@/lib/api/meetings";
import type { MeetingResponse } from "@mission-atos/contracts";
import { formatDateBR } from "@/lib/utils/format";
import { ApiError, NetworkError } from "@/lib/api/client";
import { enqueueOperation } from "@/lib/sync/database";
import { generateId } from "@/lib/utils/id";
import { useSync } from "@/lib/sync/use-sync";

export default function MeetingDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { cellId, meetingId } = useLocalSearchParams<{
    cellId: string;
    meetingId: string;
  }>();
  const { triggerSync } = useSync();

  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState("");
  const [savingReport, setSavingReport] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!cellId || !meetingId) return;
    setLoading(true);
    try {
      const response = await getMeeting(cellId, meetingId);
      setMeeting(response.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a reunião.");
    } finally {
      setLoading(false);
    }
  }, [cellId, meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveReport = async (): Promise<void> => {
    if (!cellId || !meetingId) return;
    setSavingReport(true);
    try {
      await updateMeetingReport(cellId, meetingId, { observations });
      Alert.alert("Sucesso", "Relatório salvo.");
    } catch (error) {
      if (error instanceof NetworkError) {
        enqueueOperation({
          operationId: generateId(),
          entity: "meeting-report",
          entityId: meetingId,
          operation: "upsert",
          payload: JSON.stringify({ cellId, meetingId, observations }),
          status: "PENDING",
          errorMessage: null,
          attemptCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        triggerSync();
        Alert.alert("Salvo offline", "O relatório será enviado quando houver conexão.");
      } else if (error instanceof ApiError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Não foi possível salvar o relatório.");
      }
    } finally {
      setSavingReport(false);
    }
  };

  const handleComplete = async (): Promise<void> => {
    if (!cellId || !meetingId) return;
    Alert.alert("Concluir reunião", "Marcar esta reunião como concluída?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Concluir",
        onPress: async () => {
          try {
            await updateMeetingStatus(cellId, meetingId, { status: "COMPLETED" });
            setMeeting((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
            Alert.alert("Sucesso", "Reunião concluída.");
          } catch (error) {
            if (error instanceof NetworkError) {
              enqueueOperation({
                operationId: generateId(),
                entity: "meeting-status",
                entityId: meetingId,
                operation: "complete",
                payload: JSON.stringify({ cellId, meetingId, status: "COMPLETED" }),
                status: "PENDING",
                errorMessage: null,
                attemptCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              triggerSync();
              setMeeting((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
              Alert.alert("Salvo offline", "A conclusão será sincronizada.");
            } else if (error instanceof ApiError) {
              Alert.alert("Erro", error.message);
            }
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <Screen padded={false} style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </Screen>
    );
  }

  if (!meeting) {
    return (
      <Screen>
        <Text color="#DC2626">Reunião não encontrada.</Text>
      </Screen>
    );
  }

  const isCompleted = meeting.status === "COMPLETED";

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Reunião
      </Text>
      <Card style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text variant="label" color="#6B7280">
            Data
          </Text>
          <Text variant="bold">{formatDateBR(meeting.meetingDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="label" color="#6B7280">
            Status
          </Text>
          <Badge
            label={meeting.status}
            variant={
              meeting.status === "COMPLETED"
                ? "success"
                : meeting.status === "CANCELED"
                  ? "error"
                  : "info"
            }
          />
        </View>
        {meeting.cancellationReason ? (
          <View style={styles.detailRow}>
            <Text variant="label" color="#6B7280">
              Cancelamento
            </Text>
            <Text variant="caption" style={styles.cancelText}>
              {meeting.cancellationReason}
            </Text>
          </View>
        ) : null}
      </Card>

      {!isCompleted ? (
        <>
          <Button
            onPress={() =>
              router.push({
                pathname: "/atividades/[cellId]/[meetingId]/chamada",
                params: { cellId, meetingId }
              })
            }
            fullWidth
            style={styles.attendanceButton}
          >
            Registrar chamada / frequência
          </Button>

          <Text variant="subtitle" style={styles.sectionTitle}>
            Relatório
          </Text>
          <Card>
            <TextInput
              label="Observações do encontro"
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={4}
              placeholder="Membros presentes, destaques, pedidos de oração..."
            />
            <Button
              fullWidth
              variant="secondary"
              loading={savingReport}
              onPress={handleSaveReport}
            >
              Salvar relatório
            </Button>
          </Card>

          <Button
            fullWidth
            variant="danger"
            onPress={handleComplete}
            style={styles.completeButton}
          >
            Concluir reunião
          </Button>
        </>
      ) : (
        <Card>
          <Text variant="label" color="#6B7280">
            Esta reunião já foi concluída.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    marginBottom: 12
  },
  detailCard: {
    marginBottom: 16
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  cancelText: {
    flex: 1,
    textAlign: "right",
    color: "#6B7280"
  },
  attendanceButton: {
    marginBottom: 8
  },
  sectionTitle: {
    marginVertical: 12
  },
  completeButton: {
    marginTop: 16
  }
});