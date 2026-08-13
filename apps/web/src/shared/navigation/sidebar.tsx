"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Can } from "@/src/shared/auth/guards";

const BASE_LINKS: ReadonlyArray<{ readonly href: string; readonly label: string }> = [
  { href: "/dashboard", label: "Painel" },
  { href: "/profile", label: "Meu perfil" },
  { href: "/church/settings", label: "Igreja" },
  { href: "/people", label: "Pessoas" },
  { href: "/cells", label: "Células" }
];

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    ...BASE_LINKS.map((link) => (
      <NavLink key={link.href} href={link.href} label={link.label} current={pathname} />
    )),
    <Can key="users" capability="manageUsers">
      <NavLink href="/users" label="Usuários" current={pathname} />
    </Can>
  ];

  return (
    <aside className="sidebar">
      <p className="sidebar__brand">Ecossistema de Células</p>
      <nav aria-label="Navegação principal" className="sidebar__nav">
        {links}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  label,
  current
}: {
  readonly href: string;
  readonly label: string;
  readonly current: string;
}) {
  const isCurrent = current === href || (href !== "/dashboard" && current.startsWith(`${href}/`));
  return (
    <Link
      className="sidebar__link"
      href={href}
      aria-current={isCurrent ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
