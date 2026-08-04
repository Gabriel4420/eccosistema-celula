import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="auth-shell">
      <div className="empty-state">
        <p className="empty-state__title">Acesso negado</p>
        <p>
          Sua conta não possui permissão para acessar este recurso. Caso precise
          de acesso, fale com um administrador.
        </p>
        <Link className="button button--secondary" href="/dashboard">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
