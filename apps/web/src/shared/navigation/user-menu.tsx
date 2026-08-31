"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getMyProfile } from "@/src/features/profile/api/profile-api";
import { useSession } from "@/src/providers/session-provider";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { formatUserMenuIdentity } from "./user-menu-presentation";
import { ProfilePhoto } from "@/src/features/profile/components/profile-photo";

export function UserMenu() {
  const { api, logout } = useSession();
  const { data: profile } = useRemoteQuery({
    fetcher: () => getMyProfile(api),
    cacheName: "profile",
    cacheKey: "me",
    ttlMs: 15_000
  });
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setLeaving(true);
    await logout();
  };

  const identity = profile
    ? formatUserMenuIdentity(profile.firstName, profile.lastName)
    : { displayName: "Usuário", initials: "U" };

  return (
    <div className="user-menu" ref={menuRef}>
      {profile ? <ProfilePhoto profile={profile} /> : <span className="user-menu__avatar" aria-hidden="true">{identity.initials}</span>}
      <button
        ref={buttonRef}
        type="button"
        className="button button--secondary button--sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="user-menu__copy"><strong>{identity.displayName}</strong><small>Ver perfil</small></span>
        <span className="user-menu__chevron" aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="user-menu__menu" role="menu" aria-label="Menu da conta">
          <Link
            className="user-menu__item"
            role="menuitem"
            href="/profile"
            onClick={() => setOpen(false)}
          >
            Meu perfil
          </Link>
          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            disabled={leaving}
            onClick={() => void handleLogout()}
          >
            {leaving ? "Saindo…" : "Sair"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
