"use client";

import Link from "next/link";
import { Save, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { normalizeChurchPhone } from "@mission-atos/contracts";
import {
  Alert,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextareaField,
  TextField,
} from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import {
  getPerson,
  updatePerson,
  updatePersonStatus,
} from "@/src/features/people/api/people-api";

const PEOPLE_CACHE = "people";

export function PersonDetail() {
  const { api } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data: person,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () => getPerson(api, id),
    cacheName: PEOPLE_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000,
  });

  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmInactivate, setConfirmInactivate] = useState(false);

  if (loading && !person) {
    return (
      <div aria-label="Carregando pessoa">
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !person) {
    return (
      <ErrorState
        title="Não foi possível carregar a pessoa"
        onRetry={() => void reload()}
      >
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  if (!person) {
    return (
      <EmptyState title="Pessoa não encontrada">
        A pessoa solicitada não existe ou não está disponível.
      </EmptyState>
    );
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    const fields: ReadonlyArray<[string, string | null]> = [
      ["fullName", person.fullName],
      ["email", person.email],
      ["birthDate", person.birthDate],
      ["gender", person.gender],
    ];
    for (const [key, original] of fields) {
      const value = String(formData.get(key) ?? "").trim();
      if (value !== (original ?? "")) payload[key] = value;
    }
    const phone = normalizeChurchPhone(String(formData.get("phone") ?? ""));
    if (phone !== (person.phone ?? "")) payload.phone = phone;
    const observations = String(formData.get("observations") ?? "").trim();
    if (observations !== (person.observations ?? ""))
      payload.observations = observations;
    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: "Nenhuma alteração",
        description: "Não havia dados novos para salvar.",
      });
      return;
    }
    setBusy(true);
    try {
      await updatePerson(api, id, payload);
      cacheStore(PEOPLE_CACHE).invalidatePrefix("detail");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: "Pessoa atualizada",
        description: "Os dados foram salvos.",
      });
    } catch {
      setFeedback({
        kind: "error",
        message:
          "Não foi possível salvar as alterações. Verifique os dados e tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  };

  const runInactivate = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await updatePersonStatus(api, id, "INACTIVE");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("detail");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      setConfirmInactivate(false);
      await reload();
      toast({
        kind: "success",
        title: "Pessoa inativada",
        description: "Ela será listada somente para administradores.",
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível inativar a pessoa. Tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  };

  function formatPhone(value: string | null | undefined): string {
    const digits = (value ?? "").replace(/\D/g, "");

    const patterns: Array<[RegExp, string]> = [
      [/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3"], // 11 dígitos → celular
      [/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3"], // 10 dígitos → fixo
      [/^(\d{2})(\d{2})(\d{5})(\d{4})$/, "+$1 ($2) $3-$4"], // com DDI (+55)
    ];

    for (const [re, format] of patterns) {
      if (re.test(digits)) return digits.replace(re, format);
    }

    return digits; // fallback: retorna só os dígitos
  }

  return (
    <section aria-labelledby="person-title">
      <div className="page-header">
        <h1 className="page-title" id="person-title">
          {person.fullName}
        </h1>
        <Link className="breadcrumbs__link" href="/people">
          Voltar para pessoas
        </Link>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.kind}
          title={feedback.kind === "success" ? "Sucesso" : "Falha"}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">Status</span>
          <StatusBadge status={person.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">E-mail</span>
          <span className="detail-list__value">{person.email ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Telefone</span>
          <span className="detail-list__value">
            {formatPhone(person.phone) ?? "—"}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Nascimento</span>
          <span className="detail-list__value">{person.birthDate ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Gênero</span>
          <span className="detail-list__value">{person.gender ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Cadastro</span>
          <span className="detail-list__value">
            {person.createdAt
              .toString()
              .substring(0, 10)
              .match(/[\d-]+/)?.[0] || "—"}
          </span>
        </div>
      </div>

      <Can capability="editPeople">
        <form className="fieldset" onSubmit={(event) => void handleSave(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">Editar dados</legend>
            <TextField
              label="Nome completo"
              name="fullName"
              defaultValue={person.fullName}
              required
            />
            <TextField
              label="Gênero"
              name="gender"
              defaultValue={person.gender ?? ""}
            />
            <TextField
              label="Data de nascimento"
              type="date"
              name="birthDate"
              defaultValue={person.birthDate ?? ""}
            />
            <TextField
              label="E-mail"
              type="email"
              name="email"
              mask="email"
              defaultValue={person.email ?? ""}
            />
            <TextField
              label="Telefone"
              name="phone"
              mask="phone"
              defaultValue={person.phone ?? ""}
            />
            <Can capability="viewPersonObservations">
              <TextareaField
                label="Observações"
                name="observations"
                rows={4}
                defaultValue={person.observations ?? ""}
              />
            </Can>
            <Button
              type="submit"
              icon={Save}
              loading={busy}
              loadingLabel="Salvando…"
            >
              Salvar alterações
            </Button>
          </fieldset>
        </form>
      </Can>

      <Can capability="changePersonStatus">
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          {person.status === "ACTIVE" ? (
            <Button
              variant="danger"
              icon={UserX}
              onClick={() => setConfirmInactivate(true)}
            >
              Inativar pessoa
            </Button>
          ) : null}
        </div>
      </Can>

      <Dialog
        open={confirmInactivate}
        onClose={() => setConfirmInactivate(false)}
        title="Inativar pessoa"
        description="A pessoa deixará de aparecer nas listagens e não poderá ser vinculada a células enquanto estiver inativa. Você poderá reativá-la a partir da listagem."
      >
        <div className="dialog-panel__actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmInactivate(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            icon={UserX}
            loading={busy}
            loadingLabel="Inativando…"
            onClick={() => void runInactivate()}
          >
            Inativar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
