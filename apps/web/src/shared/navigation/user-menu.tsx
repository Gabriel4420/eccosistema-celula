"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getMyProfile } from "@/src/features/profile/api/profile-api";
import { useSession } from "@/src/providers/session-provider";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { formatUserMenuIdentity } from "./user-menu-presentation";
import { ProfilePhoto } from "@/src/features/profile/components/profile-photo";

export function UserMenu() {
  const { api, logout } = useSession();
  const { t } = useI18n();
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
    : { displayName: t("userMenu.fallback"), initials: "U" };

  return (
    <div className="user-menu" ref={menuRef}>
      {profile ? <ProfilePhoto profile={profile} buttonRef={buttonRef} expanded={open} onClick={() => setOpen((value) => !value)} /> : (
        <button ref={buttonRef} type="button" className="profile-avatar profile-avatar--md" aria-label={t("userMenu.open")} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">{identity.initials}</span></button>
      )}
      {open ? (
        <div className="user-menu__menu" role="dialog" aria-label={t("userMenu.dialog")}>
          <button type="button" className="user-menu__close" aria-label={t("userMenu.close")} onClick={() => { setOpen(false); buttonRef.current?.focus(); }}>×</button>
          <div className="user-menu__account">
            {profile ? <ProfilePhoto profile={profile} size="lg" /> : null}
            <div className="user-menu__identity"><strong>{profile ? `${profile.firstName} ${profile.lastName}`.trim() : identity.displayName}</strong>{profile ? <span>{profile.email}</span> : null}<small>{t("userMenu.photoHint")}</small></div>
          </div>
          <Link
            className="user-menu__item"
            href="/profile"
            onClick={() => setOpen(false)}
          >
            <span className="user-menu__item-icon" aria-hidden="true">◎</span><span><strong>{t("userMenu.profile")}</strong><small>{t("userMenu.profileDesc")}</small></span>
          </Link>
          <Link
            className="user-menu__item"
            href="/settings"
            onClick={() => setOpen(false)}
          >
            <span className="user-menu__item-icon" aria-hidden="true">⚙</span><span><strong>{t("userMenu.settings")}</strong><small>{t("userMenu.settingsDesc")}</small></span>
          </Link>
          <button
            type="button"
            className="user-menu__item"
            disabled={leaving}
            onClick={() => void handleLogout()}
          >
            <span className="user-menu__item-icon" aria-hidden="true">↪</span><span><strong>{leaving ? t("userMenu.signingOut") : t("userMenu.signout")}</strong><small>{t("userMenu.signoutTitle")}</small></span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
