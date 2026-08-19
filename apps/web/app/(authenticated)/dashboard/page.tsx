"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Can } from "@/src/shared/auth/guards";
import { Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";

interface Shortcut {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: ReactNode;
  readonly capability?: "manageUsers" | "editPeople" | "viewCells";
}

const SHORTCUTS: readonly Shortcut[] = [
  {
    title: "Meu perfil",
    description: "Atualize seus dados e altere sua senha.",
    href: "/profile",
    icon: <IconProfile />
  },
  {
    title: "Configurações da igreja",
    description: "Consulte os dados institucionais e ajustes.",
    href: "/church/settings",
    icon: <IconChurch />
  },
  {
    title: "Pessoas",
    description: "Consulte e gerencie as pessoas da igreja.",
    href: "/people",
    icon: <IconPeople />,
    capability: "editPeople"
  },
  {
    title: "Células",
    description: "Consulte e gerencie as células da igreja.",
    href: "/cells",
    icon: <IconCells />,
    capability: "viewCells"
  }
];

const ADMIN_SHORTCUTS: readonly Shortcut[] = [
  {
    title: "Usuários",
    description: "Gerencie contas, papéis e acesso.",
    href: "/users",
    icon: <IconUsers />
  }
];

const ROLE_LABELS: Readonly<Record<string, string>> = {
  ADMIN: "Administrador",
  PASTOR: "Pastor",
  SUPERVISOR: "Supervisor",
  LEADER: "Líder"
};

export default function DashboardPage() {
  const { status, principal } = useSession();

  if (status === "bootstrapping") {
    return (
      <div aria-label="Carregando painel">
        <Skeleton width="50%" height="2.5rem" />
        <Skeleton width="100%" height="6rem" />
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[principal?.roles[0] ?? ""];

  return (
    <section aria-labelledby="dashboard-title">
      <div className="dashboard-hero">
        <p className="dashboard-hero__eyebrow">Ecossistema de Células</p>
        <h1 className="dashboard-hero__title" id="dashboard-title">
          Painel
        </h1>
        <p className="dashboard-hero__description">
          Bem-vindo ao ecossistema de gestão de células. Escolha um atalho para
          começar.
        </p>
        {roleLabel ? (
          <span className="dashboard-hero__role">{roleLabel}</span>
        ) : null}
      </div>
      <div className="dashboard-grid">
        {SHORTCUTS.map((shortcut) => (
          <Link className="dashboard-card" key={shortcut.href} href={shortcut.href}>
            <span className="dashboard-card__icon" aria-hidden="true">
              {shortcut.icon}
            </span>
            <span className="dashboard-card__title">{shortcut.title}</span>
            <span className="dashboard-card__description">{shortcut.description}</span>
          </Link>
        ))}
        {ADMIN_SHORTCUTS.map((shortcut) => (
          <Can key={shortcut.href} capability={shortcut.capability ?? "manageUsers"}>
            <Link className="dashboard-card" href={shortcut.href}>
              <span className="dashboard-card__icon" aria-hidden="true">
                {shortcut.icon}
              </span>
              <span className="dashboard-card__title">{shortcut.title}</span>
              <span className="dashboard-card__description">{shortcut.description}</span>
            </Link>
          </Can>
        ))}
      </div>
    </section>
  );
}

function Icon({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function IconProfile() {
  return (
    <Icon>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

function IconChurch() {
  return (
    <Icon>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 7h.01M12 7h.01M15 7h.01" />
    </Icon>
  );
}

function IconPeople() {
  return (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

function IconCells() {
  return (
    <Icon>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v6l-7 4" />
      <path d="M12 13l7 4" />
    </Icon>
  );
}

function IconUsers() {
  return (
    <Icon>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  );
}
