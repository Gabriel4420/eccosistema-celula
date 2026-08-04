"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Crumb {
  readonly label: string;
  readonly href?: string;
}

const ROUTE_LABELS: ReadonlyArray<{ readonly pattern: RegExp; readonly crumbs: readonly Crumb[] }> = [
  { pattern: /^\/dashboard$/, crumbs: [{ label: "Painel" }] },
  { pattern: /^\/profile$/, crumbs: [{ label: "Painel", href: "/dashboard" }, { label: "Meu perfil" }] },
  { pattern: /^\/users\/new$/, crumbs: [{ label: "Usuários", href: "/users" }, { label: "Novo usuário" }] },
  { pattern: /^\/users\/[^/]+$/, crumbs: [{ label: "Usuários", href: "/users" }, { label: "Detalhe do usuário" }] },
  { pattern: /^\/users$/, crumbs: [{ label: "Usuários" }] },
  { pattern: /^\/church\/settings$/, crumbs: [{ label: "Igreja", href: "/dashboard" }, { label: "Configurações" }] },
  { pattern: /^\/people\/new$/, crumbs: [{ label: "Pessoas", href: "/people" }, { label: "Nova pessoa" }] },
  { pattern: /^\/people\/[^/]+$/, crumbs: [{ label: "Pessoas", href: "/people" }, { label: "Detalhe da pessoa" }] },
  { pattern: /^\/people$/, crumbs: [{ label: "Pessoas" }] }
];

function crumbsFor(pathname: string): readonly Crumb[] {
  for (const route of ROUTE_LABELS) {
    if (route.pattern.test(pathname)) return route.crumbs;
  }
  return [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Trilha de navegação" className="breadcrumbs">
      <ol className="breadcrumbs__list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.label} className="breadcrumbs__item">
              {isLast || !crumb.href ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link className="breadcrumbs__link" href={crumb.href}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
