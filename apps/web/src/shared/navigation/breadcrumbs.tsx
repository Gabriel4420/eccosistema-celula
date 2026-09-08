"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";

interface Crumb {
  readonly labelKey: TranslationKey;
  readonly href?: string;
}

const ROUTE_LABELS: ReadonlyArray<{ readonly pattern: RegExp; readonly crumbs: readonly Crumb[] }> = [
  { pattern: /^\/dashboard$/, crumbs: [{ labelKey: "breadcrumb.dashboard" }] },
  { pattern: /^\/profile$/, crumbs: [{ labelKey: "breadcrumb.dashboard", href: "/dashboard" }, { labelKey: "breadcrumb.profile" }] },
  { pattern: /^\/users\/import$/, crumbs: [{ labelKey: "breadcrumb.users", href: "/users" }, { labelKey: "breadcrumb.usersImport" }] },
  { pattern: /^\/users\/new$/, crumbs: [{ labelKey: "breadcrumb.users", href: "/users" }, { labelKey: "breadcrumb.usersNew" }] },
  { pattern: /^\/users\/[^/]+$/, crumbs: [{ labelKey: "breadcrumb.users", href: "/users" }, { labelKey: "breadcrumb.usersDetail" }] },
  { pattern: /^\/users$/, crumbs: [{ labelKey: "breadcrumb.users" }] },
  { pattern: /^\/church\/settings$/, crumbs: [{ labelKey: "breadcrumb.church", href: "/dashboard" }, { labelKey: "breadcrumb.churchSettings" }] },
  { pattern: /^\/people\/import$/, crumbs: [{ labelKey: "breadcrumb.people", href: "/people" }, { labelKey: "breadcrumb.peopleImport" }] },
  { pattern: /^\/people\/new$/, crumbs: [{ labelKey: "breadcrumb.people", href: "/people" }, { labelKey: "breadcrumb.peopleNew" }] },
  { pattern: /^\/people\/[^/]+$/, crumbs: [{ labelKey: "breadcrumb.people", href: "/people" }, { labelKey: "breadcrumb.peopleDetail" }] },
  { pattern: /^\/people$/, crumbs: [{ labelKey: "breadcrumb.people" }] },
  { pattern: /^\/cells\/import$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsImport" }] },
  { pattern: /^\/cells\/new$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsNew" }] },
  { pattern: /^\/cells\/[^/]+\/meetings\/new$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsMeetings", href: "#" }, { labelKey: "breadcrumb.cellsMeetingNew" }] },
  { pattern: /^\/cells\/[^/]+\/meetings\/[^/]+$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsMeetings", href: "#" }, { labelKey: "breadcrumb.cellsMeetingDetail" }] },
  { pattern: /^\/cells\/[^/]+\/meetings$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsMeetings" }] },
  { pattern: /^\/cells\/[^/]+$/, crumbs: [{ labelKey: "breadcrumb.cells", href: "/cells" }, { labelKey: "breadcrumb.cellsDetail" }] },
  { pattern: /^\/cells$/, crumbs: [{ labelKey: "breadcrumb.cells" }] }
];

function crumbsFor(pathname: string): readonly Crumb[] {
  for (const route of ROUTE_LABELS) {
    if (route.pattern.test(pathname)) {
      return route.crumbs.map((crumb) => {
        if (crumb.href === "#") {
          const cellMatch = pathname.match(/\/cells\/([^/]+)\//);
          if (cellMatch && crumb.labelKey === "breadcrumb.cellsMeetings") {
            return { ...crumb, href: `/cells/${cellMatch[1]}/meetings` };
          }
        }
        return crumb;
      });
    }
  }
  return [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const crumbs = crumbsFor(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label={t("breadcrumb.aria")} className="breadcrumbs">
      <ol className="breadcrumbs__list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const label = t(crumb.labelKey);
          return (
            <li key={crumb.labelKey} className="breadcrumbs__item">
              {isLast || !crumb.href ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link className="breadcrumbs__link" href={crumb.href}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}