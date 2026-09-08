import type { OverviewResponse, SeriesPoint, CellsSummaryResponse, CellSummaryItem } from "@mission-atos/contracts";
import Link from "next/link";
import { cacheStore } from "@/src/shared/cache/cache";
import { ApiError } from "@/src/shared/api/api-error";
import { EmptyState, ErrorState, Skeleton } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getCellsSummary, getMonthlySeries, getOverview } from "../api/analytics-api";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { AppLocale, TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

export function AnalyticsOverview() {
  const { api } = useSession();
  const { t, locale } = useI18n();

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
      <div className="analytics" aria-label={t("analytics.loading")}>
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
      return <EmptyState title={t("analytics.title")}>{t("analytics.forbidden")}</EmptyState>;
    }
    return (
      <ErrorState title={t("analytics.unavailable")} onRetry={() => { void overview.reload(); void series.reload(); void cells.reload(); }}>
        {t("analytics.unavailable.desc")}
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
          <p className="analytics__eyebrow">{t("analytics.title")}</p>
          <h2 className="analytics__title" id="analytics-title">{t("analytics.subtitle")}</h2>
        </div>
        {overviewData?.period ? (
          <p className="analytics__period">
            {formatRange(overviewData.period.from, overviewData.period.to, locale)}
          </p>
        ) : null}
      </div>

      {overviewData ? (
        <>
          <StatCards overview={overviewData} t={t} />
          <div className="analytics__columns">
            <MonthlyChart series={seriesData} t={t} locale={locale} />
            <CellAlerts cells={cellsData} t={t} locale={locale} />
          </div>
        </>
      ) : (
        <EmptyState title={t("analytics.empty")}>{t("analytics.empty.desc")}</EmptyState>
      )}
    </div>
  );
}

function StatCards({ overview, t }: { readonly overview: OverviewResponse; readonly t: (key: TranslationKey, params?: TranslationParams) => string }) {
  const stats: ReadonlyArray<{ key: string; label: string; value: string; hint?: string }> = [
    { key: "people", label: t("analytics.people"), value: String(overview.totals.people), hint: deltaLabel(overview.delta?.people, t) },
    { key: "activeCells", label: t("analytics.cellActive"), value: String(overview.totals.activeCells), hint: deltaLabel(overview.delta?.activeCells, t) },
    { key: "members", label: t("analytics.members"), value: String(overview.totals.members), hint: `+${overview.totals.formingCells} ${t("analytics.forming")}` },
    { key: "attendanceRate", label: t("analytics.attendanceRate"), value: overview.attendance.attendanceRate === null ? "—" : `${overview.attendance.attendanceRate}%`, hint: overview.attendance.attendanceRate === null ? t("analytics.noData") : undefined },
    { key: "averagePresent", label: t("analytics.averagePresent"), value: String(overview.attendance.averagePresent), hint: undefined },
    { key: "completionRate", label: t("analytics.completionRate"), value: `${overview.meetings.completionRate}%`, hint: `${overview.meetings.completed}/${overview.meetings.total} ${t("analytics.meetingsShort")}` },
    { key: "visitors", label: t("analytics.visitors"), value: String(overview.visitors.total), hint: deltaLabel(overview.delta?.visitors, t) }
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

function MonthlyChart({ series, t, locale }: { readonly series: readonly SeriesPoint[]; readonly t: (key: TranslationKey) => string; readonly locale: AppLocale }) {
  const points = series;

  if (points.length === 0) {
    return (
      <section className="analytics-panel" aria-label={t("analytics.evolution")}>
        <h3 className="analytics-panel__title">{t("analytics.evolution")}</h3>
        <EmptyState title={t("analytics.evolution.empty")}>{t("analytics.evolution.empty.desc")}</EmptyState>
      </section>
    );
  }

  const label = (month: string): string => {
    const [year, monthNumber] = month.split("-");
    if (!year || !monthNumber) return month;
    return new Intl.DateTimeFormat(locale, {
      month: "2-digit",
      year: "2-digit",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1)));
  };

  return (
    <section className="analytics-panel" aria-label={t("analytics.evolution")}>
      <h3 className="analytics-panel__title">{t("analytics.evolution")}</h3>
      <div className="analytics-charts">
        <MeetingChart points={points} label={label} t={t} />
        <AttendanceChart points={points} label={label} t={t} />
      </div>
    </section>
  );
}

function MeetingChart({
  points,
  label,
  t
}: {
  readonly points: readonly SeriesPoint[];
  readonly label: (month: string) => string;
  readonly t: (key: TranslationKey) => string;
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
      <p className="analytics-chart-panel__label">{t("analytics.meetingsShort")}</p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("analytics.meetingsChartAria")}
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
            <g key={point.month} role="graphics-symbol" aria-label={`${label(point.month)}: ${point.meetings} ${t("analytics.meetingsShort")}`}>
              <title>{`${label(point.month)}: ${point.meetings} ${t("analytics.meetingsShort")}`}</title>
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
  label,
  t
}: {
  readonly points: readonly SeriesPoint[];
  readonly label: (month: string) => string;
  readonly t: (key: TranslationKey) => string;
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
      <p className="analytics-chart-panel__label">{t("analytics.people")}</p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("analytics.attendanceChartAria")}
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
            <g key={point.month} role="graphics-symbol" aria-label={`${label(point.month)}: ${point.presentMembers} ${t("analytics.presentMembersShort")}, ${point.visitors} ${t("analytics.visitorsShort")}`}>
              <title>{`${label(point.month)}: ${point.presentMembers} ${t("analytics.presentMembersShort")}, ${point.visitors} ${t("analytics.visitorsShort")}`}</title>
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
        <span className="analytics-chart__legend-item"><i className="analytics-chart__swatch analytics-chart__swatch--present" />{t("attendance.present")}</span>
        <span className="analytics-chart__legend-item"><i className="analytics-chart__swatch analytics-chart__swatch--visitors" />{t("reports.visitors.column.visitor")}</span>
      </div>
    </div>
  );
}

