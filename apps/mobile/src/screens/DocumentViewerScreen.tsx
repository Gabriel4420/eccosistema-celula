import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FullScreen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Badge, getSyncBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDocument, shareDocument } from "@/lib/documents/store";
import type { DocumentRow } from "@/lib/sync/types";
import { formatDateTimeBR, formatFileSize } from "@/lib/utils/format";

export default function DocumentViewerScreen(): React.JSX.Element {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const [doc, setDoc] = useState<DocumentRow | null>(null);

  const load = useCallback(() => {
    if (!docId) return;
    setDoc(getDocument(docId));
  }, [docId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!doc) {
    return (
      <FullScreen style={styles.center}>
        <Text color="#6B7280">Documento não encontrado.</Text>
      </FullScreen>
    );
  }

  const badge = getSyncBadgeVariant(doc.syncStatus);

  const handleShare = (): void => {
    shareDocument(doc).catch(() => {
      Alert.alert("Erro", "Não foi possível enviar o documento.");
    });
  };

  return (
    <FullScreen>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text variant="title" numberOfLines={1} style={styles.headerTitle}>
            {doc.name}
          </Text>
          <Text variant="caption" color="#6B7280">
            {formatFileSize(doc.size)} • {formatDateTimeBR(doc.createdAt)}
          </Text>
        </View>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      {doc.kind === "image" ? (
        <View style={styles.preview}>
          <Image
            source={{ uri: doc.fileUri }}
            style={styles.image}
            contentFit="contain"
            transition={150}
          />
        </View>
      ) : (
        <View style={styles.preview}>
          <Ionicons name="document-text-outline" size={72} color="#9CA3AF" />
          <Text variant="label" color="#6B7280" style={styles.pdfHint}>
            Documento PDF
          </Text>
          <Text variant="caption" color="#9CA3AF" style={styles.pdfHint}>
            Use os botões abaixo para abrir ou enviar o documento.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button fullWidth onPress={handleShare} style={styles.actionButton}>
          Abrir / Enviar documento
        </Button>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  headerInfo: {
    flex: 1,
    paddingRight: 12
  },
  headerTitle: {
    marginBottom: 2
  },
  preview: {
    flex: 1,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  image: {
    width: "100%",
    height: "100%"
  },
  pdfHint: {
    marginTop: 8
  },
  actions: {
    padding: 16
  },
  actionButton: {
    marginTop: 4
  }
});