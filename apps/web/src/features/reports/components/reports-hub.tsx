"use client";

import Link from "next/link";
import { Can } from "@/src/shared/auth/guards";
import { useI18n } from "@/src/shared/i18n/language-provider";

export function ReportsHub() {
  const { t } = useI18n();
  const REPORT_CARDS = [
    { href: "/reports/pending", title: t("reports.hub.card.pending"), description: t("reports.hub.card.pending.desc"), capability: "viewReports" as const },
    { href: "/reports/attendance", title: t("reports.hub.card.attendance"), description: t("reports.hub.card.attendance.desc"), capability: "viewReports" as const },
    { href: "/reports/visitors", title: t("reports.hub.card.visitors"), description: t("reports.hub.card.visitors.desc"), capability: "viewReports" as const },
    { href: "/reports/meetings", title: t("reports.hub.card.meetings"), description: t("reports.hub.card.meetings.desc"), capability: "viewReports" as const }
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{t("reports.hub.title")}</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        {t("reports.hub.subtitle")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {REPORT_CARDS.map((card) => (
          <Can key={card.href} capability={card.capability}>
            <Link
              href={card.href}
              style={{
                display: "block",
                padding: "1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.15s"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{card.title}</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>{card.description}</p>
            </Link>
          </Can>
        ))}
      </div>
    </div>
  );
}
