"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Can } from "@/src/shared/auth/guards";
import { Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";
import { AnalyticsOverview } from "@/src/features/analytics/components/analytics-overview";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

interface Shortcut {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly href: string;
  readonly icon: ReactNode;
  readonly capability?: "manageUsers" | "editPeople" | "viewCells";
}

const SHORTCUTS: readonly Shortcut[] = [
  {
    titleKey: "nav.profile",
    descriptionKey: "dash.shortcut.profile",
    href: "/profile",
    icon: <IconProfile />
  },
  {
    titleKey: "nav.settings",
    descriptionKey: "dash.shortcut.settings",
    href: "/settings",
    icon: <IconChurch />
  },
  {
    titleKey: "nav.people",
    descriptionKey: "dash.shortcut.people",
    href: "/people",
    icon: <IconPeople />,
    capability: "editPeople"
  },
  {
    titleKey: "nav.cells",
    descriptionKey: "dash.shortcut.cells",
    href: "/cells",
    icon: <IconCells />,
    capability: "viewCells"
  }
];

const ADMIN_SHORTCUTS: readonly Shortcut[] = [
  {
    titleKey: "nav.users",
    descriptionKey: "dash.shortcut.users",
    href: "/users",
    icon: <IconUsers />
  }
];

const ROLE_KEYS: Readonly<Record<string, TranslationKey>> = {
  ADMIN: "role.admin",
  PASTOR: "role.pastor",
  SUPERVISOR: "role.supervisor",
  LEADER: "role.leader"
};

export default function DashboardPage() {
  const { status, principal } = useSession();
  const { t } = useI18n();

  if (status === "bootstrapping") {
    return (
      <div aria-label={t("dash.loading")}>
        <Skeleton width="50%" height="2.5rem" />
        <Skeleton width="100%" height="6rem" />
      </div>
    );
  }

  const roleKey = ROLE_KEYS[principal?.roles[0] ?? ""];
  const roleLabel = roleKey ? t(roleKey) : null;

  return (
    <section aria-labelledby="dashboard-title">
      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <p className="dashboard-hero__eyebrow">{t("dash.overview")}</p>
          <h1 className="dashboard-hero__title dark:text-white" id="dashboard-title">{t("dash.title")}</h1>
          <p className="dashboard-hero__description">
            {t("dash.description")}
          </p>
          {roleLabel ? <span className="dashboard-hero__role">{t("dash.access", { role: roleLabel } as TranslationParams)}</span> : null}
        </div>
        <div className="dashboard-hero__network" aria-hidden="true">
          <span className="network-node network-node--center" />
          <span className="network-node network-node--one" />
          <span className="network-node network-node--two" />
          <span className="network-node network-node--three" />
          <span className="network-line network-line--one" />
          <span className="network-line network-line--two" />
          <span className="network-line network-line--three" />
        </div>
      </div>
      <Can capability="viewAnalytics">
        <AnalyticsOverview />
      </Can>
      <div className="dashboard-section-heading px-20">
        <div><p className="dashboard-section-heading__eyebrow">{t("dash.quickAccess")}</p><h2>{t("dash.quickAccess.hint")}</h2></div>
        <p>{t("dash.quickAccess.choose")}</p>
      </div>
      <div className="dashboard-grid">
        {SHORTCUTS.map((shortcut, index) => (
          <Link
            className="dashboard-card"
            key={shortcut.href}
            href={shortcut.href}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="dashboard-card__icon" aria-hidden="true">
              {shortcut.icon}
            </span>
            <span className="dashboard-card__title">{t(shortcut.titleKey)}</span>
            <span className="dashboard-card__description">{t(shortcut.descriptionKey)}</span>
          </Link>
        ))}
        {ADMIN_SHORTCUTS.map((shortcut, index) => (
          <Can key={shortcut.href} capability={shortcut.capability ?? "manageUsers"}>
            <Link
              className="dashboard-card"
              href={shortcut.href}
              style={{ animationDelay: `${(SHORTCUTS.length + index) * 60}ms` }}
            >
              <span className="dashboard-card__icon" aria-hidden="true">
                {shortcut.icon}
              </span>
              <span className="dashboard-card__title">{t(shortcut.titleKey)}</span>
              <span className="dashboard-card__description">{t(shortcut.descriptionKey)}</span>
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
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
    </Icon>
  );
}

function IconChurch() {
  return (
    <Icon>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M12 6h.01M16 6h.01" />
    </Icon>
  );
}

function IconPeople() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
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
