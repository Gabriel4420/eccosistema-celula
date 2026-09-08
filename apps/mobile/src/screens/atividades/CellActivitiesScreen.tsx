import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { MeetingResponse } from "@mission-atos/contracts";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listMeetings } from "@/lib/api/meetings";
import { getCell } from "@/lib/api/cells";
import { formatDateBR } from "@/lib/utils/format";

const statusVariant: Record<string, "success" | "info" | "neutral"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELED: "neutral"
};

export default function CellActivitiesScreen(): React.JSX.Element {
  const router = useRouter();
  const { cellId } = useLocalSearchParams<{ cellId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cellName, setCellName] = useState("");
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);

  const load = useCallback(async (): Promise<void> => {
    if (!cellId) return;
    setLoading(true);
    setError(null);
    try {
      const [cell, page] = await Promise.all([
        getCell(cellId),
        listMeetings(cellId, { page: 1, pageSize: 100 })
      ]);
      setCellName(cell.data.name);
      setMeetings(page.data);
    } catch {
      setError("Não foi possível carregar as atividades da célula.");
    } finally {
      setLoading(false);
    }
  }, [cellId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleNewMeeting = (): void => {
    router.push({
      pathname: "/atividades/[cellId]/nova",
      params: { cellId }
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title" style={styles.title}>
            Atividades
          </Text>
          <Text variant="label" color="#6B7280">
            {cellName}
          </Text>
        </View>
      </View>

      <Button onPress={handleNewMeeting} style={styles.newButton}>
        Nova reunião
      </Button>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : error ? (
        <Card>
          <Text color="#DC2626">{error}</Text>
        </Card>
      ) : meetings.length === 0 ? (
        <Card>
          <Text variant="label" color="#6B7280">
            Nenhuma reunião registrada ainda.
          </Text>
        </Card>
      ) : (
        meetings.map((meeting) => (
          <TouchableOpacity
            key={meeting.id}
            onPress={() =>
              router.push({
                pathname: "/atividades/[cellId]/[meetingId]",
                params: { cellId, meetingId: meeting.id }
              })
            }
          >
            <Card style={styles.meetingCard}>
              <View style={styles.meetingRow}>
                <View style={styles.meetingInfo}>
                  <Text variant="bold">{formatDateBR(meeting.meetingDate)}</Text>
                  <Text variant="caption" color="#6B7280">
                    Reunião da célula
                  </Text>
                </View>
                <Badge label={meeting.status} variant={statusVariant[meeting.status] ?? "neutral"} />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    marginBottom: 2
  },
  newButton: {
    marginBottom: 16
  },
  loader: {
    marginTop: 24
  },
  meetingCard: {
    marginBottom: 10
  },
  meetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  meetingInfo: {
    flex: 1
  }
});