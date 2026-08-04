"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/src/providers/session-provider";

export function UserMenu() {
  const { logout } = useSession();
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

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="button button--secondary button--sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Minha conta
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
