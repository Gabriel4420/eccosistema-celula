import { parseWebPublicEnvironment } from "@mission-atos/config/public";

export default function HomePage() {
  const environment = parseWebPublicEnvironment({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  });

  return (
    <main className="page-shell">
      <section aria-labelledby="foundation-title" className="status-card">
        <p className="eyebrow">Fundação técnica</p>
        <h1 id="foundation-title">Ecossistema de Células</h1>
        <p>
          A aplicação web está pronta para receber os próximos planos do
          produto.
        </p>
        <dl>
          <div>
            <dt>Web</dt>
            <dd>Next.js com App Router</dd>
          </div>
          <div>
            <dt>API local</dt>
            <dd>{environment.NEXT_PUBLIC_API_URL}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
