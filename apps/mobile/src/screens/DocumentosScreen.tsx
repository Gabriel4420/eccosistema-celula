import React, { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getSyncBadgeVariant } from "@/components/ui/Badge";
import {
  importImage,
  importPdf,
  listDocuments,
  removeDocument,
  shareDocument
} from "@/lib/documents/store";
import type { DocumentRow } from "@/lib/sync/types";
import { formatDateTimeBR, formatFileSize } from "@/lib/utils/format";

export default function DocumentsScreen(): React.JSX.Element {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [importingImage, setImportingImage] = useState(false);
  const [importingPdf, setImportingPdf] = useState(false);

  const load = useCallback(() => {
    setDocuments(listDocuments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleImportImage = async (): Promise<void> => {
    setImportingImage(true);
    try {
      const doc = await importImage();
      if (doc) {
        load();
      }
    } catch {
      Alert.alert("Erro", "Não foi possível importar a imagem.");
    } finally {
      setImportingImage(false);
    }
  };

  const handleImportPdf = async (): Promise<void> => {
    setImportingPdf(true);
    try {
      const doc = await importPdf();
      if (doc) {
        load();
      }
    } catch {
      Alert.alert("Erro", "Não foi possível importar o PDF.");
    } finally {
      setImportingPdf(false);
    }
  };

  const handleDelete = (doc: DocumentRow): void => {
    Alert.alert("Excluir documento", `Excluir "${doc.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await removeDocument(doc);
          load();
        }
      }
    ]);
  };

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Documentos
      </Text>
      <Text variant="caption" color="#6B7280" style={styles.subtitle}>
        Anexe imagens e PDFs das atividades da célula.
      </Text>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={handleImportImage}
          loading={importingImage}
          style={styles.actionButton}
        >
          Adicionar imagem
        </Button>
        <Button
          variant="secondary"
          onPress={handleImportPdf}
          loading={importingPdf}
          style={styles.actionButton}
        >
          Adicionar PDF
        </Button>
      </View>

      {documents.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text variant="label" color="#6B7280">
            Nenhum documento adicionado ainda. Importe imagens ou PDFs para
            visualizar e enviar.
          </Text>
        </Card>
      ) : (
        documents.map((doc) => {
          const badge = getSyncBadgeVariant(doc.syncStatus);
          return (
            <TouchableOpacity
              key={doc.id}
              onPress={() =>
                router.push({
                  pathname: "/documentos/[docId]",
                  params: { docId: doc.id }
                })
              }
            >
              <Card style={styles.docCard}>
                <View style={styles.docRow}>
                  <View style={styles.docIcon}>
                    <Ionicons
                      name={doc.kind === "image" ? "image-outline" : "document-text-outline"}
                      size={28}
                      color="#2563EB"
                    />
                  </View>
                  <View style={styles.docInfo}>
                    <Text variant="bold" numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text variant="caption" color="#6B7280">
                      {formatFileSize(doc.size)} •{" "}
                      {formatDateTimeBR(doc.createdAt)}
                    </Text>
                    <View style={styles.docMeta}>
                      <Badge
                        label={badge.label}
                        variant={badge.variant}
                        style={styles.docBadge}
                      />
                      <Text variant="caption" color="#9CA3AF">
                        {doc.kind === "image" ? "Imagem" : "PDF"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.docActions}>
                    <TouchableOpacity
                      onPress={() => shareDocument(doc)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="share-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(doc)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
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
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  actionButton: {
    flex: 1
  },
  emptyCard: {
    marginBottom: 16
  },
  docCard: {
    marginBottom: 10
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  docInfo: {
    flex: 1,
    paddingRight: 8
  },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  docBadge: {
    alignSelf: "auto"
  },
  docActions: {
    flexDirection: "row",
    gap: 4
  },
  iconButton: {
    padding: 6
  }
});