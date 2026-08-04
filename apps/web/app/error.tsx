"use client";

import { Button } from "@/src/shared/components";

interface ErrorPageProps {
  readonly error: Error;
  readonly reset: () => void;
}

export default function GlobalErrorBoundary({ reset }: ErrorPageProps) {
  return (
    <main className="auth-shell">
      <div className="error-state" role="alert">
        <h1 className="error-state__title">Algo deu errado</h1>
        <p>Não foi possível concluir a operação. Tente novamente em instantes.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
