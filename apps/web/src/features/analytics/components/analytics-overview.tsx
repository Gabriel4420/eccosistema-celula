import type { OverviewResponse, SeriesPoint, CellsSummaryResponse, CellSummaryItem } from "@mission-atos/contracts";
import Link from "next/link";
import { cacheStore } from "@/src/shared/cache/cache";
import { ApiError } from "@/src/shared/api/api-error";
import { EmptyState, ErrorState, Skeleton } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getCellsSummary, getMonthlySeries, getOverview } from "../api/analytics-api";

export function AnalyticsOverview() {
  const { api } = useSession();

  const overview = useRemoteQuery({
    fetcher: () => getOverview(api, { period: "30d" }),
    cacheName: "analytics",
    cacheKey: "overview:30d",
    ttlMs: 60_000
  });
  const series = useRemoteQuery({
    fetcher: () => getMonthlySeries(api, {}),
    cacheName: "analytics",
    cacheKey: "series:default",
    ttlMs: 60_000
  });
  const cells = useRemoteQuery({
    fetcher: () => getCellsSummary(api, 14),
    cacheName: "analytics",
    cacheKey: "cells:summary:14",
    ttlMs: 60_000
  });

  const loading = (overview.loading && !overview.data) || (series.loading && !series.data) || (cells.loading && !cells.data);
  const error = overview.error ?? series.error ?? cells.error;

  if (loading) {
    return (
      <div className="analytics" aria-label="Carregando indicadores">
        <div className="analytics__cards">
          <Skeleton height="5.5rem" />
          <Skeleton height="5.5rem" />
          <Skeleton height="5.5rem" />
          <Skeleton height="5.5rem" />
        </div>
        <Skeleton height="12rem" />
      </div>
    );
  }

  if (error) {
    const denied = error instanceof ApiError && error.status === 403;
    if (denied) {
      return <EmptyState title="Indicadores indisponíveis">Sua conta não possui permissão para visualizar os indicadores.</EmptyState>;
    }
    return (
      <ErrorState title="Indicadores indisponíveis no momento" onRetry={() => { void overview.reload(); void series.reload(); void cells.reload(); }}>
        Não foi possível carregar os indicadores do painel. Tente novamente em instantes.
      </ErrorState>
    );
  }

  const overviewData = overview.data;
  const seriesData = series.data ?? [];
  const cellsData = cells.data;

  return (
    <div className="analytics pb-10" aria-labelledby="analytics-title">
      <div className="analytics__heading">
        <div>
          <p className="analytics__eyebrow">Indicadores</p>
          <h2 className="analytics__title" id="analytics-title">Saúde da igreja — últimos 30 dias</h2>
        </div>
        {overviewData?.period ? (
          <p className="analytics__period">
            {formatRange(overviewData.period.from, overviewData.period.to)}
          </p>
        ) : null}
      </div>

      {overviewData ? (
        <>
          <StatCards overview={overviewData} />
          <div className="analytics__columns">
            <MonthlyChart series={seriesData} />
            <CellAlerts cells={cellsData} />
          </div>
        </>
      ) : (
        <EmptyState title="Sem indicadores ainda">Não há dados suficientes para exibir indicadores.</EmptyState>
      )}
    </div>
  );
}

