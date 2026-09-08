"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Can } from "@/src/shared/auth/guards";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";

const MOBILE_MEDIA_QUERY = "(max-width: 48rem)";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const BASE_LINKS: ReadonlyArray<{
  readonly href: string;
  readonly labelKey: TranslationKey;
  readonly icon: ReactNode;
}> = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: <IconDashboard /> },
  { href: "/profile", labelKey: "nav.profile", icon: <IconProfile /> },
  { href: "/settings", labelKey: "nav.settings", icon: <IconChurch /> },
  { href: "/people", labelKey: "nav.people", icon: <IconPeople /> },
  { href: "/cells", labelKey: "nav.cells", icon: <IconCells /> },
  { href: "/reports", labelKey: "nav.reports", icon: <IconReports /> }
];

function subscribeToMediaQuery(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia(MOBILE_MEDIA_QUERY);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onStoreChange);
    return () => query.removeEventListener("change", onStoreChange);
  }
  query.onchange = onStoreChange;
  return () => {
    query.onchange = null;
  };
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const isMobile = useSyncExternalStore(subscribeToMediaQuery, isMobileViewport, () => false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  const close = () => setOpen(false);

  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const drawer = drawerRef.current;
    if (!drawer) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector));
    (focusables()[0] ?? drawer).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open]);

  const hidden = isMobile && !open;

  const links = [
    ...BASE_LINKS.map((link) => (
      <NavLink
        key={link.href}
        href={link.href}
        label={t(link.labelKey)}
        icon={link.icon}
        current={pathname}
      />
    )),
    <Can key="users" capability="manageUsers">
      <NavLink href="/users" label={t("nav.users")} icon={<IconUsers />} current={pathname} />
    </Can>
  ];

  return (
    <>
      <div className="shell__topbar">
        <button
          type="button"
          className="shell__menu-toggle"
          aria-controls="shell-sidebar"
          aria-expanded={open}
          aria-label={t("nav.openMenu")}
          onClick={() => setOpen(true)}
        >
          <IconMenu />
        </button>
        <Image
          className="shell__topbar-logo"
          src="/brand/missao-atos-logo.png"
          alt=""
          aria-hidden
          width={1120}
          height={520}
          priority={false}
        />
      </div>
      <div
        className={`sidebar-scrim${open ? " sidebar-scrim--open" : ""}`}
        aria-hidden="true"
        onClick={close}
      />
      <aside
        ref={drawerRef}
        id="shell-sidebar"
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-hidden={hidden || undefined}
        inert={hidden}
      >
        <p className="sidebar__brand">
          <Image
            className="sidebar__logo"
            src="/brand/missao-atos-logo.png"
            alt={t("login.brandAlt")}
            width={1254}
            height={1254}
            priority
          />
          <button
            type="button"
            className="sidebar__close"
            aria-label={t("nav.closeMenu")}
            onClick={close}
          >
            <IconClose />
          </button>
        </p>
        <p className="sidebar__label">{t("nav.workspace")}</p>
        <nav aria-label={t("nav.main")} className="sidebar__nav">
          {links}
        </nav>
        <a
          className="sidebar__footer"
          href="https://wa.me/5517991203993?text=Ol%C3%A1%20miss%C3%A3o%20atos%2C%20preciso%20de%20ajuda%20..."
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("nav.helpAria")}
        >
          <span className="sidebar__footer-mark" aria-hidden="true">?</span>
          <span><strong>{t("nav.help")}</strong><small>{t("nav.helpAction")}</small></span>
        </a>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  icon,
  current
}: {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly current: string;
}) {
  const isCurrent = current === href || (href !== "/dashboard" && current.startsWith(`${href}/`));
  return (
    <Link
      className="sidebar__link"
      href={href}
      aria-current={isCurrent ? "page" : undefined}
    >
      <span className="sidebar__link-icon" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}

function NavIcon({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function IconDashboard() {
  return (
    <NavIcon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </NavIcon>
  );
}

function IconProfile() {
  return (
    <NavIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a6 6 0 0 1 12 0v1" />
    </NavIcon>
  );
}

function IconChurch() {
  return (
    <NavIcon>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M12 6h.01M16 6h.01" />
    </NavIcon>
  );
}

function IconPeople() {
  return (
    <NavIcon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </NavIcon>
  );
}

function IconCells() {
  return (
    <NavIcon>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v6l-7 4" />
      <path d="M12 13l7 4" />
    </NavIcon>
  );
}

function IconUsers() {
  return (
    <NavIcon>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </NavIcon>
  );
}

function IconReports() {
  return (
    <NavIcon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </NavIcon>
  );
}

function IconMenu() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
