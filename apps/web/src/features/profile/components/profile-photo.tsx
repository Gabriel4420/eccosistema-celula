"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { UserResponse } from "@mission-atos/contracts";
import { Alert, Button, Dialog } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";
import { formatUserMenuIdentity } from "@/src/shared/navigation/user-menu-presentation";
import { getMyProfilePhoto, removeMyProfilePhoto, updateMyProfilePhoto } from "@/src/features/profile/api/profile-api";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { cacheStore } from "@/src/shared/cache/cache";

const PHOTO_UPDATED_EVENT = "mission-atos:profile-photo-updated";
const MAX_SOURCE_BYTES = 8_000_000;

export function ProfilePhoto({ profile, size = "md" }: { readonly profile: UserResponse; readonly size?: "md" | "lg" }) {
  const { api } = useSession();
  const [open, setOpen] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(profile.hasProfilePhoto);
  const identity = formatUserMenuIdentity(profile.firstName, profile.lastName);
  const { data: source, reload } = useRemoteQuery({
    fetcher: async () => {
      try { return await getMyProfilePhoto(api); } catch { return null; }
    },
    cacheName: "profile-photo",
    cacheKey: "me",
    ttlMs: 15_000
  });

  useEffect(() => {
    const refresh = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "boolean") setHasPhoto(event.detail);
      cacheStore("profile-photo").invalidatePrefix("me");
      void reload();
    };
    window.addEventListener(PHOTO_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PHOTO_UPDATED_EVENT, refresh);
  }, [reload]);

  return <>
    <button type="button" className={`profile-avatar profile-avatar--${size}`} onClick={() => setOpen(true)} aria-label="Alterar foto de perfil">
      {source ? <Image src={source} alt="" width={112} height={112} unoptimized className="profile-avatar__image" /> : <span aria-hidden="true">{identity.initials}</span>}
      <span className="profile-avatar__edit" aria-hidden="true">✎</span>
    </button>
    <ProfilePhotoDialog open={open} onClose={() => setOpen(false)} profile={profile} hasPhoto={hasPhoto} currentSource={source ?? null} />
  </>;
}

function ProfilePhotoDialog({ open, onClose, profile, hasPhoto, currentSource }: {
  readonly open: boolean; readonly onClose: () => void; readonly profile: UserResponse; readonly hasPhoto: boolean; readonly currentSource: string | null;
}) {
  const { api } = useSession();
  const [candidate, setCandidate] = useState<{ preview: string; contentType: "image/jpeg"; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = formatUserMenuIdentity(profile.firstName, profile.lastName).initials;

  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try { setCandidate(await prepareProfilePhoto(file)); }
    catch { setError("Escolha uma imagem JPEG, PNG ou WebP de até 8 MB."); }
  };

  const save = async () => {
    if (!candidate) return;
    setBusy(true); setError(null);
    try {
      await updateMyProfilePhoto(api, candidate);
      window.dispatchEvent(new CustomEvent(PHOTO_UPDATED_EVENT, { detail: true }));
      onClose();
    } catch { setError("Não foi possível salvar a foto. Tente novamente."); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true); setError(null);
    try {
      await removeMyProfilePhoto(api);
      setCandidate(null);
      window.dispatchEvent(new CustomEvent(PHOTO_UPDATED_EVENT, { detail: false }));
      onClose();
    } catch { setError("Não foi possível remover a foto."); }
    finally { setBusy(false); }
  };

  return <Dialog open={open} onClose={onClose} title="Foto do perfil" description="Sua foto aparece no perfil e no menu da conta.">
    <div className="profile-photo-dialog">
      <div className="profile-photo-dialog__preview">
        {candidate?.preview ?? currentSource
          ? <Image src={candidate?.preview ?? currentSource ?? ""} alt="Prévia da foto de perfil" width={512} height={512} unoptimized />
          : <span aria-hidden="true">{initials}</span>}
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectPhoto(event)} />
      <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>Escolher foto</Button>
      <p className="field__description">A imagem será recortada ao centro e otimizada. Máximo de 8 MB.</p>
      <div className="dialog-panel__actions">
        {hasPhoto ? <Button variant="danger" onClick={() => void remove()} disabled={busy}>Remover</Button> : null}
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button onClick={() => void save()} disabled={!candidate} loading={busy} loadingLabel="Salvando…">Salvar foto</Button>
      </div>
    </div>
  </Dialog>;
}

async function prepareProfilePhoto(file: File): Promise<{ preview: string; contentType: "image/jpeg"; base64: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_SOURCE_BYTES) throw new Error("Invalid image");
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.fillStyle = "#ffffff"; context.fillRect(0, 0, 512, 512);
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Encode failed")), "image/jpeg", 0.86));
  if (blob.size > 512_000) throw new Error("Encoded image too large");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return { preview: URL.createObjectURL(blob), contentType: "image/jpeg", base64: btoa(binary) };
}