function StatCards({ overview }: { readonly overview: OverviewResponse }) {
  const stats: ReadonlyArray<{ key: string; label: string; value: string; hint?: string }> = [
    { key: "people", label: "Pessoas", value: String(overview.totals.people), hint: deltaLabel(overview.delta?.people) },
    { key: "activeCells", label: "Células ativas", value: String(overview.totals.activeCells), hint: deltaLabel(overview.delta?.activeCells) },
    { key: "members", label: "Membros", value: String(overview.totals.members), hint: `+${overview.totals.formingCells} formando` },
    { key: "attendanceRate", label: "Taxa de presença", value: overview.attendance.attendanceRate === null ? "—" : `${overview.attendance.attendanceRate}%`, hint: overview.attendance.attendanceRate === null ? "sem dados" : undefined },
    { key: "averagePresent", label: "Público médio", value: String(overview.attendance.averagePresent), hint: undefined },
    { key: "completionRate", label: "Realização", value: `${overview.meetings.completionRate}%`, hint: `${overview.meetings.completed}/${overview.meetings.total} encontros` },
    { key: "visitors", label: "Visitantes", value: String(overview.visitors.total), hint: deltaLabel(overview.delta?.visitors) }
  ];

  return (
    <div className="analytics__cards">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.key}>
          <p className="stat-card__label">{stat.label}</p>
          <p className="stat-card__value">{stat.value}</p>
          {stat.hint ? <p className="stat-card__hint">{stat.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ series }: { readonly series: readonly SeriesPoint[] }) {
  const points = series;

  if (points.length === 0) {
    return (
      <section className="analytics-panel" aria-label="Evolução mensal">
        <h3 className="analytics-panel__title">Evolução mensal</h3>
        <EmptyState title="Sem série mensal">Ainda não há encontros no período.</EmptyState>
      </section>
    );
  }

  const label = (month: string): string => {
    const parts = month.split("-");
    return `${parts[1]}/${parts[0]!.slice(2)}`;
  };

  return (
    <section className="analytics-panel" aria-label="Evolução mensal">
      <h3 className="analytics-panel__title">Evolução mensal</h3>
      <div className="analytics-charts">
        <MeetingChart points={points} label={label} />
        <AttendanceChart points={points} label={label} />
      </div>
    </section>
  );
}

function MeetingChart({
  points,
  label
}: {
  readonly points: readonly SeriesPoint[];
  readonly label: (month: string) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.meetings));
  const width = 280;
  const height = 150;
  const padL = 30;
  const padB = 22;
  const padT = 8;
  const plotW = width - padL - 8;
  const plotH = height - padT - padB;
  const colW = plotW / points.length;
  const barW = Math.min(18, colW * 0.45);

  return (
    <div className="analytics-chart-panel">
      <p className="analytics-chart-panel__label">Encontros</p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de encontros por mês"
        preserveAspectRatio="xMidYMid meet"
      >
        <g aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padT + (1 - fraction) * plotH;
            return <line key={fraction} x1={padL} y1={y} x2={width - 8} y2={y} className="analytics-chart__grid" />;
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padT + (1 - fraction) * plotH;
            const value = Math.round(fraction * max);
            return (
              <text key={`label-${fraction}`} x={padL - 4} y={y + 3} textAnchor="end" className="analytics-chart__axis-label">
                {value}
              </text>
            );
          })}
        </g>
        {points.map((point, index) => {
          const cx = padL + colW * (index + 0.5);
          const barHeight = max > 0 ? (point.meetings / max) * plotH : 0;
          return (
            <g key={point.month} role="graphics-symbol" aria-label={`${label(point.month)}: ${point.meetings} encontros`}>
              <title>{`${label(point.month)}: ${point.meetings} encontros`}</title>
              <rect
                x={cx - barW / 2}
                y={padT + plotH - barHeight}
                width={barW}
                height={barHeight}
                className="analytics-chart__meetings"
              />
            </g>
          );
        })}
        <g>
          {points.map((point, index) => (
            <text key={point.month} x={padL + colW * (index + 0.5)} y={height - 6} textAnchor="middle" className="analytics-chart__label">
              {label(point.month)}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

function AttendanceChart({
  points,
  label
}: {
  readonly points: readonly SeriesPoint[];
  readonly label: (month: string) => string;
}) {
  const max = Math.max(1, ...points.flatMap((p) => [p.presentMembers, p.visitors]));
  const width = 280;
  const height = 150;
  const padL = 30;
  const padB = 22;
  const padT = 8;
  const plotW = width - padL - 8;
  const plotH = height - padT - padB;
  const colW = plotW / points.length;
  const barW = Math.min(14, colW * 0.28);

  return (
    <div className="analytics-chart-panel">
      <p className="analytics-chart-panel__label">Pessoas</p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de presentes e visitantes por mês"
        preserveAspectRatio="xMidYMid meet"
      >
        <g aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padT + (1 - fraction) * plotH;
            return <line key={fraction} x1={padL} y1={y} x2={width - 8} y2={y} className="analytics-chart__grid" />;
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padT + (1 - fraction) * plotH;
            const value = Math.round(fraction * max);
            return (
              <text key={`label-${fraction}`} x={padL - 4} y={y + 3} textAnchor="end" className="analytics-chart__axis-label">
                {value}
              </text>
            );
          })}
        </g>
        {points.map((point, index) => {
          const cx = padL + colW * (index + 0.5);
          const presentHeight = max > 0 ? (point.presentMembers / max) * plotH : 0;
          const visitorHeight = max > 0 ? (point.visitors / max) * plotH : 0;
          return (
            <g key={point.month} role="graphics-symbol" aria-label={`${label(point.month)}: ${point.presentMembers} presentes, ${point.visitors} visitantes`}>
              <title>{`${label(point.month)}: ${point.presentMembers} presentes, ${point.visitors} visitantes`}</title>
              <rect
                x={cx - barW}
                y={padT + plotH - presentHeight}
                width={barW}
                height={presentHeight}
                className="analytics-chart__present"
              />
              <rect
                x={cx + barW * 0.1}
                y={padT + plotH - visitorHeight}
                width={barW * 0.8}
                height={visitorHeight}
                className="analytics-chart__visitors"
              />
            </g>
          );
        })}
        <g>
          {points.map((point, index) => (
            <text key={point.month} x={padL + colW * (index + 0.5)} y={height - 6} textAnchor="middle" className="analytics-chart__label">
              {label(point.month)}
            </text>
          ))}
        </g>
      </svg>
      <div className="analytics-chart__legend">
        <span className="analytics-chart__legend-item"><i className="analytics-chart__swatch analytics-chart__swatch--present" />Presentes</span>
        <span className="analytics-chart__legend-item"><i className="analytics-chart__swatch analytics-chart__swatch--visitors" />Visitantes</span>
      </div>
    </div>
  );
}

