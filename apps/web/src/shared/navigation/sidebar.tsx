"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Can } from "@/src/shared/auth/guards";

const BASE_LINKS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
}> = [
  { href: "/dashboard", label: "Painel", icon: <IconDashboard /> },
  { href: "/profile", label: "Meu perfil", icon: <IconProfile /> },
  { href: "/church/settings", label: "Igreja", icon: <IconChurch /> },
  { href: "/people", label: "Pessoas", icon: <IconPeople /> },
  { href: "/cells", label: "Células", icon: <IconCells /> }
];

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    ...BASE_LINKS.map((link) => (
      <NavLink
        key={link.href}
        href={link.href}
        label={link.label}
        icon={link.icon}
        current={pathname}
      />
    )),
    <Can key="users" capability="manageUsers">
      <NavLink href="/users" label="Usuários" icon={<IconUsers />} current={pathname} />
    </Can>
  ];

  return (
    <aside className="sidebar">
      <p className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">
          EC
        </span>
        <span>Ecossistema de Células</span>
      </p>
      <nav aria-label="Navegação principal" className="sidebar__nav">
        {links}
      </nav>
    </aside>
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
