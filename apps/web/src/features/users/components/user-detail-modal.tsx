"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog, StatusBadge } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getUserProfilePhoto } from "@/src/features/users/api/users-api";
import { roleLabel } from "@/src/shared/auth/session";
import type { UserResponse } from "@mission-atos/contracts";

interface UserDetailModalProps {
  readonly user: UserResponse;
  readonly open: boolean;
  readonly onClose: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function initials(user: UserResponse): string {
  const first = user.firstName.trim().charAt(0);
  const last = user.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase();
}

export function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  const { api } = useSession();
  const { data: photoSource } = useRemoteQuery({
    fetcher: () => getUserProfilePhoto(api, user.id),
    cacheName: "user-profile-photo",
    cacheKey: user.id,
    ttlMs: 30_000,
    enabled: open && user.hasProfilePhoto
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${user.firstName} ${user.lastName}`}
      className="user-modal"
      hideHeader
    >
      <div className="user-modal__header">
        <div className="user-modal__avatar" aria-hidden="true">
          {photoSource ? (
            <Image src={photoSource} alt="" width={112} height={112} unoptimized className="user-modal__avatar-image" />
          ) : (
            initials(user)
          )}
        </div>
        <div className="user-modal__identity">
          <span className="user-modal__name">
            {user.firstName} {user.lastName}
          </span>
          <span className="user-modal__email">{user.email}</span>
        </div>
        <span className="user-modal__status">
          <StatusBadge status={user.status} />
        </span>
      </div>

      <div className="user-modal__body">
        <div className="user-modal__section">
          <span className="user-modal__eyebrow">Papéis</span>
          <div className="user-modal__roles">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <span key={role.id} className="user-modal__role-badge">
                  {roleLabel(role.name)}
                </span>
              ))
            ) : (
              <span className="user-modal__empty">Nenhum papel atribuído</span>
            )}
          </div>
        </div>

        <div className="user-modal__section">
          <span className="user-modal__eyebrow">Informações da conta</span>
          <dl className="user-modal__meta">
            <div className="user-modal__meta-item">
              <dt>Criado em</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div className="user-modal__meta-item">
              <dt>Última atualização</dt>
              <dd>{formatDate(user.updatedAt)}</dd>
            </div>
            <div className="user-modal__meta-item user-modal__meta-item--wide">
              <dt>Foto de perfil</dt>
              <dd>{user.hasProfilePhoto ? "Cadastrada" : "Não cadastrada"}</dd>
            </div>
            <div className="user-modal__meta-item user-modal__meta-item--wide">
              <dt>ID do usuário</dt>
              <dd className="user-modal__meta-id">{user.id}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="dialog-panel__actions">
        <Link className="button button--secondary button--sm" href={`/users/${user.id}`}>
          Abrir página completa
        </Link>
      </div>
    </Dialog>
  );
}