function CellAlerts({ cells }: { readonly cells?: CellsSummaryResponse }) {
  return (
    <section className="analytics-panel" aria-label="Alertas das células">
      <h3 className="analytics-panel__title">Atenção às células</h3>
      {!cells || cells.cells.length === 0 ? (
        <EmptyState title="Sem células">Nenhuma célula encontrada para gerar alertas.</EmptyState>
      ) : (
        <>
          {cells.withoutRecentMeeting > 0 ? (
            <Link className="analytics-alert analytics-alert--warning" href="/cells">
              <strong>{cells.withoutRecentMeeting} célula{cells.withoutRecentMeeting === 1 ? "" : "s"} sem encontro há {cells.recentMeetingWindowDays} dias</strong>
              <span>Clique para ver as células.</span>
            </Link>
          ) : (
            <p className="analytics-alert analytics-alert--ok">
              <strong>Todas as células ativas realizaram encontros recentes.</strong>
            </p>
          )}
          <ul className="analytics-list">
            {cells.cells.slice(0, 5).map((cell: CellSummaryItem) => (
              <li className="analytics-list__item" key={cell.id}>
                <div>
                  <strong>{cell.name}</strong>
                  <small>{cell.code} · {STATUS_LABEL_RAW[cell.status] ?? cell.status}</small>
                </div>
                <span className="analytics-list__meta">
                  {cell.lastCompletedAt ? `últ. ${shortDate(cell.lastCompletedAt)}` : "sem encontro completo"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const STATUS_LABEL_RAW: Record<string, string> = {
  FORMING: "Em formação",
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  CLOSED: "Encerrada"
};

function formatRange(from: string, to: string): string {
  return `${shortDate(from)} — ${shortDate(to)}`;
}

function shortDate(civil: string): string {
  const parts = civil.split("-");
  if (parts.length !== 3) return civil;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function deltaLabel(delta: number | null | undefined): string | undefined {
  if (delta === null || delta === undefined || delta === 0) return undefined;
  return delta > 0 ? `+${delta} vs. anterior` : `${delta} vs. anterior`;
}

export function invalidateAnalyticsCache(): void {
  cacheStore("analytics").invalidatePrefix("");
}
