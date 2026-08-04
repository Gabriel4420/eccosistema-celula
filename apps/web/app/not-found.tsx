import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="auth-shell">
      <div className="empty-state">
        <p className="empty-state__title">Página não encontrada</p>
        <p>A página solicitada não existe ou foi movida.</p>
        <Link className="button button--secondary" href="/">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
