"use client";

import Link from "next/link";
import { Can } from "@/src/shared/auth/guards";
import { Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";

interface Shortcut {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly capability?: "manageUsers" | "editPeople";
}

const SHORTCUTS: readonly Shortcut[] = [
  {
    title: "Meu perfil",
    description: "Atualize seus dados e altere sua senha.",
    href: "/profile"
  },
  {
    title: "Configurações da igreja",
    description: "Consulte os dados institucionais e ajustes.",
    href: "/church/settings"
  },
  {
    title: "Pessoas",
    description: "Consulte e gerencie as pessoas.",
    href: "/people",
    capability: "editPeople"
  }
];

const ADMIN_SHORTCUTS: readonly Shortcut[] = [
  {
    title: "Usuários",
    description: "Gerencie contas, papéis e acesso.",
    href: "/users",
    capability: "manageUsers"
  }
];

export default function DashboardPage() {
  const { status } = useSession();

  if (status === "bootstrapping") {
    return (
      <div aria-label="Carregando painel">
        <Skeleton width="50%" height="2.5rem" />
        <Skeleton width="100%" height="6rem" />
      </div>
    );
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className="page-header">
        <h1 className="page-title" id="dashboard-title">
          Painel
        </h1>
        <p className="page-description">
          Bem-vindo ao ecossistema de gestão de células. Escolha um atalho para
          começar.
        </p>
      </div>
      <div className="dashboard-grid">
        {SHORTCUTS.map((shortcut) => (
          <Link className="dashboard-card" key={shortcut.href} href={shortcut.href}>
            <span className="dashboard-card__title">{shortcut.title}</span>
            <span>{shortcut.description}</span>
          </Link>
        ))}
        {ADMIN_SHORTCUTS.map((shortcut) => (
          <Can key={shortcut.href} capability={shortcut.capability ?? "manageUsers"}>
            <Link className="dashboard-card" href={shortcut.href}>
              <span className="dashboard-card__title">{shortcut.title}</span>
              <span>{shortcut.description}</span>
            </Link>
          </Can>
        ))}
      </div>
    </section>
  );
}