function CellAlerts({ cells, t, locale }: { readonly cells?: CellsSummaryResponse; readonly t: (key: TranslationKey, params?: TranslationParams) => string; readonly locale: AppLocale }) {
  return (
    <section className="analytics-panel" aria-label={t("analytics.cellAlerts")}>
      <h3 className="analytics-panel__title">{t("analytics.cellAlerts")}</h3>
      {!cells || cells.cells.length === 0 ? (
        <EmptyState title={t("analytics.emptyCells")}>{t("analytics.emptyCells.desc")}</EmptyState>
      ) : (
        <>
          {cells.withoutRecentMeeting > 0 ? (
            <Link className="analytics-alert analytics-alert--warning" href="/cells">
              <strong>{t("analytics.withoutRecentMeeting", { count: cells.withoutRecentMeeting, days: cells.recentMeetingWindowDays })}</strong>
              <span>{t("analytics.clickToSeeCells")}</span>
            </Link>
          ) : (
            <p className="analytics-alert analytics-alert--ok">
              <strong>{t("analytics.allRecent")}</strong>
            </p>
          )}
          <ul className="analytics-list">
            {cells.cells.slice(0, 5).map((cell: CellSummaryItem) => (
              <li className="analytics-list__item" key={cell.id}>
                <div>
                  <strong>{cell.name}</strong>
                  <small>{cell.code} · {t(CELL_STATUS_KEYS[cell.status] ?? "analytics.statusUnknown")}</small>
                </div>
                <span className="analytics-list__meta">
                  {cell.lastCompletedAt ? `${t("analytics.last")} ${shortDate(cell.lastCompletedAt, locale)}` : t("analytics.noCompleteMeeting")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const CELL_STATUS_KEYS: Record<string, TranslationKey> = {
  FORMING: "cells.status.formative",
  ACTIVE: "cells.status.active",
  SUSPENDED: "cells.status.suspended",
  CLOSED: "cells.status.closed"
};

function formatRange(from: string, to: string, locale: AppLocale): string {
  return `${shortDate(from, locale)} — ${shortDate(to, locale)}`;
}

function shortDate(civil: string, locale: AppLocale): string {
  const [year, month, day] = civil.split("-");
  if (!year || !month || !day) return civil;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

function deltaLabel(delta: number | null | undefined, t: (key: TranslationKey, params?: TranslationParams) => string): string | undefined {
  if (delta === null || delta === undefined || delta === 0) return undefined;
  return delta > 0
    ? `+${delta} ${t("analytics.vsPrevious")}`
    : `${delta} ${t("analytics.vsPrevious")}`;
}

export function invalidateAnalyticsCache(): void {
  cacheStore("analytics").invalidatePrefix("");
}
