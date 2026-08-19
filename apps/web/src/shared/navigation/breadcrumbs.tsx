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
  { pattern: /^\/users\/new$/, crumbs: [{ label: "Usuarios", href: "/users" }, { label: "Novo usuario" }] },
  { pattern: /^\/users\/[^/]+$/, crumbs: [{ label: "Usuarios", href: "/users" }, { label: "Detalhe do usuario" }] },
  { pattern: /^\/users$/, crumbs: [{ label: "Usuarios" }] },
  { pattern: /^\/church\/settings$/, crumbs: [{ label: "Igreja", href: "/dashboard" }, { label: "Configuracoes" }] },
  { pattern: /^\/people\/new$/, crumbs: [{ label: "Pessoas", href: "/people" }, { label: "Nova pessoa" }] },
  { pattern: /^\/people\/[^/]+$/, crumbs: [{ label: "Pessoas", href: "/people" }, { label: "Detalhe da pessoa" }] },
  { pattern: /^\/people$/, crumbs: [{ label: "Pessoas" }] },
  { pattern: /^\/cells\/new$/, crumbs: [{ label: "Celulas", href: "/cells" }, { label: "Nova celula" }] },
  { pattern: /^\/cells\/[^/]+\/meetings\/new$/, crumbs: [{ label: "Celulas", href: "/cells" }, { label: "Encontros", href: "#" }, { label: "Novo encontro" }] },
  { pattern: /^\/cells\/[^/]+\/meetings\/[^/]+$/, crumbs: [{ label: "Celulas", href: "/cells" }, { label: "Encontros", href: "#" }, { label: "Detalhe do encontro" }] },
  { pattern: /^\/cells\/[^/]+\/meetings$/, crumbs: [{ label: "Celulas", href: "/cells" }, { label: "Encontros" }] },
  { pattern: /^\/cells\/[^/]+$/, crumbs: [{ label: "Celulas", href: "/cells" }, { label: "Detalhe da celula" }] },
  { pattern: /^\/cells$/, crumbs: [{ label: "Celulas" }] }
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
