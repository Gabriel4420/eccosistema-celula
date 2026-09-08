import React, { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { createMeeting } from "@/lib/api/meetings";
import { enqueueOperation } from "@/lib/sync/database";
import { generateId } from "@/lib/utils/id";
import { toISODate } from "@/lib/utils/format";
import { ApiError, NetworkError } from "@/lib/api/client";

export default function NewMeetingScreen(): React.JSX.Element {
  const router = useRouter();
  const { cellId } = useLocalSearchParams<{ cellId: string }>();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));
  const [dateError, setDateError] = useState("");

  const handleCreate = async (): Promise<void> => {
    if (!cellId) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateError("Use o formato AAAA-MM-DD.");
      return;
    }
    setDateError("");

    setSaving(true);
    try {
      await createMeeting(cellId, { meetingDate: date }, generateId());
      Alert.alert("Sucesso", "Reunião criada.");
      router.back();
    } catch (error) {
      if (error instanceof NetworkError) {
        enqueueOperation({
          operationId: generateId(),
          entity: "meeting",
          entityId: cellId,
          operation: "create",
          payload: JSON.stringify({ cellId, meetingDate: date }),
          status: "PENDING",
          errorMessage: null,
          attemptCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        Alert.alert(
          "Sem conexão",
          "A reunião foi salva localmente e será sincronizada quando houver conexão."
        );
        router.back();
      } else if (error instanceof ApiError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Não foi possível criar a reunião.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Nova reunião
      </Text>
      <Card>
        <TextInput
          label="Data da reunião (AAAA-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
          error={dateError}
        />
        <Button fullWidth onPress={handleCreate} loading={saving}>
          Criar reunião
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16
  }
});