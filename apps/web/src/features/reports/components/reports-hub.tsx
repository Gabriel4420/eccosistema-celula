"use client";

import Link from "next/link";
import { Can } from "@/src/shared/auth/guards";

const REPORT_CARDS = [
  { href: "/reports/pending", title: "Relatórios Pendentes", description: "Encontros concluídos sem relatório submetido", capability: "viewReports" },
  { href: "/reports/attendance", title: "Frequência", description: "Resumo e detalhamento de frequência por célula", capability: "viewReports" },
  { href: "/reports/visitors", title: "Visitantes", description: "Lista de visitantes e métricas de contato", capability: "viewReports" },
  { href: "/reports/meetings", title: "Encontros", description: "Relatório consolidado de encontros por período", capability: "viewReports" }
] as const;

export function ReportsHub() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Relatórios</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Selecione o tipo de relatório desejado.
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
