import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { generateId } from "../utils/id";
import {
  insertDocument,
  getDocuments,
  getDocumentById,
  deleteDocument as dbDeleteDocument,
  updateDocumentSyncStatus
} from "../sync/database";
import type { DocumentRow } from "../sync/types";

const DOCS_DIR = "documents";

async function ensureDocsDir(): Promise<string> {
  const docsPath = `${FileSystem.documentDirectory}${DOCS_DIR}`;
  const dirInfo = await FileSystem.getInfoAsync(docsPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(docsPath, { intermediates: true });
  }
  return docsPath;
}

export async function importImage(): Promise<DocumentRow | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const ext = (asset.mimeType?.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const fileName = `${generateId()}.${ext}`;
  const docsDir = await ensureDocsDir();
  const destUri = `${docsDir}/${fileName}`;

  await FileSystem.copyAsync({ from: asset.uri, to: destUri });

  const fileInfo = await FileSystem.getInfoAsync(destUri);

  const doc: DocumentRow = {
    id: generateId(),
    name: asset.fileName ?? fileName,
    kind: "image",
    mimeType: asset.mimeType ?? "image/jpeg",
    fileUri: destUri,
    size: fileInfo.exists ? fileInfo.size : 0,
    createdAt: new Date().toISOString(),
    syncStatus: "SYNCED"
  };

  insertDocument(doc);
  return doc;
}

export async function importPdf(): Promise<DocumentRow | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf"],
    copyToCacheDirectory: true
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const ext = asset.mimeType === "application/pdf" ? "pdf" : "bin";
  const fileName = `${generateId()}.${ext}`;
  const docsDir = await ensureDocsDir();
  const destUri = `${docsDir}/${fileName}`;

  await FileSystem.copyAsync({ from: asset.uri, to: destUri });

  const fileInfo = await FileSystem.getInfoAsync(destUri);

  const doc: DocumentRow = {
    id: generateId(),
    name: asset.name ?? fileName,
    kind: "pdf",
    mimeType: asset.mimeType ?? "application/pdf",
    fileUri: destUri,
    size: fileInfo.exists ? fileInfo.size : 0,
    createdAt: new Date().toISOString(),
    syncStatus: "SYNCED"
  };

  insertDocument(doc);
  return doc;
}

export function listDocuments(): DocumentRow[] {
  return getDocuments();
}

export function getDocument(id: string): DocumentRow | null {
  return getDocumentById(id);
}

export async function removeDocument(doc: DocumentRow): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(doc.fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(doc.fileUri, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup
  }
  dbDeleteDocument(doc.id);
}

export async function shareDocument(doc: DocumentRow): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;
  await Sharing.shareAsync(doc.fileUri, {
    mimeType: doc.mimeType ?? undefined,
    dialogTitle: `Enviar ${doc.name}`
  });
}

export async function openDocument(doc: DocumentRow): Promise<void> {
  await shareDocument(doc);
}

export function markDocumentSynced(id: string): void {
  updateDocumentSyncStatus(id, "SYNCED");
}

export function markDocumentPending(id: string): void {
  updateDocumentSyncStatus(id, "PENDING");
}