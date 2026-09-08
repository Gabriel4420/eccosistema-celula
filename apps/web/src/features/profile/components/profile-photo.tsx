"use client";

import type { ChangeEvent, RefObject } from "react";
import { Camera, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { UserResponse } from "@mission-atos/contracts";
import { Alert, Button, Dialog } from "@/src/shared/components";
import { toast } from "@/src/shared/toast/toast-store";
import { useSession } from "@/src/providers/session-provider";
import { formatUserMenuIdentity } from "@/src/shared/navigation/user-menu-presentation";
import { getMyProfilePhoto, removeMyProfilePhoto, updateMyProfilePhoto } from "@/src/features/profile/api/profile-api";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { cacheStore } from "@/src/shared/cache/cache";
import { useI18n } from "@/src/shared/i18n/language-provider";

const PHOTO_UPDATED_EVENT = "mission-atos:profile-photo-updated";
const MAX_SOURCE_BYTES = 8_000_000;

type ProfilePhotoProps = { readonly profile: UserResponse; readonly size?: "md" | "lg"; readonly onClick?: () => void; readonly buttonRef?: RefObject<HTMLButtonElement | null>; readonly expanded?: boolean; };

export function ProfilePhoto({ profile, size = "md", onClick, buttonRef, expanded }: ProfilePhotoProps) {
  const { t } = useI18n();
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
    <button ref={buttonRef} type="button" className={`profile-avatar profile-avatar--${size}`} onClick={onClick ?? (() => setOpen(true))} aria-label={onClick ? t("profile.photo.aria.menu") : t("profile.photo.aria.change")} aria-haspopup={onClick ? "dialog" : undefined} aria-expanded={onClick ? expanded : undefined}>
      {source ? <Image src={source} alt="" width={112} height={112} unoptimized className="profile-avatar__image" /> : <span aria-hidden="true">{identity.initials}</span>}
      {!onClick ? <span className="profile-avatar__edit" aria-hidden="true">✎</span> : null}
    </button>
    {!onClick ? <ProfilePhotoDialog open={open} onClose={() => setOpen(false)} profile={profile} hasPhoto={hasPhoto} currentSource={source ?? null} /> : null}
  </>;
}

function ProfilePhotoDialog({ open, onClose, profile, hasPhoto, currentSource }: {
  readonly open: boolean; readonly onClose: () => void; readonly profile: UserResponse; readonly hasPhoto: boolean; readonly currentSource: string | null;
}) {
  const { t } = useI18n();
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
    catch { setError(t("profile.photo.error.format")); }
  };

  const save = async () => {
    if (!candidate) return;
    setBusy(true); setError(null);
    try {
      await updateMyProfilePhoto(api, {
        contentType: candidate.contentType,
        base64: candidate.base64
      });
      window.dispatchEvent(new CustomEvent(PHOTO_UPDATED_EVENT, { detail: true }));
      toast({
        kind: "success",
        title: t("profile.photo.toast.saved"),
        description: t("profile.photo.toast.saved.desc")
      });
      onClose();
    } catch { setError(t("profile.photo.error.save")); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true); setError(null);
    try {
      await removeMyProfilePhoto(api);
      setCandidate(null);
      window.dispatchEvent(new CustomEvent(PHOTO_UPDATED_EVENT, { detail: false }));
      toast({
        kind: "success",
        title: t("profile.photo.toast.removed"),
        description: t("profile.photo.toast.removed.desc")
      });
      onClose();
    } catch { setError(t("profile.photo.toast.removeError")); }
    finally { setBusy(false); }
  };

  return <Dialog open={open} onClose={onClose} title={t("profile.photo.dialog.title")} description={t("profile.photo.dialog.desc")}>
    <div className="profile-photo-dialog">
      <div className="profile-photo-dialog__preview">
        {candidate?.preview ?? currentSource
          ? <Image src={candidate?.preview ?? currentSource ?? ""} alt={t("profile.photo.previewAlt")} width={512} height={512} unoptimized />
          : <span aria-hidden="true">{initials}</span>}
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectPhoto(event)} />
      <Button variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()} disabled={busy}>{t("profile.photo.choose")}</Button>
      <p className="field__description">{t("profile.photo.help")}</p>
      <div className="dialog-panel__actions">
        {hasPhoto ? <Button variant="danger" icon={Trash2} onClick={() => void remove()} disabled={busy}>{t("profile.photo.removeShort")}</Button> : null}
        <Button variant="secondary" icon={X} onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
        <Button icon={Save} onClick={() => void save()} disabled={!candidate} loading={busy} loadingLabel={t("common.saving")}>{t("profile.photo.save")}</Button>
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
